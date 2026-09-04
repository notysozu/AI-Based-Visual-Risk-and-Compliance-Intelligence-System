from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any
from database.schemas import MongoBaseModel


class HabitRecordCreate(BaseModel):
    habit_name: str
    duration_minutes: int
    impact_score: int


class HabitRecordUpdate(BaseModel):
    habit_name: Optional[str] = None
    duration_minutes: Optional[int] = None
    impact_score: Optional[int] = None


class HabitRecordResponse(MongoBaseModel):
    id: Optional[Any] = None
    user_id: Optional[Any] = None
    habit_name: str
    duration_minutes: int
    impact_score: int
    created_at: Optional[datetime] = None