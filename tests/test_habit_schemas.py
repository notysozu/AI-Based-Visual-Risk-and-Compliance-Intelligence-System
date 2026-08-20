import pytest
from database.schemas import HabitRecordCreate

def test_habit_create_validation():
    h = HabitRecordCreate(habit_name="Sleep", duration_minutes=480, impact_score=8)
    assert h.duration_minutes == 480
    assert h.impact_score == 8
