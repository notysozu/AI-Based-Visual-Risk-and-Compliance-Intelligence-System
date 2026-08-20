import pytest
from ai_engine.simulation.simulator import calculate_focus_index

def test_focus_rating_bounds():
    f = calculate_focus_index(8.0, 2.0, 4.0)
    assert 0.0 <= f <= 10.0
