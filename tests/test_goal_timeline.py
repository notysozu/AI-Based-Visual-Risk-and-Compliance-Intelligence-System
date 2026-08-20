import pytest
from ai_engine.forecasting.financial import project_toward_goal

def test_project_toward_goal_months():
    m = project_toward_goal(1000, 500, 5000, 0.05)
    assert m is not None
    assert m > 0
