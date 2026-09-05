from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_serializer
from datetime import datetime
from typing import Optional, List, Union, Any, Dict


class MongoBaseModel(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        arbitrary_types_allowed=True
    )

    @field_serializer("id", check_fields=False)
    def serialize_id(self, v: Any) -> Optional[str]:
        return str(v) if v is not None else None

    @field_serializer("user_id", check_fields=False)
    def serialize_user_id(self, v: Any) -> Optional[str]:
        return str(v) if v is not None else None

    @field_serializer("session_id", check_fields=False)
    def serialize_session_id(self, v: Any) -> Optional[str]:
        return str(v) if v is not None else None


# User Schemas
class UserBase(BaseModel):
    """Core user profile data model."""
    username: str
    email: str
    role: Optional[str] = "professional"
    is_onboarded: Optional[int] = 0
    age: Optional[int] = 25
    retirement_goal_age: Optional[int] = 60
    target_net_worth: Optional[float] = 1000000.0
    monthly_income: Optional[float] = 5000.0
    monthly_expenses: Optional[float] = 2900.0
    net_worth: Optional[float] = 15000.0
    sleep_target_hours: Optional[float] = 8.0
    study_target_hours_week: Optional[float] = 15.0
    exercise_target_days: Optional[float] = 4.0
    screen_time_target_hours: Optional[float] = 3.5
    savings_rate_target: Optional[float] = 20.0
    focus_area: Optional[str] = "Deep Work"
    goal_name: Optional[str] = "Emergency Fund"
    goal_current: Optional[float] = 15000.0
    goal_target: Optional[float] = 50000.0
    theme_preference: Optional[str] = "dark"
    tasks_json: Optional[str] = None
    scenario_a_preset: Optional[str] = None
    scenario_b_preset: Optional[str] = None
    last_success_odds: Optional[float] = None
    last_wealth_prediction: Optional[str] = None
    last_analytics_summary: Optional[str] = None
    last_analytics_updated: Optional[str] = None
    last_study_plan: Optional[str] = None
    last_study_plan_updated: Optional[str] = None
    email_verified: Optional[bool] = False
    is_active: Optional[bool] = True
    status: Optional[str] = "active"
    updated_at: Optional[datetime] = None


class UserCreate(UserBase):
    password: Optional[str] = None
    password_hash: Optional[str] = None


class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: Optional[str] = "professional"


class UserLoginCredentialsRequest(BaseModel):
    identifier: str = Field(..., description="Username or Email")
    password: str = Field(..., description="Plaintext password")


class UserLoginRequest(BaseModel):
    identifier: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_onboarded: Optional[int] = None
    age: Optional[int] = None
    retirement_goal_age: Optional[int] = None
    target_net_worth: Optional[float] = None
    monthly_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    net_worth: Optional[float] = None
    sleep_target_hours: Optional[float] = None
    study_target_hours_week: Optional[float] = None
    exercise_target_days: Optional[float] = None
    screen_time_target_hours: Optional[float] = None
    savings_rate_target: Optional[float] = None
    focus_area: Optional[str] = None
    goal_name: Optional[str] = None
    goal_current: Optional[float] = None
    goal_target: Optional[float] = None
    theme_preference: Optional[str] = None
    tasks_json: Optional[str] = None
    scenario_a_preset: Optional[str] = None
    scenario_b_preset: Optional[str] = None
    last_success_odds: Optional[float] = None
    last_wealth_prediction: Optional[str] = None
    last_analytics_summary: Optional[str] = None
    last_analytics_updated: Optional[str] = None
    last_study_plan: Optional[str] = None
    last_study_plan_updated: Optional[str] = None
    email_verified: Optional[bool] = None
    is_active: Optional[bool] = None
    status: Optional[str] = None


class UserResponse(MongoBaseModel, UserBase):
    id: Any
    created_at: datetime
    is_onboarded: Optional[int] = 0
    scenario_a_preset: Optional[str] = None
    scenario_b_preset: Optional[str] = None
    last_success_odds: Optional[float] = None
    last_wealth_prediction: Optional[str] = None
    last_analytics_summary: Optional[str] = None
    last_analytics_updated: Optional[str] = None
    last_study_plan: Optional[str] = None
    last_study_plan_updated: Optional[str] = None


# Authentication & Session Token Schemas
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 900
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class EmailVerifyRequest(BaseModel):
    token: str


# App Cache Schemas
class AppCacheCreate(BaseModel):
    cache_key: str
    user_id: Optional[str] = None
    data: Dict[str, Any] = {}
    ttl_seconds: Optional[int] = None


class AppCacheResponse(MongoBaseModel):
    cache_key: str
    user_id: Optional[str] = None
    data: Dict[str, Any] = {}
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# Financial Record Schemas
class FinancialRecordBase(BaseModel):
    category: str = Field(..., description="Income, Investment, Fixed Expense, Discretionary Expense")
    description: Optional[str] = None
    amount: float
    record_date: Optional[datetime] = None


