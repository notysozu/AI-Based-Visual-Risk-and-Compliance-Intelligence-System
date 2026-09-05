import uuid
import random
from datetime import datetime, timedelta
from typing import List, Optional, Union, Dict, Any
from bson import ObjectId

from . import models, schemas
from backend.security.crypto import hash_token, hash_password


def _to_object_id(val: Any) -> Optional[ObjectId]:
    if not val:
        return None
    s = str(val).strip()
    if ObjectId.is_valid(s):
        return ObjectId(s)
    return None


# ──────────────────────────────────────────────
# User Operations
# ──────────────────────────────────────────────

async def get_user(user_id: Union[str, int, ObjectId, None]) -> Optional[models.UserDoc]:
    """Retrieve user by MongoDB ObjectId or username fallback, with guest/demo fallback."""
    if not user_id:
        user = await models.UserDoc.find_one(models.UserDoc.username == "default_twin")
        if user:
            return user
        return await get_or_create_demo_user("professional")

    s_val = str(user_id).strip()
    if s_val in ("1", "default", "default_twin", "0", "guest", "null", "undefined", ""):
        user = await models.UserDoc.find_one(models.UserDoc.username == "default_twin")
        if user:
            return user
        return await get_or_create_demo_user("professional")

    oid = _to_object_id(s_val)
    if oid:
        user = await models.UserDoc.get(oid)
        if user:
            return user

    # Fallback search by username
    user = await models.UserDoc.find_one(models.UserDoc.username == s_val)
    if user:
        return user

    # If numeric or short id not found, fallback to default demo user
    if s_val.isdigit() or len(s_val) < 5:
        return await get_or_create_demo_user("professional")

    return None


async def get_user_by_username(username: str) -> Optional[models.UserDoc]:
    """Retrieve user by exact username."""
    return await models.UserDoc.find_one(models.UserDoc.username == username.strip())


async def get_user_by_email(email: str) -> Optional[models.UserDoc]:
    """Retrieve user by exact email."""
    return await models.UserDoc.find_one(models.UserDoc.email == email.strip().lower())


async def create_user(user: schemas.UserCreate) -> models.UserDoc:
    """Create and insert a new user profile document in MongoDB."""
    user_dict = user.model_dump()
    user_dict["username"] = user.username.strip()
    user_dict["email"] = user.email.strip().lower()
    
    # Securely hash plaintext password if passed
    if "password" in user_dict and user_dict["password"]:
        if not user_dict.get("password_hash"):
            user_dict["password_hash"] = hash_password(user_dict["password"])
        del user_dict["password"]
    elif "password" in user_dict:
        del user_dict["password"]

    if not user_dict.get("updated_at"):
        user_dict["updated_at"] = datetime.utcnow()

    db_user = models.UserDoc(**user_dict)
    await db_user.insert()
    return db_user


async def update_user(user_id: Union[str, int], user_update: schemas.UserUpdate) -> Optional[models.UserDoc]:
    """Update user document attributes in MongoDB."""
    db_user = await get_user(user_id)
    if not db_user:
        return None

    update_dict = user_update.model_dump(exclude_unset=True)
    if not update_dict:
        return db_user

    for key, value in update_dict.items():
        setattr(db_user, key, value)

    db_user.updated_at = datetime.utcnow()
    await db_user.save()
    return db_user


async def delete_user(user_id: Union[str, int]) -> bool:
    """Delete user document and all associated records from MongoDB."""
    db_user = await get_user(user_id)
    if not db_user:
        return False

    u_id_str = str(db_user.id)
    await models.FinancialRecordDoc.find(models.FinancialRecordDoc.user_id == u_id_str).delete()
    await models.HabitRecordDoc.find(models.HabitRecordDoc.user_id == u_id_str).delete()
    await models.StudyRecordDoc.find(models.StudyRecordDoc.user_id == u_id_str).delete()
    await models.UserSuggestionDoc.find(models.UserSuggestionDoc.user_id == u_id_str).delete()
    await models.ChatSessionDoc.find(models.ChatSessionDoc.user_id == u_id_str).delete()
    await models.RefreshTokenDoc.find(models.RefreshTokenDoc.user_id == u_id_str).delete()
    await models.PasswordResetTokenDoc.find(models.PasswordResetTokenDoc.user_id == u_id_str).delete()
    await models.EmailVerificationTokenDoc.find(models.EmailVerificationTokenDoc.user_id == u_id_str).delete()
    await db_user.delete()
    return True


