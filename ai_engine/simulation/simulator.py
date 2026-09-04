import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timedelta

from database import models, crud
from ai_engine.forecasting import financial, habits, study


async def get_user_baseline_metrics(user_id: Union[str, int]) -> Dict[str, float]:
    """
    Compute average habits and financial baselines from the past 30 days of data in MongoDB.
    """
    defaults = {
        "monthly_savings": 1000.0,
        "current_net_worth": 15000.0,
        "sleep_hours": 7.5,
        "exercise_hours": 0.5,
        "screen_hours": 4.0,
        "social_hours": 1.0,
        "study_hours_week": 8.0,
        "study_hours_daily": 8.0 / 7.0
    }

    user = await crud.get_user(user_id)
    if not user:
        return defaults

    user_net_worth = getattr(user, "net_worth", None)
    current_net_worth = float(user_net_worth) if user_net_worth and user_net_worth > 0 else 15000.0

    user_income = float(getattr(user, "monthly_income", None) or 5000.0)
    user_expenses = float(getattr(user, "monthly_expenses", None) or 2900.0)
    monthly_savings = max(0.0, user_income - user_expenses)

    habit_logs = await crud.get_habit_records(user_id, limit=60)
    study_logs = await crud.get_study_records(user_id, limit=60)

    sleep_hours = []
    exercise_hours = []
    screen_hours = []
    social_hours = []

    for h in habit_logs:
        dur_h = h.duration_minutes / 60.0
        if h.habit_name == "Sleep":
            sleep_hours.append(dur_h)
        elif h.habit_name == "Exercise":
            exercise_hours.append(dur_h)
        elif h.habit_name == "Screen Time":
            screen_hours.append(dur_h)
        elif h.habit_name == "Socializing":
            social_hours.append(dur_h)

    avg_sleep = np.mean(sleep_hours) if len(sleep_hours) > 0 else float(getattr(user, "sleep_target_hours", 7.5) or 7.5)
    avg_exercise = np.mean(exercise_hours) if len(exercise_hours) > 0 else 0.5
    avg_screen = np.mean(screen_hours) if len(screen_hours) > 0 else 3.5
    avg_social = np.mean(social_hours) if len(social_hours) > 0 else 1.0

    total_study_hours = sum(s.duration_minutes / 60.0 for s in study_logs)
    avg_study_week = total_study_hours / (30.0 / 7.0) if len(study_logs) > 0 else float(getattr(user, "study_target_hours_week", 10.0) or 10.0)

    return {
        "monthly_savings": round(monthly_savings, 2),
        "monthly_surplus": round(monthly_savings, 2),
        "current_net_worth": round(current_net_worth, 2),
        "sleep_hours": round(float(avg_sleep), 2),
        "average_sleep": round(float(avg_sleep), 2),
        "exercise_hours": round(float(avg_exercise), 2),
        "screen_hours": round(float(avg_screen), 2),
        "social_hours": round(float(avg_social), 2),
        "study_hours_week": round(float(avg_study_week), 2),
        "study_hours_daily": round(float(avg_study_week / 7.0), 2)
    }


async def run_what_if_comparison(
    user_id: Union[str, int],
    change_a: Dict[str, float],
    change_b: Dict[str, float],
    years: int = 5
) -> Dict[str, Any]:
    """
    Run two scenarios and return side-by-side comparison results from MongoDB.
    """
    user = await crud.get_user(user_id)
    if not user:
        raise ValueError("User not found")

    baseline = await get_user_baseline_metrics(user_id)
    coefs, is_fallback = await habits.fit_digital_twin_models(user_id)

    scenarios = {
        "scenario_a": change_a,
        "scenario_b": change_b
    }

    results = {}

    for name, change in scenarios.items():
        mod_savings = max(0.0, baseline["monthly_savings"] + change.get("monthly_investment_change", 0.0))
        mod_sleep = max(4.0, min(12.0, baseline["sleep_hours"] + change.get("sleep_hours_change", 0.0)))
        mod_study_week = max(0.0, baseline["study_hours_week"] + change.get("weekly_study_change", 0.0))
        mod_study_daily = mod_study_week / 7.0

        mod_exercise = baseline["exercise_hours"]
        mod_screen = baseline["screen_hours"]
        mod_social = baseline["social_hours"]

        preds = habits.predict_scenario_scores(
            coefs=coefs,
            sleep_hours=mod_sleep,
            exercise_hours=mod_exercise,
            screen_hours=mod_screen,
            social_hours=mod_social,
            study_hours=mod_study_daily
        )

        fin_proj = financial.run_deterministic_projection(
            current_age=user.age,
            retirement_age=user.age + years,
            current_net_worth=baseline["current_net_worth"],
            monthly_savings=mod_savings,
            annual_return_rate=0.08,
            annual_inflation_rate=0.025
        )

        retirement_proj = financial.run_deterministic_projection(
            current_age=user.age,
            retirement_age=user.retirement_goal_age,
            current_net_worth=baseline["current_net_worth"],
            monthly_savings=mod_savings,
            annual_return_rate=0.08,
            annual_inflation_rate=0.025
        )
        final_retirement_wealth = retirement_proj[-1]["net_worth"]
        attained_retirement = final_retirement_wealth >= user.target_net_worth

        datapoints = []
        for p in fin_proj:
            datapoints.append({
                "year": p["year"],
                "net_worth": p["net_worth"],
                "health_index": round(preds["health_index"], 2),
                "focus_index": round(preds["focus_index"], 2)
            })

        results[name] = {
            "scenario_name": "Scenario A" if name == "scenario_a" else "Scenario B",
            "datapoints": datapoints,
            "attained_retirement": attained_retirement,
            "wealth_at_end": fin_proj[-1]["net_worth"],
            "retirement_wealth": final_retirement_wealth,
            "health_index": preds["health_index"],
            "focus_index": preds["focus_index"],
            "details": {
                "sleep": mod_sleep,
                "study_week": mod_study_week,
                "monthly_savings": mod_savings
            }
        }

    return results
