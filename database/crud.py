import uuid
import random
from datetime import datetime, timedelta
from typing import List, Optional, Union, Dict, Any
from bson import ObjectId

from . import models, schemas


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

async def get_user(user_id: Union[str, int, ObjectId]) -> Optional[models.UserDoc]:
    """Retrieve user by MongoDB ObjectId or username fallback."""
    oid = _to_object_id(user_id)
    if oid:
        user = await models.UserDoc.get(oid)
        if user:
            return user
    # Fallback search by username
    return await models.UserDoc.find_one(models.UserDoc.username == str(user_id))


async def get_user_by_username(username: str) -> Optional[models.UserDoc]:
    """Retrieve user by exact username."""
    return await models.UserDoc.find_one(models.UserDoc.username == username.strip())


async def get_user_by_email(email: str) -> Optional[models.UserDoc]:
    """Retrieve user by exact email."""
    return await models.UserDoc.find_one(models.UserDoc.email == email.strip().lower())


async def create_user(user: schemas.UserCreate) -> models.UserDoc:
    """Create and insert a new user profile document in MongoDB."""
    db_user = models.UserDoc(
        username=user.username.strip(),
        email=user.email.strip().lower(),
        role=user.role or "professional",
        is_onboarded=user.is_onboarded if user.is_onboarded is not None else 0,
        age=user.age or 25,
        retirement_goal_age=user.retirement_goal_age or 60,
        target_net_worth=user.target_net_worth or 1000000.0,
        monthly_income=user.monthly_income or 5000.0,
        monthly_expenses=user.monthly_expenses or 2900.0,
        net_worth=user.net_worth or 15000.0,
        sleep_target_hours=user.sleep_target_hours or 8.0,
        study_target_hours_week=user.study_target_hours_week or 15.0
    )
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
    await db_user.delete()
    return True


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
# Mock Data Seeder
# ──────────────────────────────────────────────

async def seed_mock_data(user_id: Union[str, int]):
    """Seed 30 days of realistic biometric, financial, and study logs in MongoDB."""
    user = await get_user(user_id)
    if not user:
        return
    u_id_str = str(user.id)

    # Check if already seeded
    existing_habits = await models.HabitRecordDoc.find_one(models.HabitRecordDoc.user_id == u_id_str)
    if existing_habits:
        return

    now = datetime.utcnow()
    habit_docs = []
    study_docs = []
    fin_docs = []

    for i in range(30, 0, -1):
        log_date = now - timedelta(days=i)

        # Habit records
        sleep_h = round(random.uniform(6.5, 9.0), 1)
        screen_h = round(random.uniform(2.0, 5.5), 1)
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
        if random.random() > 0.25:
            study_docs.append(models.StudyRecordDoc(
                user_id=u_id_str,
                subject=random.choice(["Deep Architecture", "System Design", "Cloud Infrastructure", "Algorithms"]),
                duration_minutes=random.choice([45, 60, 90, 120]),
                focus_score=random.randint(6, 9),
                exam_score=random.choice([None, None, round(random.uniform(75, 98), 1)]),
                session_type="study",
                created_at=log_date
            ))

        # Monthly income / expenses
        if i in [1, 15, 30]:
            fin_docs.append(models.FinancialRecordDoc(
                user_id=u_id_str,
                category="Income" if i == 1 else "Fixed Expense",
                description="Salary Allocation" if i == 1 else "Living Expenses",
                amount=user.monthly_income if i == 1 else (user.monthly_expenses / 2.0),
                record_date=log_date
            ))

    if habit_docs:
        await models.HabitRecordDoc.insert_many(habit_docs)
    if study_docs:
        await models.StudyRecordDoc.insert_many(study_docs)
    if fin_docs:
        await models.FinancialRecordDoc.insert_many(fin_docs)

    # Seed default suggestions
    await reset_user_suggestions(u_id_str, user.role or "professional")
