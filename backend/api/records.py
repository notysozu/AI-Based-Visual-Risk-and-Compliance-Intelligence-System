from fastapi import APIRouter, HTTPException, Query
from database import crud, schemas
from typing import List, Any

router = APIRouter(prefix="/records", tags=["records"])

# Financial Records
@router.post("/financial/{user_id}", response_model=schemas.FinancialRecordResponse)
async def create_financial(user_id: str, record: schemas.FinancialRecordCreate):
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return await crud.create_financial_record(record, user_id)

@router.get("/financial/{user_id}", response_model=List[schemas.FinancialRecordResponse])
async def read_financials(
    user_id: str,
    limit: int = Query(100, ge=1, le=500),
    offset: int = 0
):
    return await crud.get_financial_records(user_id=user_id, limit=limit, offset=offset)

# Habit Records
@router.post("/habit/{user_id}", response_model=schemas.HabitRecordResponse)
async def create_habit(user_id: str, record: schemas.HabitRecordCreate):
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return await crud.create_habit_record(record, user_id)

@router.get("/habit/{user_id}", response_model=List[schemas.HabitRecordResponse])
async def read_habits(
    user_id: str,
    limit: int = Query(100, ge=1, le=500),
    offset: int = 0
):
    return await crud.get_habit_records(user_id=user_id, limit=limit, offset=offset)

# Study Records
@router.post("/study/{user_id}", response_model=schemas.StudyRecordResponse)
async def create_study(user_id: str, record: schemas.StudyRecordCreate):
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return await crud.create_study_record(record, user_id)

@router.get("/study/{user_id}", response_model=List[schemas.StudyRecordResponse])
async def read_studies(
    user_id: str,
    limit: int = Query(100, ge=1, le=500),
    offset: int = 0
):
    return await crud.get_study_records(user_id=user_id, limit=limit, offset=offset)
