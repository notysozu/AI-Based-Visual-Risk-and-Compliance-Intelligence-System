import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import Any
from . import models, schemas

# User operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(
        username=user.username,
        email=user.email,
        role=user.role or "professional",
        is_onboarded=getattr(user, "is_onboarded", 0) if getattr(user, "is_onboarded", None) is not None else 0,
        age=user.age,
        retirement_goal_age=user.retirement_goal_age,
        target_net_worth=user.target_net_worth,
        monthly_income=user.monthly_income,
        monthly_expenses=user.monthly_expenses,
        net_worth=user.net_worth,
        sleep_target_hours=user.sleep_target_hours,
        study_target_hours_week=user.study_target_hours_week
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = get_db_user_or_raise(db, user_id)
    if not db_user:
        return None
    for key, value in user_update.model_dump(exclude_unset=True).items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_db_user_or_raise(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

# Financial operations
def get_financial_records(db: Session, user_id: int, limit: int = 100, offset: int = 0):
    return db.query(models.FinancialRecord)\
        .filter(models.FinancialRecord.user_id == user_id)\
        .order_by(models.FinancialRecord.record_date.desc())\
        .offset(offset).limit(limit).all()

def create_financial_record(db: Session, record: schemas.FinancialRecordCreate, user_id: int):
    db_record = models.FinancialRecord(
        user_id=user_id,
        category=record.category,
        description=record.description,
        amount=record.amount,
        record_date=record.record_date or datetime.utcnow()
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

# Habit operations
def get_habit_records(db: Session, user_id: int, limit: int = 100, offset: int = 0):
    return db.query(models.HabitRecord)\
        .filter(models.HabitRecord.user_id == user_id)\
        .order_by(models.HabitRecord.created_at.desc())\
        .offset(offset).limit(limit).all()

def create_habit_record(db: Session, record: schemas.HabitRecordCreate, user_id: int):
    db_record = models.HabitRecord(
        user_id=user_id,
        habit_name=record.habit_name,
        duration_minutes=record.duration_minutes,
        impact_score=record.impact_score,
        created_at=record.created_at or datetime.utcnow()
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

# Study operations
def get_study_records(db: Session, user_id: int, limit: int = 100, offset: int = 0):
    return db.query(models.StudyRecord)\
        .filter(models.StudyRecord.user_id == user_id)\
        .order_by(models.StudyRecord.created_at.desc())\
        .offset(offset).limit(limit).all()

def create_study_record(db: Session, record: schemas.StudyRecordCreate, user_id: int):
    db_record = models.StudyRecord(
        user_id=user_id,
        subject=record.subject,
        duration_minutes=record.duration_minutes,
        focus_score=record.focus_score,
        exam_score=record.exam_score,
        created_at=record.created_at or datetime.utcnow()
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

# Seed Data helper
def seed_mock_data(db: Session, user_id: int):
    # Check if records exist already
    financials_count = db.query(models.FinancialRecord).filter_by(user_id=user_id).count()
    if financials_count > 0:
        return  # Already seeded
    
    print(f"Seeding mock data for user {user_id}...")
    start_date = datetime.utcnow() - timedelta(days=90)
    
    # 1. Seed Financial Records
    # Monthly Income and Fixed Expenses (logged monthly)
    for m in range(4):
        log_date = start_date + timedelta(days=m * 30)
        # Salary
        db.add(models.FinancialRecord(
            user_id=user_id,
            category="Income",
            description="Monthly Paycheck",
            amount=5000.0,
            record_date=log_date
        ))
        # Fixed Rent/Bill
        db.add(models.FinancialRecord(
            user_id=user_id,
            category="Fixed Expense",
            description="Rent and Utilities",
            amount=1800.0,
            record_date=log_date + timedelta(days=1)
        ))
        # Automatic Investment
        db.add(models.FinancialRecord(
            user_id=user_id,
            category="Investment",
            description="Index Funds Portfolio",
            amount=1000.0,
            record_date=log_date + timedelta(days=5)
        ))
        
    # Weekly Discretionary Expenses and Subscriptions
    for d in range(90):
        log_date = start_date + timedelta(days=d)
        
        # Daily food & fun expenses (occasional)
        if random.random() < 0.7:
            category = "Discretionary Expense"
            desc = random.choice(["Groceries", "Coffee & Diner", "Uber ride", "Amazon order", "Weekend Movie"])
            amount = round(random.uniform(10.0, 75.0), 2)
            db.add(models.FinancialRecord(
                user_id=user_id,
                category=category,
                description=desc,
                amount=amount,
                record_date=log_date
            ))
            
    # 2. Seed Habit Records
    # We log sleep daily, exercise 3x/week, social 2x/week
    for d in range(90):
        log_date = start_date + timedelta(days=d)
        
        # Sleep (Daily)
        # General distribution: mostly 7-8 hours, but sometimes less/more
        sleep_hours = random.choice([6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0])
        # Add correlation: if they sleep more, their impact score is higher
        impact = int(min(10, max(1, sleep_hours + random.uniform(-1, 1))))
        db.add(models.HabitRecord(
            user_id=user_id,
            habit_name="Sleep",
            duration_minutes=int(sleep_hours * 60),
            impact_score=impact,
            created_at=log_date
        ))
        
        # Exercise (3x a week)
        if d % 7 in [1, 3, 5]:
            exercise_duration = random.choice([30, 45, 60, 90])
            # positive impact on wellbeing
            impact = random.choice([7, 8, 9, 10])
            db.add(models.HabitRecord(
                user_id=user_id,
                habit_name="Exercise",
                duration_minutes=exercise_duration,
                impact_score=impact,
                created_at=log_date + timedelta(hours=8)
            ))
            
        # Socializing (2x a week)
        if d % 7 in [5, 6]:
            social_duration = random.choice([120, 180, 240])
            impact = random.choice([6, 7, 8, 9])
            db.add(models.HabitRecord(
                user_id=user_id,
                habit_name="Socializing",
                duration_minutes=social_duration,
                impact_score=impact,
                created_at=log_date + timedelta(hours=18)
            ))

        # Screen Time (Daily)
        screen_minutes = random.choice([120, 180, 240, 300, 360, 420])
        # Higher screen time usually means lower productivity/feeling worse
        impact = int(min(10, max(1, 10 - (screen_minutes // 60) + random.randint(-1, 1))))
        db.add(models.HabitRecord(
            user_id=user_id,
            habit_name="Screen Time",
            duration_minutes=screen_minutes,
            impact_score=impact,
            created_at=log_date + timedelta(hours=12)
        ))

    # 3. Seed Study Records (Logged 4 times a week)
    subjects = ["Data Science", "Economics", "Machine Learning", "System Design"]
    for d in range(90):
        log_date = start_date + timedelta(days=d)
        
        if d % 7 in [0, 2, 4, 6]:
            subject = random.choice(subjects)
            # Study duration
            duration = random.choice([60, 90, 120, 180])
            
            # Focus score correlates with sleep: look up sleep hours for the day
            # (We will simulate correlation: better sleep = higher focus score)
            # For seeding, we just compute it with random noise correlated to sleep
            focus = random.choice([6, 7, 8, 9, 10]) if d % 7 != 0 else random.choice([4, 5, 6, 7])
            
            # Occasional exam score (every 3 weeks)
            exam = None
            if d % 21 == 0:
                exam = float(random.choice([78.0, 84.5, 90.0, 95.0, 98.0]))
                
            db.add(models.StudyRecord(
                user_id=user_id,
                subject=subject,
                duration_minutes=duration,
                focus_score=focus,
                exam_score=exam,
                created_at=log_date + timedelta(hours=14)
            ))

    db.commit()
    print("Seed complete.")


# Single-item CRUD helpers for finance, habit, and study records
def get_financial_record(db: Session, record_id: int):
    return db.query(models.FinancialRecord).filter(models.FinancialRecord.id == record_id).first()

def update_financial_record(db: Session, record_id: int, record_update: Any):
    db_record = get_financial_record(db, record_id)
    if not db_record:
        return None
    db_record.category = record_update.category
    db_record.description = record_update.description
    db_record.amount = record_update.amount
    db.commit()
    db.refresh(db_record)
    return db_record

def delete_financial_record(db: Session, record_id: int):
    db_record = get_financial_record(db, record_id)
    if not db_record:
        return False
    db.delete(db_record)
    db.commit()
    return True

def get_habit_record(db: Session, habit_id: int):
    return db.query(models.HabitRecord).filter(models.HabitRecord.id == habit_id).first()

def update_habit_record(db: Session, habit_id: int, habit_update: Any):
    db_record = get_habit_record(db, habit_id)
    if not db_record:
        return None
    db_record.habit_name = habit_update.habit_name
    db_record.duration_minutes = habit_update.duration_minutes
    db_record.impact_score = habit_update.impact_score
    db.commit()
    db.refresh(db_record)
    return db_record

def delete_habit_record(db: Session, habit_id: int):
    db_record = get_habit_record(db, habit_id)
    if not db_record:
        return False
    db.delete(db_record)
    db.commit()
    return True

def get_study_record(db: Session, record_id: int):
    return db.query(models.StudyRecord).filter(models.StudyRecord.id == record_id).first()

def update_study_record(db: Session, record_id: int, study_update: Any):
    db_record = get_study_record(db, record_id)
    if not db_record:
        return None
    db_record.subject = study_update.subject
    db_record.duration_minutes = study_update.duration_minutes
    db_record.focus_score = study_update.focus_score
    db_record.exam_score = study_update.exam_score
    db.commit()
    db.refresh(db_record)
    return db_record

def delete_study_record(db: Session, record_id: int):
    db_record = get_study_record(db, record_id)
    if not db_record:
        return False
    db.delete(db_record)
    db.commit()
    return True


DEFAULT_ROLE_SUGGESTIONS = {
    "student": [
        {
            "suggestion_id": "stu-spaced-review",
            "title": "Morning Spaced-Repetition Review",
            "category": "Study",
            "detail": "Review yesterday's flashcards and lecture notes within 24h to lock synaptic retention.",
            "impact": "+14% recall score",
            "start_time": "08:30",
            "duration_minutes": 30,
            "is_ai_generated": False
        },
        {
            "suggestion_id": "stu-deep-block",
            "title": "Pre-Noon Deep Problem Solving",
            "category": "Focus",
            "detail": "Tackle hardest algorithmic and mathematical homework before cognitive fatigue sets in.",
            "impact": "+1.6 focus rating",
            "start_time": "10:00",
            "duration_minutes": 75,
            "is_ai_generated": False
        },
        {
            "suggestion_id": "stu-micro-savings",
            "title": "Micro-Allowance Auto-Allocation",
            "category": "Finance",
            "detail": "Set aside 15% of weekly allowance into high-yield student reserve before discretionary outings.",
            "impact": "+$180/term saved",
            "start_time": "18:00",
            "duration_minutes": 15,
            "is_ai_generated": False
        },
        {
            "suggestion_id": "stu-screen-hygiene",
            "title": "Post-Lecture Screen-Free Reset",
            "category": "Vitality",
            "detail": "15-minute campus walk or eye-rest to reset dopamine and mental clarity between classes.",
            "impact": "-0.8h screen strain",
            "start_time": "15:30",
            "duration_minutes": 20,
            "is_ai_generated": False
        }
    ],
    "freelancer": [
        {
            "suggestion_id": "free-deep-sprint",
            "title": "Golden Hour Billable Sprint",
            "category": "Work",
            "detail": "High-intensity client milestone execution with all messaging notifications silenced.",
            "impact": "+$450 weekly output",
            "start_time": "09:00",
            "duration_minutes": 90,
            "is_ai_generated": False
        },
        {
            "suggestion_id": "free-pipeline-outreach",
            "title": "Inbound & Portfolio Refresh",
            "category": "Focus",
            "detail": "Follow up with previous clients, share case studies, and pitch high-ticket retainers.",
            "impact": "+22% contract win rate",
            "start_time": "14:00",
            "duration_minutes": 45,
            "is_ai_generated": False
        },
        {
            "suggestion_id": "free-runway-buffer",
            "title": "Tax & 6-Month Runway Sweep",
            "category": "Finance",
            "detail": "Transfer 30% of recent invoice payments into tax escrow and liquid emergency runway.",
            "impact": "+$600 buffer/mo",
            "start_time": "17:30",
            "duration_minutes": 20,
            "is_ai_generated": False
        },
        {
            "suggestion_id": "free-circadian-walk",
            "title": "Post-Client Sunlight Walk",
            "category": "Vitality",
            "detail": "Screen-free outdoor movement to reset circadian rhythm and relieve desk stiffness.",
            "impact": "+1.2 mood rating",
            "start_time": "16:30",
            "duration_minutes": 30,
            "is_ai_generated": False
        }
    ],
    "entrepreneur": [
        {
            "suggestion_id": "ent-strategy-block",
            "title": "Zero-Distraction Strategy Block",
            "category": "Focus",
            "detail": "Focus on high-leverage product decisions, key distribution bottlenecks, and roadmapping.",
            "impact": "+2.0 leverage rating",
            "start_time": "08:00",
            "duration_minutes": 90,
            "is_ai_generated": False
        },
        {
            "suggestion_id": "ent-delegation-triage",
            "title": "Daily Async Delegation & Triage",
            "category": "Work",
            "detail": "Review blocker tickets, record async video briefs, and unblock key team deliverables.",
            "impact": "+3.5 hrs saved weekly",
            "start_time": "11:30",
            "duration_minutes": 30,
            "is_ai_generated": False
        },
        {
            "suggestion_id": "ent-cash-burn",
            "title": "Runway & CapEx Health Check",
            "category": "Finance",
            "detail": "Audit SaaS subscriptions, customer acquisition CAC/LTV, and extend cash runway.",
            "impact": "+$1,200/mo net retained",
            "start_time": "16:00",
            "duration_minutes": 30,
            "is_ai_generated": False
        },
        {
            "suggestion_id": "ent-stress-downshift",
            "title": "Evening Nervous System Downshift",
            "category": "Vitality",
            "detail": "Cold shower or breathwork followed by no-screen recovery to protect sleep architecture.",
            "impact": "+0.9h deep sleep",
            "start_time": "21:00",
            "duration_minutes": 25,
            "is_ai_generated": False
        }
    ],
    "retiree": [
        {
            "suggestion_id": "ret-morning-mobility",
            "title": "Sunrise Mobility & Joint Warmup",
            "category": "Vitality",
            "detail": "Gentle yoga, stretching, and brisk morning walk to sustain cardiovascular vigor.",
            "impact": "+1.8 physical vitality",
            "start_time": "07:30",
            "duration_minutes": 40,
            "is_ai_generated": False
        },
        {
            "suggestion_id": "ret-learning-hobbies",
            "title": "Cognitive Hobbies & Literature",
            "category": "Focus",
            "detail": "Engage with non-fiction books, chess, language practice, or creative writing.",
            "impact": "+1.5 focus score",
            "start_time": "10:30",
            "duration_minutes": 60,
            "is_ai_generated": False
        },
        {
            "suggestion_id": "ret-budget-audit",
            "title": "Dividends & Safe Withdrawal Audit",
            "category": "Finance",
            "detail": "Verify asset yield allocation, emergency liquid cash, and adjust lifestyle budget.",
            "impact": "Preserves capital safe rate",
            "start_time": "15:00",
            "duration_minutes": 30,
            "is_ai_generated": False
        },
        {
            "suggestion_id": "ret-evening-unwind",
            "title": "Evening Herbal Tea & Wind-down",
            "category": "Vitality",
            "detail": "Calming acoustic music, screen-free reading, and herbal tea for restorative deep sleep.",
            "impact": "+1.0 sleep quality",
            "start_time": "20:30",
            "duration_minutes": 30,
            "is_ai_generated": False
        }
    ],
    "professional": [
        {
            "suggestion_id": "pro-deep-work",
            "title": "High-Focus Deep Work Block",
            "category": "Focus",
            "detail": "Prioritize complex core deliverables before opening email or team Slack channels.",
            "impact": "+1.5 daily focus score",
            "start_time": "09:00",
            "duration_minutes": 75,
            "is_ai_generated": False
        },
        {
            "suggestion_id": "pro-upskill-hour",
            "title": "Career Upskilling & Reading",
            "category": "Study",
            "detail": "Study industry trends, system design patterns, or technical certifications.",
            "impact": "+2.0 career trajectory",
            "start_time": "17:30",
            "duration_minutes": 45,
            "is_ai_generated": False
        },
        {
            "suggestion_id": "pro-dca-savings",
            "title": "Auto-DCA Index Investment Transfer",
            "category": "Finance",
            "detail": "Direct salary savings into broad index funds to maintain target compound pace.",
            "impact": "+$400/mo net compounding",
            "start_time": "12:30",
            "duration_minutes": 15,
            "is_ai_generated": False
        },
        {
            "suggestion_id": "pro-screen-break",
            "title": "Midday Sunlight Mobility Reset",
            "category": "Vitality",
            "detail": "20-minute outdoor walk to offset sedentary desk posture and reduce screen fatigue.",
            "impact": "+0.8 focus recovery",
            "start_time": "13:30",
            "duration_minutes": 20,
            "is_ai_generated": False
        }
    ]
}


def get_user_suggestions(db: Session, user_id: int):
    return db.query(models.UserSuggestion).filter(models.UserSuggestion.user_id == user_id).order_by(models.UserSuggestion.id.asc()).all()


def save_user_suggestions(db: Session, user_id: int, suggestions: list, overwrite: bool = False):
    if overwrite:
        # Delete existing suggestions for this user
        db.query(models.UserSuggestion).filter(models.UserSuggestion.user_id == user_id).delete()
        db.commit()

    saved_items = []
    for s in suggestions:
        # Check if suggestion_id already exists for this user
        s_id = s.get("suggestion_id") or s.get("id") or f"sug-{random.randint(1000, 9999)}"
        existing = db.query(models.UserSuggestion).filter(
            models.UserSuggestion.user_id == user_id,
            models.UserSuggestion.suggestion_id == s_id
        ).first()

        if existing and not overwrite:
            existing.title = s.get("title", existing.title)
            existing.category = s.get("category", existing.category)
            existing.detail = s.get("detail", existing.detail)
            existing.impact = s.get("impact", existing.impact)
            existing.start_time = s.get("start_time") or s.get("start", existing.start_time)
            existing.duration_minutes = s.get("duration_minutes") or s.get("minutes", existing.duration_minutes)
            saved_items.append(existing)
        else:
            db_sug = models.UserSuggestion(
                user_id=user_id,
                suggestion_id=s_id,
                title=s.get("title", "Smart Suggestion"),
                category=s.get("category", "Focus"),
                detail=s.get("detail", ""),
                impact=s.get("impact", "+1.0 focus"),
                start_time=s.get("start_time") or s.get("start", "09:00"),
                duration_minutes=s.get("duration_minutes") or s.get("minutes", 30),
                is_adopted=1 if s.get("is_adopted") else 0,
                is_ai_generated=1 if s.get("is_ai_generated", True) else 0,
                created_at=datetime.utcnow()
            )
            db.add(db_sug)
            saved_items.append(db_sug)

    db.commit()
    for item in saved_items:
        db.refresh(item)
    return saved_items


def adopt_user_suggestion(db: Session, user_id: int, suggestion_id: str, is_adopted: bool):
    sug = db.query(models.UserSuggestion).filter(
        models.UserSuggestion.user_id == user_id,
        models.UserSuggestion.suggestion_id == suggestion_id
    ).first()

    if sug:
        sug.is_adopted = 1 if is_adopted else 0
        db.commit()
        db.refresh(sug)
        return sug
    return None


def reset_user_suggestions(db: Session, user_id: int, role: str = "professional"):
    db.query(models.UserSuggestion).filter(models.UserSuggestion.user_id == user_id).delete()
    db.commit()
    defaults = DEFAULT_ROLE_SUGGESTIONS.get(role, DEFAULT_ROLE_SUGGESTIONS["professional"])
    return save_user_suggestions(db, user_id, defaults, overwrite=True)


# --- Chat & Conversational Twin Operations ---

def get_chat_sessions(db: Session, user_id: int):
    """Retrieve all chat sessions for a user, sorted by most recently updated."""
    sessions = db.query(models.ChatSession)\
        .filter(models.ChatSession.user_id == user_id)\
        .order_by(models.ChatSession.updated_at.desc())\
        .all()
    
    result = []
    for s in sessions:
        msgs = s.messages
        count = len(msgs)
        last_preview = msgs[-1].content[:60] + "..." if count > 0 and len(msgs[-1].content) > 60 else (msgs[-1].content if count > 0 else "No messages")
        result.append({
            "id": s.id,
            "user_id": s.user_id,
            "title": s.title,
            "created_at": s.created_at,
            "updated_at": s.updated_at,
            "message_count": count,
            "last_message_preview": last_preview
        })
    return result


def get_chat_session(db: Session, session_id: int):
    """Retrieve single chat session by ID."""
    return db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()


def create_chat_session(db: Session, user_id: int, title: str = "New Conversation"):
    """Create a new chat session."""
    session = models.ChatSession(
        user_id=user_id,
        title=title or "New Conversation",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def update_chat_session_title(db: Session, session_id: int, title: str):
    """Update title of a chat session."""
    session = get_chat_session(db, session_id)
    if session:
        session.title = title
        session.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(session)
    return session


def delete_chat_session(db: Session, session_id: int):
    """Delete a chat session and all its messages."""
    session = get_chat_session(db, session_id)
    if session:
        db.delete(session)
        db.commit()
        return True
    return False


def get_chat_messages(db: Session, session_id: int):
    """Retrieve full chronological conversation history for a session."""
    return db.query(models.ChatMessage)\
        .filter(models.ChatMessage.session_id == session_id)\
        .order_by(models.ChatMessage.created_at.asc())\
        .all()


def create_chat_message(
    db: Session,
    session_id: int,
    role: str,
    content: str,
    action_type: str = "none",
    action_payload: str = None,
    action_status: str = "none"
):
    """Save a user or assistant message, updating session timestamp."""
    session = get_chat_session(db, session_id)
    if not session:
        return None

    msg = models.ChatMessage(
        session_id=session_id,
        role=role,
        content=content,
        action_type=action_type or "none",
        action_payload=action_payload,
        action_status=action_status or "none",
        created_at=datetime.utcnow()
    )
    db.add(msg)
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(msg)
    return msg


def update_chat_action_status(db: Session, message_id: int, status: str):
    """Update status of an interactive action proposal (e.g. approved / rejected / executed)."""
    msg = db.query(models.ChatMessage).filter(models.ChatMessage.id == message_id).first()
    if msg:
        msg.action_status = status
        db.commit()
        db.refresh(msg)
    return msg



