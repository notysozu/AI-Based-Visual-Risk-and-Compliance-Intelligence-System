import pytest
from ai_engine.simulation.simulator import calculate_health_index

def test_health_index_bounds():
    h = calculate_health_index(7.5, 30, 4.0)
    assert 0.0 <= h <= 10.0
