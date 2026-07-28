from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class FinancialRecordCreate(BaseModel):
    category: str
    description: str
    amount: float


class FinancialRecordUpdate(BaseModel):
    category: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None


class FinancialRecordResponse(BaseModel):
    id: int
    user_id: int
    category: str
    description: str
    amount: float
    record_date: datetime

    model_config = {
        "from_attributes": True
    }