class FinancialRecordCreate(FinancialRecordBase):
    pass


class FinancialRecordResponse(MongoBaseModel, FinancialRecordBase):
    id: Any
    user_id: Any
    record_date: datetime


# Habit Record Schemas
class HabitRecordBase(BaseModel):
    habit_name: str = Field(..., description="Sleep, Exercise, Screen Time, Diet, Socializing")
    duration_minutes: int = Field(0, ge=0)
    impact_score: int = Field(5, ge=1, le=10)
    created_at: Optional[datetime] = None


class HabitRecordCreate(HabitRecordBase):
    pass


class HabitRecordResponse(MongoBaseModel, HabitRecordBase):
    id: Any
    user_id: Any
    created_at: datetime


# Study Record Schemas
class StudyRecordBase(BaseModel):
    subject: str
    duration_minutes: int = Field(0, ge=0)
    focus_score: int = Field(7, ge=1, le=10)
    exam_score: Optional[float] = Field(None, ge=0, le=100)
    notes: Optional[str] = None
    session_type: Optional[str] = "study"
    created_at: Optional[datetime] = None


class StudyRecordCreate(StudyRecordBase):
    pass


class StudyRecordResponse(MongoBaseModel, StudyRecordBase):
    id: Any
    user_id: Any
    created_at: datetime


class StudyPlanRequest(BaseModel):
    target_milestone: Optional[str] = None
    force_refresh: Optional[bool] = False


class StudyBlockItem(BaseModel):
    subject: str
    start_time: str
    duration_minutes: int
    focus_type: str
    task_title: str


class DayStudyPlan(BaseModel):
    day: str
    blocks: List[StudyBlockItem]


class StudyRecommendationItem(BaseModel):
    title: str
    impact: str
    description: str
    category: str


class StudyPlanResponse(BaseModel):
    weekly_goal: str
    focus_strategy: str
    daily_plans: List[DayStudyPlan]
    recommendations: List[StudyRecommendationItem]


# Simulation & What-If schemas
class ScenarioInput(BaseModel):
    monthly_investment_change: float = 0.0
    sleep_hours_change: float = 0.0
    weekly_study_change: float = 0.0


class SimulationRequest(BaseModel):
    """Dual scenario comparative simulation payload."""
    scenario_a: ScenarioInput
    scenario_b: ScenarioInput
    years: int = Field(5, ge=1, le=40)


class Datapoint(BaseModel):
    year: int
    net_worth: float
    health_index: float
    focus_index: float


class SimulationResult(BaseModel):
    scenario_name: str
    datapoints: List[Datapoint]
    attained_retirement: bool
    wealth_at_end: float


class SimulationResponse(BaseModel):
    scenario_a: SimulationResult
    scenario_b: SimulationResult
    recommendation: str


class AnalyticsLogItem(BaseModel):
    sleep: float
    screen: float
    study: float
    exercise: float
    mood: int


class AnalyticsSummaryRequest(BaseModel):
    logs: List[AnalyticsLogItem]


# Suggestions schemas
class SuggestionItem(MongoBaseModel):
    """Structured habit & lifestyle suggestion model."""
    id: Optional[Any] = None
    suggestion_id: str
    title: str
    category: str
    detail: str
    impact: str
    start_time: str
    duration_minutes: int
    is_adopted: bool = False
    is_ai_generated: bool = False
    created_at: Optional[datetime] = None


class SuggestionAdoptRequest(BaseModel):
    suggestion_id: str
    is_adopted: bool = True


class GenerateSuggestionsRequest(BaseModel):
    mode: str = Field("regenerate", description="'regenerate' to replace, 'more' to append extra suggestions")
    custom_focus: Optional[str] = None


class SuggestionsListResponse(MongoBaseModel):
    user_id: Any
    role: str
    lifestyle_diagnostic: Optional[str] = None
    suggestions: List[SuggestionItem]


# Conversational Twin Chat Schemas
class ChatMessageBase(BaseModel):
    role: str = Field(..., description="'user' | 'assistant' | 'system'")
    content: str
    action_type: Optional[str] = "none"
    action_payload: Optional[str] = None
    action_status: Optional[str] = "none"


class ChatMessageCreate(ChatMessageBase):
    session_id: Any


class ChatMessageResponse(MongoBaseModel, ChatMessageBase):
    id: Any
    session_id: Any
    created_at: datetime


class ChatSessionBase(BaseModel):
    title: Optional[str] = "New Conversation"


class ChatSessionCreate(ChatSessionBase):
    user_id: Any


class ChatSessionResponse(MongoBaseModel, ChatSessionBase):
    id: Any
    user_id: Any
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0
    last_message_preview: Optional[str] = None


class ChatPromptRequest(BaseModel):
    user_id: Any
    prompt: str
    think_mode: Optional[bool] = False
    client_context: Optional[dict] = None


class ChatActionExecuteRequest(BaseModel):
    user_id: Any
    action_type: str
    action_payload: dict


class ChatActionRejectRequest(BaseModel):
    user_id: Any