# ──────────────────────────────────────────────
# Authentication & Token Operations
# ──────────────────────────────────────────────

async def save_refresh_token(
    user_id: Union[str, int],
    token_hash: str,
    token_family: str,
    expires_at: datetime,
    ip_address: Optional[str] = None,
    device_info: Optional[str] = None
) -> models.RefreshTokenDoc:
    """Persist a hashed refresh token tied to a token family."""
    doc = models.RefreshTokenDoc(
        user_id=str(user_id),
        token_hash=token_hash,
        token_family=token_family,
        is_revoked=False,
        ip_address=ip_address,
        device_info=device_info,
        expires_at=expires_at
    )
    await doc.insert()
    return doc


async def get_refresh_token_by_hash(token_hash: str) -> Optional[models.RefreshTokenDoc]:
    """Look up a refresh token record by its SHA-256 hash."""
    return await models.RefreshTokenDoc.find_one(models.RefreshTokenDoc.token_hash == token_hash)


async def revoke_refresh_token(token_hash: str, revoked_by_ip: Optional[str] = None) -> Optional[models.RefreshTokenDoc]:
    """Mark a single refresh token as revoked."""
    doc = await get_refresh_token_by_hash(token_hash)
    if doc:
        doc.is_revoked = True
        doc.revoked_at = datetime.utcnow()
        doc.revoked_by_ip = revoked_by_ip
        await doc.save()
    return doc


async def revoke_refresh_token_family(token_family: str, revoked_by_ip: Optional[str] = None) -> int:
    """
    Revoke all refresh tokens in a family when reuse or theft is detected.
    Returns the count of tokens marked revoked.
    """
    now = datetime.utcnow()
    tokens = await models.RefreshTokenDoc.find(models.RefreshTokenDoc.token_family == token_family).to_list()
    count = 0
    for tok in tokens:
        if not tok.is_revoked:
            tok.is_revoked = True
            tok.revoked_at = now
            tok.revoked_by_ip = revoked_by_ip
            await tok.save()
            count += 1
    return count


async def revoke_all_user_refresh_tokens(user_id: Union[str, int]) -> int:
    """
    Revoke all active refresh tokens for a user across all devices.
    Used for logout-all, password reset, or compromise lockdown.
    """
    u_id_str = str(user_id)
    tokens = await models.RefreshTokenDoc.find(
        models.RefreshTokenDoc.user_id == u_id_str,
        models.RefreshTokenDoc.is_revoked == False
    ).to_list()
    now = datetime.utcnow()
    count = 0
    for tok in tokens:
        tok.is_revoked = True
        tok.revoked_at = now
        await tok.save()
        count += 1
    return count


async def create_password_reset_token(user_id: Union[str, int], raw_token: str, expires_minutes: int = 15) -> models.PasswordResetTokenDoc:
    """Create and persist single-use password reset token."""
    thash = hash_token(raw_token)
    doc = models.PasswordResetTokenDoc(
        user_id=str(user_id),
        token_hash=thash,
        is_used=False,
        expires_at=datetime.utcnow() + timedelta(minutes=expires_minutes)
    )
    await doc.insert()
    return doc


async def get_password_reset_token(raw_token: str) -> Optional[models.PasswordResetTokenDoc]:
    """Retrieve password reset token by raw token value."""
    thash = hash_token(raw_token)
    return await models.PasswordResetTokenDoc.find_one(models.PasswordResetTokenDoc.token_hash == thash)


async def mark_password_reset_token_used(token_doc: models.PasswordResetTokenDoc) -> models.PasswordResetTokenDoc:
    """Mark a password reset token as used."""
    token_doc.is_used = True
    token_doc.used_at = datetime.utcnow()
    await token_doc.save()
    return token_doc


async def create_email_verification_token(user_id: Union[str, int], raw_token: str, expires_hours: int = 24) -> models.EmailVerificationTokenDoc:
    """Create and persist single-use email verification token."""
    thash = hash_token(raw_token)
    doc = models.EmailVerificationTokenDoc(
        user_id=str(user_id),
        token_hash=thash,
        is_used=False,
        expires_at=datetime.utcnow() + timedelta(hours=expires_hours)
    )
    await doc.insert()
    return doc


async def get_email_verification_token(raw_token: str) -> Optional[models.EmailVerificationTokenDoc]:
    """Retrieve email verification token by raw token value."""
    thash = hash_token(raw_token)
    return await models.EmailVerificationTokenDoc.find_one(models.EmailVerificationTokenDoc.token_hash == thash)


