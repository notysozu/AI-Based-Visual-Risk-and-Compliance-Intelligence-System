from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class FinancialRecordCreate(BaseModel):
    category: str
    amount: float

class FinancialRecordResponse(FinancialRecordCreate):
    id: int
    user_id: int
    record_date: datetime

    class Config:
        from_attributes = True
