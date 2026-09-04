from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Any
from database import crud
from backend.schemas.financial_schema import FinancialRecordCreate, FinancialRecordUpdate, FinancialRecordResponse

router = APIRouter(
    prefix="/finance",
    tags=["Finance"]
)


@router.post(
    "/",
    summary="Create Financial Record",
    status_code=status.HTTP_201_CREATED,
    response_model=FinancialRecordResponse
)
async def create_financial_record(
    record: FinancialRecordCreate,
    user_id: str = Query("default_twin", description="Associated user ID")
):
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    from database.schemas import FinancialRecordCreate as DbFinancialRecordCreate
    db_record_input = DbFinancialRecordCreate(
        category=record.category,
        description=record.description,
        amount=record.amount
    )
    db_record = await crud.create_financial_record(db_record_input, user_id)
    return db_record


@router.get(
    "/",
    summary="Get All Financial Records",
    response_model=List[FinancialRecordResponse]
)
async def get_financial_records(
    user_id: str = Query("default_twin", description="Filter by user ID"),
    limit: int = 100,
    offset: int = 0
):
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return await crud.get_financial_records(user_id=user_id, limit=limit, offset=offset)


@router.get(
    "/{record_id}",
    summary="Get Financial Record",
    response_model=FinancialRecordResponse
)
async def get_financial_record(record_id: str):
    db_record = await crud.get_financial_record(record_id)
    if not db_record:
        raise HTTPException(status_code=404, detail="Financial record not found")
    return db_record


@router.put(
    "/{record_id}",
    summary="Update Financial Record",
    response_model=FinancialRecordResponse
)
async def update_financial_record(
    record_id: str,
    record: FinancialRecordUpdate
):
    db_record = await crud.update_financial_record(record_id, record)
    if not db_record:
        raise HTTPException(status_code=404, detail="Financial record not found")
    return db_record


@router.delete(
    "/{record_id}",
    summary="Delete Financial Record",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_financial_record(record_id: str):
    success = await crud.delete_financial_record(record_id)
    if not success:
        raise HTTPException(status_code=404, detail="Financial record not found")
    return
