import pytest

@pytest.fixture
def mock_user_payload():
    return {
        "username": "tester",
        "email": "tester@example.com",
        "age": 26,
        "role": "professional"
    }