async def mark_email_verification_token_used(token_doc: models.EmailVerificationTokenDoc) -> models.EmailVerificationTokenDoc:
    """Mark an email verification token as used."""
    token_doc.is_used = True
    token_doc.used_at = datetime.utcnow()
    await token_doc.save()
    return token_doc


# ──────────────────────────────────────────────
# Financial Record Operations
# ──────────────────────────────────────────────

async def get_financial_records(user_id: Union[str, int], limit: int = 100, offset: int = 0) -> List[models.FinancialRecordDoc]:
    user = await get_user(user_id)
    u_id_str = str(user.id) if user else str(user_id)
    return await models.FinancialRecordDoc.find(
        models.FinancialRecordDoc.user_id == u_id_str
    ).sort(-models.FinancialRecordDoc.record_date).skip(offset).limit(limit).to_list()


async def create_financial_record(record: schemas.FinancialRecordCreate, user_id: Union[str, int]) -> models.FinancialRecordDoc:
    user = await get_user(user_id)
    u_id_str = str(user.id) if user else str(user_id)
    doc = models.FinancialRecordDoc(
        user_id=u_id_str,
        category=record.category,
        description=record.description,
        amount=record.amount,
        record_date=record.record_date or datetime.utcnow()
    )
    await doc.insert()
    return doc


async def get_financial_record(record_id: Union[str, int]) -> Optional[models.FinancialRecordDoc]:
    oid = _to_object_id(record_id)
    if oid:
        return await models.FinancialRecordDoc.get(oid)
    return None


async def update_financial_record(record_id: Union[str, int], record_update: Any) -> Optional[models.FinancialRecordDoc]:
    doc = await get_financial_record(record_id)
    if not doc:
        return None
    data = record_update.model_dump(exclude_unset=True) if hasattr(record_update, "model_dump") else dict(record_update)
    for k, v in data.items():
        setattr(doc, k, v)
    await doc.save()
    return doc


async def delete_financial_record(record_id: Union[str, int]) -> bool:
    doc = await get_financial_record(record_id)
    if not doc:
        return False
    await doc.delete()
    return True


# ──────────────────────────────────────────────
# Habit Record Operations
# ──────────────────────────────────────────────

async def get_habit_records(user_id: Union[str, int], limit: int = 100, offset: int = 0) -> List[models.HabitRecordDoc]:
    user = await get_user(user_id)
    u_id_str = str(user.id) if user else str(user_id)
    return await models.HabitRecordDoc.find(
        models.HabitRecordDoc.user_id == u_id_str
    ).sort(-models.HabitRecordDoc.created_at).skip(offset).limit(limit).to_list()


async def create_habit_record(record: schemas.HabitRecordCreate, user_id: Union[str, int]) -> models.HabitRecordDoc:
    user = await get_user(user_id)
    u_id_str = str(user.id) if user else str(user_id)
    doc = models.HabitRecordDoc(
        user_id=u_id_str,
        habit_name=record.habit_name,
        duration_minutes=record.duration_minutes,
        impact_score=record.impact_score,
        created_at=record.created_at or datetime.utcnow()
    )
    await doc.insert()
    return doc


async def get_habit_record(record_id: Union[str, int]) -> Optional[models.HabitRecordDoc]:
    oid = _to_object_id(record_id)
    if oid:
        return await models.HabitRecordDoc.get(oid)
    return None


async def update_habit_record(record_id: Union[str, int], record_update: Any) -> Optional[models.HabitRecordDoc]:
    doc = await get_habit_record(record_id)
    if not doc:
        return None
    data = record_update.model_dump(exclude_unset=True) if hasattr(record_update, "model_dump") else dict(record_update)
    for k, v in data.items():
        setattr(doc, k, v)
    await doc.save()
    return doc


async def delete_habit_record(record_id: Union[str, int]) -> bool:
    doc = await get_habit_record(record_id)
    if not doc:
        return False
    await doc.delete()
    return True


# ──────────────────────────────────────────────
# Study Record Operations
# ──────────────────────────────────────────────

async def get_study_records(user_id: Union[str, int], limit: int = 100, offset: int = 0) -> List[models.StudyRecordDoc]:
    user = await get_user(user_id)
    u_id_str = str(user.id) if user else str(user_id)
    return await models.StudyRecordDoc.find(
        models.StudyRecordDoc.user_id == u_id_str
    ).sort(-models.StudyRecordDoc.created_at).skip(offset).limit(limit).to_list()


