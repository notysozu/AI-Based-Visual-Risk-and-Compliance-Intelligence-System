from fastapi import APIRouter, status

router = APIRouter(
    prefix="/habits",
    tags=["Habits"]
)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_habit():
    return {"message": "Create Habit - CRUD integration pending"}


@router.get("/")
def get_habits():
    return {"message": "Get Habits - CRUD integration pending"}


@router.get("/{habit_id}")
def get_habit(habit_id: int):
    return {"message": f"Get Habit {habit_id}"}


@router.put("/{habit_id}")
def update_habit(habit_id: int):
    return {"message": f"Update Habit {habit_id}"}


@router.delete("/{habit_id}")
def delete_habit(habit_id: int):
    return {"message": f"Delete Habit {habit_id}"}