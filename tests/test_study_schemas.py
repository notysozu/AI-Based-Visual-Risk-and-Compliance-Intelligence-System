import pytest
from database.schemas import StudyRecordCreate

def test_study_create_validation():
    s = StudyRecordCreate(subject="Physics", duration_minutes=60, focus_score=8)
    assert s.subject == "Physics"
    assert s.focus_score == 8
