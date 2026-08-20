import pytest
from ai_engine.forecasting.financial import project_savings

def test_project_savings_growth():
    bal = project_savings(10000, 500, 12, 0.06)
    assert bal > 16000