async def create_study_record(record: schemas.StudyRecordCreate, user_id: Union[str, int]) -> models.StudyRecordDoc:
    user = await get_user(user_id)
    u_id_str = str(user.id) if user else str(user_id)
    doc = models.StudyRecordDoc(
        user_id=u_id_str,
        subject=record.subject,
        duration_minutes=record.duration_minutes,
        focus_score=record.focus_score,
        exam_score=record.exam_score,
        notes=record.notes,
        session_type=record.session_type or "study",
        created_at=record.created_at or datetime.utcnow()
    )
    await doc.insert()
    return doc


async def get_study_record(record_id: Union[str, int]) -> Optional[models.StudyRecordDoc]:
    oid = _to_object_id(record_id)
    if oid:
        return await models.StudyRecordDoc.get(oid)
    return None


async def update_study_record(record_id: Union[str, int], record_update: Any) -> Optional[models.StudyRecordDoc]:
    doc = await get_study_record(record_id)
    if not doc:
        return None
    data = record_update.model_dump(exclude_unset=True) if hasattr(record_update, "model_dump") else dict(record_update)
    for k, v in data.items():
        setattr(doc, k, v)
    await doc.save()
    return doc


async def delete_study_record(record_id: Union[str, int]) -> bool:
    doc = await get_study_record(record_id)
    if not doc:
        return False
    await doc.delete()
    return True


# ──────────────────────────────────────────────
# Suggestion Operations
# ──────────────────────────────────────────────

ROLE_DEFAULT_SUGGESTIONS = {
    "student": [
        {"suggestion_id": "student-study-sprint", "title": "Morning Library & Study Block", "category": "Study", "detail": "Block 60 minutes for hardest coursework topic before campus distractions.", "impact": "+1.2 focus", "start_time": "08:00", "duration_minutes": 60, "is_ai_generated": 0},
        {"suggestion_id": "student-pocket-budget", "title": "Micro-Savings Target", "category": "Finance", "detail": "Automate $25/week transfer to high-yield student emergency fund.", "impact": "+$100/mo reserve", "start_time": "18:00", "duration_minutes": 15, "is_ai_generated": 0},
        {"suggestion_id": "student-sleep-sync", "title": "Exam Prep Wind-Down", "category": "Vitality", "detail": "Maintain consistent 23:00 sleep schedule to improve memory consolidation.", "impact": "+0.8 exam focus", "start_time": "22:30", "duration_minutes": 30, "is_ai_generated": 0}
    ],
    "professional": [
        {"suggestion_id": "prof-deep-work", "title": "Morning Architecture Deep Work", "category": "Focus", "detail": "Block 90 minutes for strategic design before morning standups.", "impact": "+2.0 focus", "start_time": "09:00", "duration_minutes": 90, "is_ai_generated": 0},
        {"suggestion_id": "prof-surplus-sweep", "title": "Automate Monthly Surplus Sweep", "category": "Finance", "detail": "Transfer $1,500 on payday directly into tax-advantaged index funds.", "impact": "+$48k 5-Yr Net Worth", "start_time": "17:00", "duration_minutes": 15, "is_ai_generated": 0},
        {"suggestion_id": "prof-circadian-lock", "title": "Circadian Alertness Lock", "category": "Vitality", "detail": "Maintain consistent sleep baseline to optimize REM recovery.", "impact": "+1.5 Vitality", "start_time": "22:30", "duration_minutes": 30, "is_ai_generated": 0}
    ],
    "freelancer": [
        {"suggestion_id": "free-client-sprint", "title": "High-Value Client Sprint", "category": "Focus", "detail": "Dedicate 2.5 hours of uninterrupted delivery for top tier client.", "impact": "+$500/day pace", "start_time": "09:30", "duration_minutes": 150, "is_ai_generated": 0},
        {"suggestion_id": "free-tax-reserve", "title": "Automate 25% Tax & Buffer Sweep", "category": "Finance", "detail": "Move 25% of all received invoice payments to liquid tax escrow.", "impact": "Zero quarterly friction", "start_time": "16:00", "duration_minutes": 15, "is_ai_generated": 0}
    ],
    "entrepreneur": [
        {"suggestion_id": "ent-product-sprint", "title": "Core Product Roadmap Sprint", "category": "Focus", "detail": "Execute 2-hour uninterrupted build sprint on critical feature milestone.", "impact": "+1.8 Execution", "start_time": "08:30", "duration_minutes": 120, "is_ai_generated": 0},
        {"suggestion_id": "ent-runway-check", "title": "Weekly Runway & Burn Review", "category": "Finance", "detail": "Review 6-month cash trajectory and CAC/LTV unit metrics.", "impact": "+3 Months Runway", "start_time": "16:30", "duration_minutes": 30, "is_ai_generated": 0}
    ],
    "retiree": [
        {"suggestion_id": "ret-morning-walk", "title": "Daily Sunshine Vitality Walk", "category": "Vitality", "detail": "Enjoy a 45-minute morning walk to support joint health and mood.", "impact": "+1.5 Vitality", "start_time": "08:00", "duration_minutes": 45, "is_ai_generated": 0},
        {"suggestion_id": "ret-portfolio-draw", "title": "Quarterly Safe Drawdown Audit", "category": "Finance", "detail": "Ensure distribution remains under 3.5% annualized baseline.", "impact": "Capital longevity", "start_time": "15:00", "duration_minutes": 30, "is_ai_generated": 0}
    ]
}

