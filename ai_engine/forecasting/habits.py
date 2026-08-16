

"""
Habit-based lifestyle regression: predicts health_index and focus_index
from lifestyle hour inputs (sleep, exercise, screen, social, study).
Used by ai_engine/simulation/simulator.py.
"""

import numpy as np
from sqlalchemy.orm import Session
from database import models
from sklearn.linear_model import LinearRegression
from typing import Dict, Tuple

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


def fit_digital_twin_models(db: Session, user_id: int) -> Tuple[Dict, bool]:
    """
    Fits regression models against the user's own historical records
    (impact_score for habits, focus_score for study) as training targets.

    Separates habit records by habit_name (positive vs. screen) before fitting,
    since lumping all habit types into one regression produces a sign-inverted
    slope when screen-time entries dominate the sample.

    Returns (coefs, is_fallback). is_fallback=True means not enough data,
    so predict_scenario_scores() uses a heuristic formula instead.
    """
    habit_records = db.query(models.HabitRecord).filter_by(user_id=user_id).all()
    study_records = db.query(models.StudyRecord).filter_by(user_id=user_id).all()

    if len(habit_records) < 5 or len(study_records) < 5:
        return {}, True

    overall_mean_impact = np.mean([h.impact_score for h in habit_records])

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


def predict_scenario_scores(coefs: Dict, sleep_hours: float, exercise_hours: float,
                             screen_hours: float, social_hours: float,
                             study_hours: float) -> Dict[str, float]:
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