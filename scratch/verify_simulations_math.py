import sys
from database.database import SessionLocal
from ai_engine.simulation.simulator import run_what_if_comparison, simulate_savings_rate_change, simulate_goal_timeline
from ai_engine.forecasting.financial import project_savings, project_toward_goal

print("--- Testing Financial Compounding Math ---")
proj = project_savings(current_savings=15000.0, monthly_savings=500.0, months=12, annual_growth_rate=0.08)
print(f"Projected 1Y Savings: ${proj:,.2f}")
assert proj > 21000.0

months = project_toward_goal(current_savings=15000.0, monthly_savings=500.0, target_value=25000.0, annual_growth_rate=0.08)
print(f"Months to Goal ($25k): {months} months")
assert months is not None and months > 0

print("--- Testing What-If Sandbox Math ---")
with SessionLocal() as db:
    res = run_what_if_comparison(
        db=db,
        user_id=1,
        change_a={"monthly_investment_change": 0.0, "sleep_hours_change": 0.0, "weekly_study_change": 0.0},
        change_b={"monthly_investment_change": 250.0, "sleep_hours_change": -0.5, "weekly_study_change": 4.0}
    )
    sa = res["scenario_a"]
    sb = res["scenario_b"]
    print(f"Scenario A Health: {sa['health_index']:.1f}, Focus: {sa['focus_index']:.1f}, 5Y Wealth: ${sa['wealth_at_end']:,.2f}")
    print(f"Scenario B Health: {sb['health_index']:.1f}, Focus: {sb['focus_index']:.1f}, 5Y Wealth: ${sb['wealth_at_end']:,.2f}")
    assert 0 <= sa['health_index'] <= 10
    assert 0 <= sb['health_index'] <= 10
    assert sb['wealth_at_end'] > sa['wealth_at_end']

print("✓ All simulation mathematics verified successfully!")

