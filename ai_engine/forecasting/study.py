
"""
Study performance trend prediction.
Used by ai_engine/simulation/simulator.py and llm_integration/advisor.py.
"""

from typing import List, Dict
from sqlalchemy.orm import Session
from database import models


def predict_performance_trend(records: List[Dict]) -> str:
    """
    records: list of dicts with 'performance_score' (chronological order assumed).
    Simple linear regression (slope sign) to classify trend direction.
    """
    if not records or len(records) < 2:
        return "insufficient data"

    scores = [r.get("performance_score", 0) for r in records]
    n = len(scores)
    x = list(range(n))
    x_mean = sum(x) / n
    y_mean = sum(scores) / n

    numerator = sum((x[i] - x_mean) * (scores[i] - y_mean) for i in range(n))
    denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
    slope = numerator / denominator if denominator != 0 else 0

    if slope > 0.5:
        return "improving"
    elif slope < -0.5:
        return "declining"
    return "stable"


def get_study_summary(db: Session, user_id: int) -> dict:
    """
    Used by llm_integration/advisor.py's set_context() to ground the chatbot.
    Keys: avg_weekly_hours, performance_trend
    """
    records = db.query(models.StudyRecord).filter_by(user_id=user_id).all()

    if not records:
        return {"avg_weekly_hours": 0, "performance_trend": "insufficient data"}

    total_hours = sum(r.duration_minutes / 60.0 for r in records)
    avg_weekly_hours = round(total_hours / max(len(records) / 7, 1), 1)

    score_records = [{"performance_score": r.exam_score or r.focus_score * 10} for r in records]
    trend = predict_performance_trend(score_records)

    return {
        "avg_weekly_hours": avg_weekly_hours,
        "performance_trend": trend
    }