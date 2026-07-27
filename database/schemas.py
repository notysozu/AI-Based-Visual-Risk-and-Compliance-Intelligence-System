from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    age: Optional[int] = 25
    retirement_goal_age: Optional[int] = 60
    target_net_worth: Optional[float] = 1000000.0
    monthly_income: Optional[float] = 5000.0
    sleep_target_hours: Optional[float] = 8.0
    study_target_hours_week: Optional[float] = 15.0

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    age: Optional[int] = None
    retirement_goal_age: Optional[int] = None
    target_net_worth: Optional[float] = None
    monthly_income: Optional[float] = None
    sleep_target_hours: Optional[float] = None
    study_target_hours_week: Optional[float] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Financial Record Schemas
class FinancialRecordBase(BaseModel):
    category: str = Field(..., description="Income, Investment, Fixed Expense, Discretionary Expense")
    description: Optional[str] = None
    amount: float
    record_date: Optional[datetime] = None

class FinancialRecordCreate(FinancialRecordBase):
    pass

class FinancialRecordResponse(FinancialRecordBase):
    id: int
    user_id: int
    record_date: datetime

    class Config:
        from_attributes = True

# Habit Record Schemas
class HabitRecordBase(BaseModel):
    habit_name: str = Field(..., description="Sleep, Exercise, Screen Time, Diet, Socializing")
    duration_minutes: int = Field(0, ge=0)
    impact_score: int = Field(5, ge=1, le=10)
    created_at: Optional[datetime] = None

class HabitRecordCreate(HabitRecordBase):
    pass

class HabitRecordResponse(HabitRecordBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Study Record Schemas
class StudyRecordBase(BaseModel):
    subject: str
    duration_minutes: int = Field(0, ge=0)
    focus_score: int = Field(7, ge=1, le=10)
    exam_score: Optional[float] = Field(None, ge=0, le=100)
    created_at: Optional[datetime] = None

class StudyRecordCreate(StudyRecordBase):
    pass

class StudyRecordResponse(StudyRecordBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Simulation & What-If schemas
class ScenarioInput(BaseModel):
    monthly_investment_change: float = 0.0  # + or - amount
    sleep_hours_change: float = 0.0         # + or - hours
    weekly_study_change: float = 0.0        # + or - hours

class SimulationRequest(BaseModel):
    scenario_a: ScenarioInput
    scenario_b: ScenarioInput
    years: int = Field(5, ge=1, le=40)

# Forecast responses
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
