import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from beanie import Document, Indexed


class UserDoc(Document):
    """MongoDB User profile and telemetry state document."""
    username: Indexed(str, unique=True)
    email: Indexed(str, unique=True)
    role: str = "professional"
    is_onboarded: int = 0

    # Profile details for forecasting
    age: int = 25
    retirement_goal_age: int = 60
    target_net_worth: float = 1000000.0
    monthly_income: float = 5000.0
    monthly_expenses: float = 2900.0
    net_worth: float = 15000.0

    # Habit targets
    sleep_target_hours: float = 8.0
    study_target_hours_week: float = 15.0

    # Decision Sandbox scenario slider presets (JSON: {"savings": 0, "sleep": 0, "study": 0})
    scenario_a_preset: Optional[str] = None
    scenario_b_preset: Optional[str] = None

    # AI prediction cache
    last_success_odds: Optional[float] = None
    last_wealth_prediction: Optional[str] = None
    last_analytics_summary: Optional[str] = None
    last_analytics_updated: Optional[str] = None
    last_study_plan: Optional[str] = None
    last_study_plan_updated: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"

    @property
    def id_str(self) -> str:
        return str(self.id)


class FinancialRecordDoc(Document):
    """MongoDB Financial transaction and expense records."""
    user_id: str
    category: str
    description: Optional[str] = None
    amount: float
    record_date: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "financial_records"
        indexes = ["user_id", "category"]


class HabitRecordDoc(Document):
    """MongoDB Daily biometric sleep, screen time, exercise, and mood records."""
    user_id: str
    habit_name: str
    duration_minutes: int = 0
    impact_score: int = 5
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "habit_records"
        indexes = ["user_id", "habit_name", "created_at"]


class StudyRecordDoc(Document):
    """MongoDB Academic coursework, deep work sprints, and focus scores."""
    user_id: str
    subject: str
    duration_minutes: int = 0
    focus_score: int = 7
    exam_score: Optional[float] = None
    notes: Optional[str] = None
    session_type: str = "study"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "study_records"
        indexes = ["user_id", "subject", "created_at"]


class UserSuggestionDoc(Document):
    """MongoDB AI-generated recommendations and routine adjustments."""
    user_id: str
    suggestion_id: str
    title: str
    category: str = "Focus"
    detail: str
    impact: str = "+1.0 focus"
    start_time: str = "09:00"
    duration_minutes: int = 30
    is_adopted: int = 0
    is_ai_generated: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "user_suggestions"
        indexes = ["user_id", "suggestion_id"]


class ChatMessageDoc(BaseModel):
    """Embedded chat message sub-document."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str
    content: str
    action_type: str = "none"
    action_payload: Optional[str] = None
    action_status: str = "none"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ChatSessionDoc(Document):
    """MongoDB Conversational session with embedded messages for atomic retrieval."""
    user_id: str
    title: str = "New Conversation"
    messages: List[ChatMessageDoc] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "chat_sessions"
        indexes = ["user_id", "updated_at"]


# Backwards compatibility class aliases
User = UserDoc
FinancialRecord = FinancialRecordDoc
HabitRecord = HabitRecordDoc
StudyRecord = StudyRecordDoc
UserSuggestion = UserSuggestionDoc
ChatMessage = ChatMessageDoc
ChatSession = ChatSessionDoc