DEFAULT_ROLE_SUGGESTIONS = ROLE_DEFAULT_SUGGESTIONS


async def get_user_suggestions(user_id: Union[str, int]) -> List[models.UserSuggestionDoc]:
    user = await get_user(user_id)
    u_id_str = str(user.id) if user else str(user_id)
    return await models.UserSuggestionDoc.find(
        models.UserSuggestionDoc.user_id == u_id_str
    ).sort(+models.UserSuggestionDoc.created_at).to_list()


async def adopt_user_suggestion(user_id: Union[str, int], suggestion_id: str, is_adopted: bool = True) -> Optional[models.UserSuggestionDoc]:
    user = await get_user(user_id)
    u_id_str = str(user.id) if user else str(user_id)
    doc = await models.UserSuggestionDoc.find_one(
        models.UserSuggestionDoc.user_id == u_id_str,
        models.UserSuggestionDoc.suggestion_id == suggestion_id
    )
    if not doc:
        # Fallback by MongoDB ObjectId
        oid = _to_object_id(suggestion_id)
        if oid:
            doc = await models.UserSuggestionDoc.get(oid)

    if doc:
        doc.is_adopted = 1 if is_adopted else 0
        await doc.save()
    return doc


async def reset_user_suggestions(user_id: Union[str, int], role: str = "professional") -> List[models.UserSuggestionDoc]:
    user = await get_user(user_id)
    u_id_str = str(user.id) if user else str(user_id)
    await models.UserSuggestionDoc.find(models.UserSuggestionDoc.user_id == u_id_str).delete()

    defaults = ROLE_DEFAULT_SUGGESTIONS.get(role.lower(), ROLE_DEFAULT_SUGGESTIONS["professional"])
    docs = []
    for d in defaults:
        doc = models.UserSuggestionDoc(
            user_id=u_id_str,
            suggestion_id=d["suggestion_id"],
            title=d["title"],
            category=d.get("category", "Focus"),
            detail=d.get("detail", ""),
            impact=d.get("impact", "+1.0 focus"),
            start_time=d.get("start_time", "09:00"),
            duration_minutes=d.get("duration_minutes", 30),
            is_adopted=0,
            is_ai_generated=d.get("is_ai_generated", 0)
        )
        await doc.insert()
        docs.append(doc)
    return docs


async def create_user_suggestion(user_id: Union[str, int], item: Dict[str, Any]) -> models.UserSuggestionDoc:
    user = await get_user(user_id)
    u_id_str = str(user.id) if user else str(user_id)
    doc = models.UserSuggestionDoc(
        user_id=u_id_str,
        suggestion_id=item.get("suggestion_id") or f"sug-{uuid.uuid4().hex[:6]}",
        title=item.get("title", "Lifestyle Adjustment"),
        category=item.get("category", "Focus"),
        detail=item.get("detail", item.get("description", "")),
        impact=item.get("impact", "+1.0 focus"),
        start_time=item.get("start_time", "09:00"),
        duration_minutes=int(item.get("duration_minutes", 30)),
        is_adopted=1 if item.get("is_adopted") else 0,
        is_ai_generated=1
    )
    await doc.insert()
    return doc


# ──────────────────────────────────────────────
# Chat Operations
# ──────────────────────────────────────────────

async def get_chat_sessions(user_id: Union[str, int]) -> List[models.ChatSessionDoc]:
    user = await get_user(user_id)
    u_id_str = str(user.id) if user else str(user_id)
    return await models.ChatSessionDoc.find(
        models.ChatSessionDoc.user_id == u_id_str
    ).sort(-models.ChatSessionDoc.updated_at).to_list()


