import pytest
from database.schemas import UserCreate, UserUpdate

def test_user_create_validation():
    user = UserCreate(username="johndoe", email="john@example.com", age=30, role="freelancer")
    assert user.username == "johndoe"
    assert user.role == "freelancer"
