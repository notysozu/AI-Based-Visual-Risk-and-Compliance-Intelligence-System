from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import crud, schemas, database
from typing import List

router = APIRouter(prefix="/records", tags=["records"])

# Financial Records
@router.post("/financial/{user_id}", response_model=schemas.FinancialRecordResponse)
def create_financial(user_id: int, record: schemas.FinancialRecordCreate, db: Session = Depends(database.get_db)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.create_financial_record(db, record, user_id)

@router.get("/financial/{user_id}", response_model=List[schemas.FinancialRecordResponse])
def read_financials(
    user_id: int, 
    limit: int = Query(100, ge=1, le=500), 
    offset: int = 0, 
    db: Session = Depends(database.get_db)
):
    return crud.get_financial_records(db, user_id=user_id, limit=limit, offset=offset)

# Habit Records
@router.post("/habit/{user_id}", response_model=schemas.HabitRecordResponse)
def create_habit(user_id: int, record: schemas.HabitRecordCreate, db: Session = Depends(database.get_db)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.create_habit_record(db, record, user_id)

@router.get("/habit/{user_id}", response_model=List[schemas.HabitRecordResponse])
def read_habits(
    user_id: int, 
    limit: int = Query(100, ge=1, le=500), 
    offset: int = 0, 
    db: Session = Depends(database.get_db)
):
    return crud.get_habit_records(db, user_id=user_id, limit=limit, offset=offset)

# Study Records
@router.post("/study/{user_id}", response_model=schemas.StudyRecordResponse)
def create_study(user_id: int, record: schemas.StudyRecordCreate, db: Session = Depends(database.get_db)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.create_study_record(db, record, user_id)

@router.get("/study/{user_id}", response_model=List[schemas.StudyRecordResponse])
def read_studies(
    user_id: int, 
    limit: int = Query(100, ge=1, le=500), 
    offset: int = 0, 
    db: Session = Depends(database.get_db)
):
    return crud.get_study_records(db, user_id=user_id, limit=limit, offset=offset)