async def get_chat_session(session_id: Union[str, int]) -> Optional[models.ChatSessionDoc]:
    oid = _to_object_id(session_id)
    if oid:
        return await models.ChatSessionDoc.get(oid)
    return None


async def create_chat_session(user_id: Union[str, int], title: str = "New Conversation") -> models.ChatSessionDoc:
    user = await get_user(user_id)
    u_id_str = str(user.id) if user else str(user_id)
    session = models.ChatSessionDoc(
        user_id=u_id_str,
        title=title,
        messages=[]
    )
    await session.insert()
    return session


async def create_chat_message(
    session_id: Union[str, int],
    role: str,
    content: str,
    action_type: str = "none",
    action_payload: Optional[str] = None,
    action_status: str = "none"
) -> Optional[models.ChatMessageDoc]:
    session = await get_chat_session(session_id)
    if not session:
        return None

    msg = models.ChatMessageDoc(
        role=role,
        content=content,
        action_type=action_type,
        action_payload=action_payload,
        action_status=action_status
    )
    session.messages.append(msg)
    session.updated_at = datetime.utcnow()
    await session.save()
    return msg


async def delete_chat_session(session_id: Union[str, int], user_id: Optional[Union[str, int]] = None) -> bool:
    session = await get_chat_session(session_id)
    if not session:
        return False
    if user_id:
        user = await get_user(user_id)
        u_id_str = str(user.id) if user else str(user_id)
        if session.user_id != u_id_str:
            return False
    await session.delete()
    return True


async def update_chat_message_status(
    message_id: str,
    action_status: str,
    user_id: Optional[Union[str, int]] = None
) -> Optional[models.ChatMessageDoc]:
    """Find message across sessions and update action_status."""
    query = {"messages.id": str(message_id)}
    if user_id:
        user = await get_user(user_id)
        u_id_str = str(user.id) if user else str(user_id)
        query["user_id"] = u_id_str

    session = await models.ChatSessionDoc.find_one(query)
    if not session:
        return None

    target_msg = None
    for m in session.messages:
        if m.id == str(message_id):
            m.action_status = action_status
            target_msg = m
            break

    if target_msg:
        session.updated_at = datetime.utcnow()
        await session.save()
    return target_msg


# ──────────────────────────────────────────────
# Demo Persona Specifications & Mock Data Seeder
# ──────────────────────────────────────────────

