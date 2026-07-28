from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    age: int
    retirement_goal_age: int
    target_net_worth: float
    monthly_income: float
    sleep_target_hours: float
    study_target_hours_week: float


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    age: Optional[int] = None
    retirement_goal_age: Optional[int] = None
    target_net_worth: Optional[float] = None
    monthly_income: Optional[float] = None
    sleep_target_hours: Optional[float] = None
    study_target_hours_week: Optional[float] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    age: int
    retirement_goal_age: int
    target_net_worth: float
    monthly_income: float
    sleep_target_hours: float
    study_target_hours_week: float

    model_config = {
        "from_attributes": True
    }