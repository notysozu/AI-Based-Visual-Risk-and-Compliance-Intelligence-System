from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Any
from database import crud
from backend.schemas.habit_schema import HabitRecordCreate, HabitRecordUpdate, HabitRecordResponse

router = APIRouter(
    prefix="/habits",
    tags=["Habits"]
)


@router.post(
    "/",
    summary="Create Habit Record",
    status_code=status.HTTP_201_CREATED,
    response_model=HabitRecordResponse
)
async def create_habit_record(
    record: HabitRecordCreate,
    user_id: str = Query("default_twin", description="Associated user ID")
):
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    from database.schemas import HabitRecordCreate as DbHabitRecordCreate
    db_record_input = DbHabitRecordCreate(
        habit_name=record.habit_name,
        duration_minutes=record.duration_minutes,
        impact_score=record.impact_score
    )
    db_record = await crud.create_habit_record(db_record_input, user_id)
    return db_record


@router.get(
    "/",
    summary="Get All Habit Records",
    response_model=List[HabitRecordResponse]
)
async def get_habit_records(
    user_id: str = Query("default_twin", description="Filter by user ID"),
    limit: int = 100,
    offset: int = 0
):
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return await crud.get_habit_records(user_id=user_id, limit=limit, offset=offset)


@router.get(
    "/{habit_id}",
    summary="Get Habit Record",
    response_model=HabitRecordResponse
)
async def get_habit_record(habit_id: str):
    db_record = await crud.get_habit_record(habit_id)
    if not db_record:
        raise HTTPException(status_code=404, detail="Habit record not found")
    return db_record


@router.put(
    "/{habit_id}",
    summary="Update Habit Record",
    response_model=HabitRecordResponse
)
async def update_habit_record(
    habit_id: str,
    record: HabitRecordUpdate
):
    db_record = await crud.update_habit_record(habit_id, record)
    if not db_record:
        raise HTTPException(status_code=404, detail="Habit record not found")
    return db_record


@router.delete(
    "/{habit_id}",
    summary="Delete Habit Record",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_habit_record(habit_id: str):
    success = await crud.delete_habit_record(habit_id)
    if not success:
        raise HTTPException(status_code=404, detail="Habit record not found")
    return
