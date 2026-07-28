from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class HabitRecordCreate(BaseModel):
    habit_name: str
    duration_minutes: int
    impact_score: int


class HabitRecordUpdate(BaseModel):
    habit_name: Optional[str] = None
    duration_minutes: Optional[int] = None
    impact_score: Optional[int] = None


class HabitRecordResponse(BaseModel):
    id: int
    user_id: int
    habit_name: str
    duration_minutes: int
    impact_score: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }