from fastapi import APIRouter, HTTPException, status
from database import crud, schemas
from typing import Any

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/default", response_model=schemas.UserResponse)
async def get_default_user():
    """
    Get the default seeded user, or create one in MongoDB if it doesn't exist.
    """
    username = "default_twin"
    user = await crud.get_user_by_username(username=username)

    if not user:
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
        user = await crud.create_user(user_create)
        await crud.seed_mock_data(user.id)

    return user


@router.get("/demo/{role}", response_model=schemas.UserResponse)
async def get_demo_user(role: str):
    """
    Get or seed dedicated role-specific demo user profile in MongoDB.
    Supports: student, freelancer, entrepreneur/founder, retiree, professional/pro.
    """
    user = await crud.get_or_create_demo_user(role=role)
    return user


@router.post("/", response_model=schemas.UserResponse)
async def create_user(user: schemas.UserCreate):
    """
    Create a new user profile document in MongoDB after validating uniqueness.
    """
    clean_username = user.username.strip()
    clean_email = user.email.strip().lower()

    existing_user = await crud.get_user_by_username(username=clean_username)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail=f"Username '{clean_username}' is already taken. Please choose another username or log in."
        )

    existing_email = await crud.get_user_by_email(email=clean_email)
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail=f"An account with email '{clean_email}' already exists. Please log in instead."
        )

    user.username = clean_username
    user.email = clean_email
    created = await crud.create_user(user)
    await crud.seed_mock_data(created.id)
    return created


@router.post("/login", response_model=schemas.UserResponse)
async def login_user(req: schemas.UserLoginRequest):
    """
    Unified login supporting registered email, username, demo role alias, or auto-provisioning.
    Guarantees seamless authentication without dead-end 404s.
    """
    identifier = req.identifier.strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="Please enter an email or username.")

    # 1. Search by exact email or username
    user = await crud.get_user_by_email(email=identifier.lower())
    if not user:
        user = await crud.get_user_by_username(username=identifier)

    # 2. Check for role aliases (student, pro, freelancer, founder, retiree, default)
    if not user:
        id_lower = identifier.lower()
        if any(k in id_lower for k in ["student", "alex"]):
            user = await crud.get_or_create_demo_user("student")
        elif any(k in id_lower for k in ["pro", "professional", "jordan"]):
            user = await crud.get_or_create_demo_user("professional")
        elif any(k in id_lower for k in ["freelance", "samira"]):
            user = await crud.get_or_create_demo_user("freelancer")
        elif any(k in id_lower for k in ["entrepreneur", "founder", "elena"]):
            user = await crud.get_or_create_demo_user("entrepreneur")
        elif any(k in id_lower for k in ["retiree", "senior", "arthur"]):
            user = await crud.get_or_create_demo_user("retiree")
        elif any(k in id_lower for k in ["default", "twin"]):
            user = await get_default_user()

    # 3. If identifier is a new email or username, auto-provision and seed profile immediately
    if not user:
        clean_username = identifier.split("@")[0].lower().replace(" ", "_")
        clean_email = identifier.lower() if "@" in identifier else f"{clean_username}@twin.local"

        # Check collisions before creation
        existing_u = await crud.get_user_by_username(clean_username)
        if existing_u:
            user = existing_u
        else:
            existing_e = await crud.get_user_by_email(clean_email)
            if existing_e:
                user = existing_e
            else:
                user_create = schemas.UserCreate(
                    username=clean_username,
                    email=clean_email,
                    role="professional",
                    age=28,
                    monthly_income=5000.0,
                    monthly_expenses=3200.0,
                    net_worth=35000.0,
                    sleep_target_hours=8.0,
                    study_target_hours_week=10.0,
                    is_onboarded=1
                )
                user = await crud.create_user(user_create)

    return user


@router.get("/{user_id}", response_model=schemas.UserResponse)
async def get_user_profile(user_id: str):
    """
    Retrieve user document from MongoDB.
    """
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=schemas.UserResponse)
async def update_user_profile(user_id: str, user_update: schemas.UserUpdate):
    """
    Update user document attributes in MongoDB.
    """
    user = await crud.update_user(user_id, user_update)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_profile(user_id: str):
    """
    Delete user document and all associated records from MongoDB.
    """
    success = await crud.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
