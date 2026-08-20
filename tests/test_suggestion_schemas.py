import pytest
from database.schemas import SuggestionItem, GenerateSuggestionsRequest

def test_suggestion_payload_validation():
    item = SuggestionItem(
        suggestion_id="sug-101",
        title="Spaced Review",
        category="Study",
        detail="Review lecture notes",
        impact="+12% recall",
        start_time="08:30",
        duration_minutes=30,
        is_adopted=False
    )
    assert item.suggestion_id == "sug-101"
    assert item.duration_minutes == 30