DEMO_PERSONA_SPECS: Dict[str, Dict[str, Any]] = {
    "student": {
        "username": "student_demo",
        "email": "student.demo@twin.local",
        "role": "student",
        "is_onboarded": 1,
        "age": 20,
        "retirement_goal_age": 60,
        "target_net_worth": 250000.0,
        "monthly_income": 1200.0,
        "monthly_expenses": 950.0,
        "net_worth": 3500.0,
        "sleep_target_hours": 8.0,
        "study_target_hours_week": 25.0,
        "exercise_target_days": 3.0,
        "screen_time_target_hours": 4.0,
        "savings_rate_target": 15.0,
        "focus_area": "Academics & Skills",
        "goal_name": "Graduate with Honors & $10k Emergency Fund",
        "goal_current": 3500.0,
        "goal_target": 10000.0,
        "theme_preference": "dark",
        "subjects": ["Data Structures", "Linear Algebra", "Machine Learning", "Operating Systems", "Discrete Math"],
    },
    "freelancer": {
        "username": "freelancer_demo",
        "email": "freelancer.demo@twin.local",
        "role": "freelancer",
        "is_onboarded": 1,
        "age": 28,
        "retirement_goal_age": 55,
        "target_net_worth": 800000.0,
        "monthly_income": 6500.0,
        "monthly_expenses": 3200.0,
        "net_worth": 45000.0,
        "sleep_target_hours": 7.5,
        "study_target_hours_week": 10.0,
        "exercise_target_days": 4.0,
        "screen_time_target_hours": 6.0,
        "savings_rate_target": 30.0,
        "focus_area": "Income Consistency",
        "goal_name": "6-Month Runway Buffer",
        "goal_current": 18000.0,
        "goal_target": 30000.0,
        "theme_preference": "dark",
        "subjects": ["Client Consulting", "Full-Stack Design", "Contract Negotiation", "API Engineering", "Cloud Hosting"],
    },
    "entrepreneur": {
        "username": "founder_demo",
        "email": "founder.demo@twin.local",
        "role": "entrepreneur",
        "is_onboarded": 1,
        "age": 32,
        "retirement_goal_age": 50,
        "target_net_worth": 3000000.0,
        "monthly_income": 12000.0,
        "monthly_expenses": 5500.0,
        "net_worth": 180000.0,
        "sleep_target_hours": 6.5,
        "study_target_hours_week": 8.0,
        "exercise_target_days": 4.0,
        "screen_time_target_hours": 7.0,
        "savings_rate_target": 40.0,
        "focus_area": "Scale & Health",
        "goal_name": "Seed Round Expansion & $500k ARR",
        "goal_current": 150000.0,
        "goal_target": 500000.0,
        "theme_preference": "dark",
        "subjects": ["Product Strategy", "Venture Finance", "Team Leadership", "GTM Sales", "Investor Pitching"],
    },
    "retiree": {
        "username": "retiree_demo",
        "email": "retiree.demo@twin.local",
        "role": "retiree",
        "is_onboarded": 1,
        "age": 62,
        "retirement_goal_age": 65,
        "target_net_worth": 1500000.0,
        "monthly_income": 4500.0,
        "monthly_expenses": 2800.0,
        "net_worth": 1350000.0,
        "sleep_target_hours": 8.0,
        "study_target_hours_week": 5.0,
        "exercise_target_days": 5.0,
        "screen_time_target_hours": 3.0,
        "savings_rate_target": 10.0,
        "focus_area": "Longevity & Wealth",
        "goal_name": "Capital Preservation & Active Longevity",
        "goal_current": 1350000.0,
        "goal_target": 1500000.0,
        "theme_preference": "dark",
        "subjects": ["Portfolio Balancing", "Health & Longevity", "Estate Planning", "Creative Writing", "Nutrition Science"],
    },
    "professional": {
        "username": "pro_demo",
        "email": "pro.demo@twin.local",
        "role": "professional",
        "is_onboarded": 1,
        "age": 29,
        "retirement_goal_age": 58,
        "target_net_worth": 1200000.0,
        "monthly_income": 8500.0,
        "monthly_expenses": 3800.0,
        "net_worth": 95000.0,
        "sleep_target_hours": 7.5,
        "study_target_hours_week": 12.0,
        "exercise_target_days": 4.0,
        "screen_time_target_hours": 5.5,
        "savings_rate_target": 35.0,
        "focus_area": "Career & Savings",
        "goal_name": "Senior Staff Promotion & $250k Liquid Portfolio",
        "goal_current": 95000.0,
        "goal_target": 250000.0,
        "theme_preference": "dark",
        "subjects": ["Deep Architecture", "Distributed Systems", "Cloud Infrastructure", "System Design", "Engineering Management"],
    },
}


def _normalize_role(role: Optional[str]) -> str:
    r = (role or "professional").lower().strip()
    if r in ["founder", "creator"]:
        return "entrepreneur"
    if r in ["pro", "engineer"]:
        return "professional"
    if r not in DEMO_PERSONA_SPECS:
        return "professional"
    return r


async def get_or_create_demo_user(role: str = "professional") -> models.UserDoc:
    """Get existing or seed a dedicated, role-specific demo user document in MongoDB."""
    norm_role = _normalize_role(role)
    spec = DEMO_PERSONA_SPECS[norm_role]
    username = spec["username"]

    user = await get_user_by_username(username=username)
    if not user:
        user_create_data = {k: v for k, v in spec.items() if k != "subjects"}
        user_create = schemas.UserCreate(**user_create_data)
        user = await create_user(user_create)
        await seed_mock_data(user.id, role=norm_role)
    else:
        u_id_str = str(user.id)
        existing_habits = await models.HabitRecordDoc.find_one(models.HabitRecordDoc.user_id == u_id_str)
        if not existing_habits:
            await seed_mock_data(user.id, role=norm_role)

    return user


