

"""
Financial forecasting: compound projections and goal-timeline calculations.
Used by ai_engine/simulation/simulator.py and llm_integration/advisor.py.
"""
import random
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from database import models


"""Calculates monthly compound savings accumulation."""
def project_savings(current_savings: float, monthly_savings: float, months: int,
                     annual_growth_rate: float = 0.0) -> float:
    """Compound monthly savings growth projection."""
    monthly_rate = annual_growth_rate / 12
    balance = current_savings
    for _ in range(months):
        balance = balance * (1 + monthly_rate) + monthly_savings
    return round(balance, 2)


"""Calculates months required to achieve target capital milestone."""
def project_toward_goal(current_savings: float, monthly_savings: float,
                         target_value: float, annual_growth_rate: float = 0.0,
                         max_months: int = 240) -> Optional[int]:
    """
    Months needed to reach target_value, or None if unreachable within max_months.
    Returns 0 if the goal is already met.
    """
    if current_savings >= target_value:
        return 0
    if monthly_savings <= 0 and annual_growth_rate <= 0:
        return None

    monthly_rate = annual_growth_rate / 12
    balance = current_savings
    for month in range(1, max_months + 1):
        balance = balance * (1 + monthly_rate) + monthly_savings
        if balance >= target_value:
            return month
    return None


"""Calculates year-by-year real growth deterministic trajectory."""
def run_deterministic_projection(current_age: int, retirement_age: int,
                                  current_net_worth: float, monthly_savings: float,
                                  annual_return_rate: float = 0.07,
                                  annual_inflation_rate: float = 0.025) -> List[Dict]:
    """
    Year-by-year net worth projection using inflation-adjusted ("real") growth rate.
    Returns list of {"year", "age", "net_worth"}.
    """
    years = max(retirement_age - current_age, 1)
    real_rate = (1 + annual_return_rate) / (1 + annual_inflation_rate) - 1

    projection = []
    net_worth = current_net_worth
    for year in range(1, years + 1):
        for _ in range(12):
            net_worth = net_worth * (1 + real_rate / 12) + monthly_savings
        projection.append({
            "year": year,
            "age": current_age + year,
            "net_worth": round(net_worth, 2)
        })
    return projection


def get_financial_summary(db: Session, user_id: int) -> dict:
    """
    Used by llm_integration/advisor.py's set_context() to ground the chatbot.
    Keys: current_savings, projected_savings_1y, savings_rate
    """
    user = db.query(models.User).filter_by(id=user_id).first()
    records = db.query(models.FinancialRecord).filter_by(user_id=user_id).all()

    if not user or not records:
        return {"current_savings": 0, "projected_savings_1y": 0, "savings_rate": 0,
                "note": "Not enough financial history to forecast yet."}

    total_income = sum(r.amount for r in records if r.category == "Income")
    total_investment = sum(r.amount for r in records if r.category == "Investment")
    total_expenses = sum(r.amount for r in records
                          if r.category in ["Fixed Expense", "Discretionary Expense"])

    current_savings = round(15000.0 + total_income - total_expenses, 2)  # matches simulator's seed logic
    savings_rate = round((total_investment / total_income) * 100, 2) if total_income > 0 else 0

    monthly_savings = total_investment / max(len(records) / 4, 1)  # rough monthly estimate
    projected_1y = project_savings(current_savings, monthly_savings, months=12)

    return {
        "current_savings": current_savings,
        "projected_savings_1y": projected_1y,
        "savings_rate": savings_rate
    }

"""Executes 500 stochastic simulation runs with normal return distributions."""
def run_monte_carlo_simulation(current_age: int, retirement_age: int,
                                current_net_worth: float, monthly_savings: float,
                                mean_return: float = 0.08, std_dev: float = 0.15,
                                annual_inflation_rate: float = 0.025,
                                num_simulations: int = 500) -> Dict:
    """
    Monte Carlo simulation of net worth growth under randomized annual returns.
    Returns years/ages arrays plus median/p10/p90 net-worth bands per year,
    and final_values (one ending net worth per simulated path).
    Temporarily seeds the RNG to ensure deterministic results.
    """
    years = max(retirement_age - current_age, 1)
    ages = [current_age + y for y in range(1, years + 1)]
    year_labels = list(range(1, years + 1))

    # Temporarily seed RNG for reproducibility
    state = random.getstate()
    random.seed(42)

    try:
        # paths[sim_index][year_index] = net worth at end of that year
        paths: List[List[float]] = []

        for _ in range(num_simulations):
            balance = current_net_worth
            path = []
            for _year in range(years):
                # sample one annual return per year, adjust for inflation, apply monthly compounding
                annual_return = random.gauss(mean_return, std_dev)
                real_rate = (1 + annual_return) / (1 + annual_inflation_rate) - 1
                for _month in range(12):
                    balance = balance * (1 + real_rate / 12) + monthly_savings
                path.append(round(balance, 2))
            paths.append(path)
    finally:
        random.setstate(state)

    # Compute percentile bands per year across all simulations
    median, p10, p90 = [], [], []
    for year_idx in range(years):
        values_at_year = sorted(p[year_idx] for p in paths)
        n = len(values_at_year)
        median.append(values_at_year[n // 2])
        p10.append(values_at_year[int(n * 0.10)])
        p90.append(values_at_year[min(int(n * 0.90), n - 1)])

    final_values = [p[-1] for p in paths]

    return {
        "years": year_labels,
        "ages": ages,
        "median": median,
        "p10": p10,
        "p90": p90,
        "final_values": final_values,
    }