import pytest
from database.schemas import SimulationRequest, ScenarioInput

def test_simulation_payload_validation():
    sim = SimulationRequest(
        scenario_a=ScenarioInput(monthly_investment_change=250, sleep_hours_change=0.5, weekly_study_change=4),
        scenario_b=ScenarioInput(monthly_investment_change=750, sleep_hours_change=-1.0, weekly_study_change=10),
        years=5
    )
    assert sim.years == 5
    assert sim.scenario_a.monthly_investment_change == 250
