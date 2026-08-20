import pytest
from ai_engine.forecasting.habits import predict_scenario_scores

def test_focus_rating_bounds():
    res = predict_scenario_scores({}, 8.0, 1.0, 3.0, 1.5, 2.0)
    assert res["focus_index"] >= 50.0
    assert res["health_index"] >= 50.0
