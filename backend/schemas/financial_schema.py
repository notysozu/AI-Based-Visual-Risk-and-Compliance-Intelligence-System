from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any
from database.schemas import MongoBaseModel


class FinancialRecordCreate(BaseModel):
    category: str
    description: str
    amount: float


class FinancialRecordUpdate(BaseModel):
    category: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None


class FinancialRecordResponse(MongoBaseModel):
    id: Optional[Any] = None
    user_id: Optional[Any] = None
    category: str
    description: str
    amount: float
    record_date: Optional[datetime] = None