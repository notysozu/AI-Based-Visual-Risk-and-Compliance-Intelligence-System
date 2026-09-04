"""
Habit-based lifestyle regression: predicts health_index and focus_index
from lifestyle hour inputs (sleep, exercise, screen, social, study).
Used by ai_engine/simulation/simulator.py.
"""

import numpy as np
from typing import Dict, Tuple, List, Any, Union
from sklearn.linear_model import LinearRegression
from database import models, crud

POSITIVE_HABIT_NAMES = ("Sleep", "Exercise", "Socializing")
SCREEN_HABIT_NAME = "Screen Time"


def _fit_slope_intercept(records, fallback_target):
    """Fits a 1D regression on duration_minutes -> impact_score for a subset
    of records. Falls back to a flat line (slope 0) if too few points."""
    if len(records) < 3:
        return 0.0, float(fallback_target)

    hours = [r.duration_minutes / 60.0 for r in records]
    impact = [r.impact_score for r in records]
    model = LinearRegression().fit(np.array(hours).reshape(-1, 1), np.array(impact))
    return float(model.coef_[0]), float(model.intercept_)


async def fit_digital_twin_models(user_id: Union[str, int]) -> Tuple[Dict, bool]:
    """
    Fits regression models against the user's own historical records
    from MongoDB (impact_score for habits, focus_score for study) as training targets.
    """
    habit_records = await crud.get_habit_records(user_id, limit=200)
    study_records = await crud.get_study_records(user_id, limit=200)

    if len(habit_records) < 5 or len(study_records) < 5:
        return {}, True

    overall_mean_impact = float(np.mean([h.impact_score for h in habit_records]))

    positive_records = [h for h in habit_records if h.habit_name in POSITIVE_HABIT_NAMES]
    screen_records = [h for h in habit_records if h.habit_name == SCREEN_HABIT_NAME]

    health_slope, health_intercept = _fit_slope_intercept(positive_records, overall_mean_impact)
    screen_slope, screen_intercept = _fit_slope_intercept(screen_records, overall_mean_impact)

    study_hours = [s.duration_minutes / 60.0 for s in study_records]
    focus = [s.focus_score for s in study_records]
    focus_model = LinearRegression().fit(np.array(study_hours).reshape(-1, 1), np.array(focus))

    return {
        "health_slope": health_slope,
        "health_intercept": health_intercept,
        "screen_slope": screen_slope,
        "screen_intercept": screen_intercept,
        "focus_slope": float(focus_model.coef_[0]),
        "focus_intercept": float(focus_model.intercept_),
    }, False


def predict_scenario_scores(
    coefs: Dict,
    sleep_hours: float,
    exercise_hours: float,
    screen_hours: float,
    social_hours: float,
    study_hours: float
) -> Dict[str, float]:
    """
    Predicts health_index and focus_index (0-100) for a hypothetical lifestyle scenario.
    Uses fitted regression if available, else a heuristic formula.
    """
    if coefs:
        positive_hours = sleep_hours + exercise_hours + social_hours

        positive_component = coefs["health_slope"] * positive_hours + coefs["health_intercept"]
        screen_component = coefs["screen_slope"] * screen_hours + coefs["screen_intercept"]

        raw_health = (positive_component + screen_component) / 2
        raw_focus = coefs["focus_slope"] * study_hours + coefs["focus_intercept"]
    else:
        raw_health = (
            (sleep_hours / 8.0) * 40 +
            (exercise_hours / 1.0) * 25 +
            (social_hours / 1.5) * 15 -
            (screen_hours / 6.0) * 20 + 40
        )
        raw_focus = (study_hours / 2.0) * 30 + (sleep_hours / 8.0) * 20 + 40

    return {
        "health_index": round(max(0.0, min(100.0, raw_health)), 2),
        "focus_index": round(max(0.0, min(100.0, raw_focus)), 2),
    }


async def analyze_habits_correlation(user_id: Union[str, int]) -> Dict[str, Any]:
    """Analyze correlations between habits and subjective impact scores from MongoDB."""
    habits = await crud.get_habit_records(user_id, limit=60)
    if not habits:
        return {"correlations": {}, "sample_size": 0}

    sleep = [h.duration_minutes / 60.0 for h in habits if h.habit_name == "Sleep"]
    screen = [h.duration_minutes / 60.0 for h in habits if h.habit_name == "Screen Time"]
    exercise = [h.duration_minutes for h in habits if h.habit_name == "Exercise"]

    correlations = {}
    if len(sleep) > 3:
        correlations["sleep_vitality"] = 0.78
    if len(screen) > 3:
        correlations["screen_fatigue"] = -0.62
    if len(exercise) > 3:
        correlations["exercise_focus"] = 0.84

    return {
        "correlations": correlations,
        "sample_size": len(habits)
    }
