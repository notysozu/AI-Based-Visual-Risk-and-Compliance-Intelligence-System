from fastapi import APIRouter, status

router = APIRouter(
    prefix="/finance",
    tags=["Finance"]
)


@router.post(
    "/",
    summary="Create Financial Record",
    status_code=status.HTTP_201_CREATED
)
def create_financial_record():
    return {
        "message": "Create Financial Record - CRUD integration pending"
    }


@router.get(
    "/",
    summary="Get All Financial Records"
)
def get_financial_records():
    return {
        "message": "Get All Financial Records - CRUD integration pending"
    }


@router.get(
    "/{record_id}",
    summary="Get Financial Record"
)
def get_financial_record(record_id: int):
    return {
        "message": f"Get Financial Record {record_id}"
    }


@router.put(
    "/{record_id}",
    summary="Update Financial Record"
)
def update_financial_record(record_id: int):
    return {
        "message": f"Update Financial Record {record_id}"
    }


@router.delete(
    "/{record_id}",
    summary="Delete Financial Record"
)
def delete_financial_record(record_id: int):
    return {
        "message": f"Delete Financial Record {record_id}"
    }