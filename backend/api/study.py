from fastapi import APIRouter, status

router = APIRouter(
    prefix="/study",
    tags=["Study"]
)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_study_record():
    return {"message": "Create Study Record - CRUD integration pending"}


@router.get("/")
def get_study_records():
    return {"message": "Get Study Records - CRUD integration pending"}


@router.get("/{record_id}")
def get_study_record(record_id: int):
    return {"message": f"Get Study Record {record_id}"}


@router.put("/{record_id}")
def update_study_record(record_id: int):
    return {"message": f"Update Study Record {record_id}"}


@router.delete("/{record_id}")
def delete_study_record(record_id: int):
    return {"message": f"Delete Study Record {record_id}"}