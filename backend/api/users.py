from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import crud, schemas, database

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/default", response_model=schemas.UserResponse)
def get_default_user(db: Session = Depends(database.get_db)):
    """
    Get the default seeded user, or create one if it doesn't exist.
    """
    username = "default_twin"
    user = crud.get_user_by_username(db, username=username)

    if not user:
        # Create a default user
        user_create = schemas.UserCreate(
            username=username,
            email="twin@example.com",
            age=25,
            retirement_goal_age=60,
            target_net_worth=1000000.0,
            monthly_income=5000.0,
            sleep_target_hours=8.0,
            study_target_hours_week=15.0
        )
        user = crud.create_user(db, user_create)
        crud.seed_mock_data(db, user.id)

    return user


@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    """
    Create a new user profile after validating that username and email are unique.
    """
    clean_username = user.username.strip()
    clean_email = user.email.strip().lower()

    existing_user = crud.get_user_by_username(db, username=clean_username)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail=f"Username '{clean_username}' is already taken. Please choose another username or log in."
        )

    existing_email = crud.get_user_by_email(db, email=clean_email)
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail=f"An account with email '{clean_email}' already exists. Please log in instead."
        )

    user.username = clean_username
    user.email = clean_email
    return crud.create_user(db, user)


@router.post("/login", response_model=schemas.UserResponse)
def login_user(req: schemas.UserLoginRequest, db: Session = Depends(database.get_db)):
    """
    Log in or look up a user by either email or username.
    """
    ident = req.identifier.strip()
    if not ident:
        raise HTTPException(status_code=400, detail="Identifier is required")

    # 1. Search by email (case-insensitive)
    user = crud.get_user_by_email(db, email=ident.lower())
    
    # 2. Search by username if not found by email
    if not user:
        user = crud.get_user_by_username(db, username=ident)

    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"No user account found for '{ident}'. Please sign up first."
        )

    return user


@router.get("/{user_id}", response_model=schemas.UserResponse)
def read_user(user_id: int, db: Session = Depends(database.get_db)):
    db_user = crud.get_user(db, user_id=user_id)

    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return db_user


@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(database.get_db)
):
    db_user = crud.update_user(db, user_id=user_id, user_update=user_update)

    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return db_user


@router.get("/username/{username}", response_model=schemas.UserResponse)
def get_user_by_username(username: str, db: Session = Depends(database.get_db)):
    """
    Get user details by username for login/lookup.
    """
    user = crud.get_user_by_username(db, username=username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/email/{email}", response_model=schemas.UserResponse)
def get_user_by_email(email: str, db: Session = Depends(database.get_db)):
    """
    Get user details by email for login/lookup.
    """
    user = crud.get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user