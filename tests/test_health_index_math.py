import pytest
from ai_engine.forecasting.habits import predict_scenario_scores

def test_health_index_bounds():
    res = predict_scenario_scores({}, 7.5, 0.5, 4.0, 1.0, 1.5)
    assert 0.0 <= res["health_index"] <= 100.0
    assert 0.0 <= res["focus_index"] <= 100.0