async def seed_mock_data(user_id: Union[str, int], role: Optional[str] = None):
    """Seed 30 days of realistic biometric, financial, and study logs in MongoDB."""
    user = await get_user(user_id)
    if not user:
        return
    u_id_str = str(user.id)

    # Check if already seeded
    existing_habits = await models.HabitRecordDoc.find_one(models.HabitRecordDoc.user_id == u_id_str)
    if existing_habits:
        return

    active_role = _normalize_role(role or user.role)
    spec = DEMO_PERSONA_SPECS.get(active_role, DEMO_PERSONA_SPECS["professional"])
    subjects = spec.get("subjects", ["Deep Architecture", "System Design", "Cloud Infrastructure", "Algorithms"])

    now = datetime.utcnow()
    habit_docs = []
    study_docs = []
    fin_docs = []

    for i in range(30, 0, -1):
        log_date = now - timedelta(days=i)

        # Habit records tailored to persona
        sleep_base = user.sleep_target_hours or spec.get("sleep_target_hours", 7.5)
        sleep_h = round(random.uniform(max(5.0, sleep_base - 1.2), min(10.0, sleep_base + 1.0)), 1)
        screen_base = user.screen_time_target_hours or spec.get("screen_time_target_hours", 5.0)
        screen_h = round(random.uniform(max(1.5, screen_base - 1.5), min(10.0, screen_base + 1.5)), 1)
        ex_min = random.choice([0, 30, 45, 60, 75])

        habit_docs.append(models.HabitRecordDoc(
            user_id=u_id_str,
            habit_name="Sleep",
            duration_minutes=int(sleep_h * 60),
            impact_score=random.randint(6, 9),
            created_at=log_date
        ))
        habit_docs.append(models.HabitRecordDoc(
            user_id=u_id_str,
            habit_name="Screen Time",
            duration_minutes=int(screen_h * 60),
            impact_score=random.randint(4, 8),
            created_at=log_date
        ))
        if ex_min > 0:
            habit_docs.append(models.HabitRecordDoc(
                user_id=u_id_str,
                habit_name="Exercise",
                duration_minutes=ex_min,
                impact_score=random.randint(7, 10),
                created_at=log_date
            ))

        # Study records
        study_chance = 0.85 if active_role in ["student", "professional"] else 0.5
        if random.random() < study_chance:
            study_docs.append(models.StudyRecordDoc(
                user_id=u_id_str,
                subject=random.choice(subjects),
                duration_minutes=random.choice([45, 60, 90, 120]),
                focus_score=random.randint(7, 10),
                exam_score=random.choice([None, None, round(random.uniform(80, 98), 1)]),
                session_type="study",
                created_at=log_date
            ))

        # Monthly income / expenses
        if i in [1, 15, 30]:
            fin_docs.append(models.FinancialRecordDoc(
                user_id=u_id_str,
                category="Income" if i == 1 else "Fixed Expense",
                description="Monthly Inflow" if i == 1 else "Living Expenses",
                amount=user.monthly_income if i == 1 else (user.monthly_expenses / 2.0 if user.monthly_expenses else 1500.0),
                record_date=log_date
            ))

    if habit_docs:
        await models.HabitRecordDoc.insert_many(habit_docs)
    if study_docs:
        await models.StudyRecordDoc.insert_many(study_docs)
    if fin_docs:
        await models.FinancialRecordDoc.insert_many(fin_docs)

    # Seed default suggestions
    await reset_user_suggestions(u_id_str, active_role)


# ──────────────────────────────────────────────
# Application Intelligence Cache Operations
# ──────────────────────────────────────────────

async def set_cache(
    cache_key: str,
    data: Dict[str, Any],
    user_id: Optional[str] = None,
    ttl_seconds: Optional[int] = None
) -> models.AppCacheDoc:
    """Store or update cached payload in MongoDB app_cache collection."""
    now = datetime.utcnow()
    expires_at = now + timedelta(seconds=ttl_seconds) if ttl_seconds else None

    doc = await models.AppCacheDoc.find_one(models.AppCacheDoc.cache_key == cache_key)
    if doc:
        doc.data = data
        if user_id is not None:
            doc.user_id = user_id
        doc.expires_at = expires_at
        doc.updated_at = now
        await doc.save()
        return doc
    else:
        doc = models.AppCacheDoc(
            cache_key=cache_key,
            user_id=user_id,
            data=data,
            expires_at=expires_at,
            created_at=now,
            updated_at=now
        )
        await doc.insert()
        return doc


async def get_cache(cache_key: str) -> Optional[Dict[str, Any]]:
    """Retrieve unexpired cached data from MongoDB."""
    doc = await models.AppCacheDoc.find_one(models.AppCacheDoc.cache_key == cache_key)
    if not doc:
        return None
    if doc.expires_at and doc.expires_at < datetime.utcnow():
        await doc.delete()
        return None
    return doc.data


async def delete_cache(cache_key: str) -> bool:
    """Remove a cache entry from MongoDB."""
    doc = await models.AppCacheDoc.find_one(models.AppCacheDoc.cache_key == cache_key)
    if doc:
        await doc.delete()
        return True
    return False

