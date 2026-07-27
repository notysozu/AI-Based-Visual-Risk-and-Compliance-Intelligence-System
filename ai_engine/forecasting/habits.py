import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sklearn.linear_model import LinearRegression
from database import models
from datetime import date
from typing import Dict, Any

def analyze_habits_correlation(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Query database records, aggregate daily metrics, and compute correlations.
    """
    # Fetch historical data
    habits = db.query(models.HabitRecord).filter_by(user_id=user_id).all()
    studies = db.query(models.StudyRecord).filter_by(user_id=user_id).all()
    
    if not habits:
        return {"correlations": {}, "status": "insufficient_data"}
        
    # Prepare Habit DataFrame
    habit_data = []
    for h in habits:
        habit_data.append({
            "date": h.created_at.date(),
            "habit_name": h.habit_name,
            "duration": h.duration_minutes / 60.0, # hours
            "impact": h.impact_score
        })
    df_habits = pd.DataFrame(habit_data)
    
    # Prepare Study DataFrame
    study_data = []
    for s in studies:
        study_data.append({
            "date": s.created_at.date(),
            "study_duration": s.duration_minutes / 60.0,
            "focus_score": s.focus_score
        })
    df_studies = pd.DataFrame(study_data)
    
    # Pivot habits to get daily totals
    # We want columns: Sleep_hours, Exercise_hours, ScreenTime_hours, Social_hours, Average_impact
    pivot_duration = df_habits.pivot_table(
        index="date", 
        columns="habit_name", 
        values="duration", 
        aggfunc="sum"
    ).fillna(0.0)
    
    pivot_impact = df_habits.groupby("date")["impact"].mean().to_frame("daily_impact")
    
    # Merge daily summaries
    daily_summary = pivot_duration.join(pivot_impact, how="outer").fillna(0.0)
    
    # Merge with study metrics
    if not df_studies.empty:
        daily_study_sum = df_studies.groupby("date").agg({
            "study_duration": "sum",
            "focus_score": "mean"
        })
        daily_summary = daily_summary.join(daily_study_sum, how="outer").fillna(0.0)
    else:
        daily_summary["study_duration"] = 0.0
        daily_summary["focus_score"] = 0.0

    # Ensure required columns exist
    for col in ["Sleep", "Exercise", "Screen Time", "Socializing", "study_duration", "focus_score", "daily_impact"]:
        if col not in daily_summary.columns:
            daily_summary[col] = 0.0
            
    # Calculate Pearson correlations
    corr_matrix = daily_summary[[
        "Sleep", "Exercise", "Screen Time", "Socializing", "study_duration", "focus_score", "daily_impact"
    ]].corr().fillna(0.0)
    
    return {
        "correlations": corr_matrix.to_dict(),
        "status": "success",
        "sample_size": len(daily_summary)
    }

def fit_digital_twin_models(db: Session, user_id: int):
    """
    Fits Scikit-Learn models predicting:
      1. Health Index (based on sleep, exercise, screen time, social)
      2. Focus Index (based on sleep, exercise, screen time, study duration)
    Returns trained models and intercepts/coefficients, or fallback coefficients.
    """
    habits = db.query(models.HabitRecord).filter_by(user_id=user_id).all()
    studies = db.query(models.StudyRecord).filter_by(user_id=user_id).all()
    
    # Heuristic fallback coefficients
    fallback = {
        "health": {
            "intercept": 5.0,
            "sleep_coef": 0.4,
            "exercise_coef": 0.8,
            "screen_coef": -0.3,
            "social_coef": 0.2
        },
        "focus": {
            "intercept": 6.0,
            "sleep_coef": 0.3,
            "exercise_coef": 0.2,
            "screen_coef": -0.4,
            "study_coef": -0.1  # Diminishing returns beyond sweet spot
        }
    }
    
    if len(habits) < 20:
        return fallback, True  # Use fallback
        
    try:
        # Recreate daily summary
        habit_data = [{"date": h.created_at.date(), "name": h.habit_name, "dur": h.duration_minutes/60.0, "imp": h.impact_score} for h in habits]
        df_habits = pd.DataFrame(habit_data)
        
        pivot_dur = df_habits.pivot_table(index="date", columns="name", values="dur", aggfunc="sum").fillna(0.0)
        pivot_imp = df_habits.groupby("date")["imp"].mean().to_frame("daily_impact")
        
        daily = pivot_dur.join(pivot_imp, how="outer").fillna(0.0)
        
        if studies:
            study_data = [{"date": s.created_at.date(), "dur": s.duration_minutes/60.0, "focus": s.focus_score} for s in studies]
            df_studies = pd.DataFrame(study_data)
            daily_stud = df_studies.groupby("date").agg({"dur": "sum", "focus": "mean"})
            daily = daily.join(daily_stud, how="outer").fillna(0.0)
        else:
            daily["dur"] = 0.0
            daily["focus"] = 0.0
            
        # Ensure all columns present
        for col in ["Sleep", "Exercise", "Screen Time", "Socializing", "dur", "focus", "daily_impact"]:
            if col not in daily.columns:
                daily[col] = 0.0
                
        # Fit Health Model (predict daily_impact)
        X_health = daily[["Sleep", "Exercise", "Screen Time", "Socializing"]]
        y_health = daily["daily_impact"]
        
        health_model = LinearRegression()
        health_model.fit(X_health, y_health)
        
        # Fit Focus Model (predict focus score)
        # Filter for days when study actually happened (focus > 0)
        study_days = daily[daily["focus"] > 0]
        if len(study_days) >= 5:
            X_focus = study_days[["Sleep", "Exercise", "Screen Time", "dur"]]
            y_focus = study_days["focus"]
            focus_model = LinearRegression()
            focus_model.fit(X_focus, y_focus)
            focus_coefs = {
                "intercept": float(focus_model.intercept_),
                "sleep_coef": float(focus_model.coef_[0]),
                "exercise_coef": float(focus_model.coef_[1]),
                "screen_coef": float(focus_model.coef_[2]),
                "study_coef": float(focus_model.coef_[3])
            }
        else:
            focus_coefs = fallback["focus"]
            
        trained_coefs = {
            "health": {
                "intercept": float(health_model.intercept_),
                "sleep_coef": float(health_model.coef_[0]),
                "exercise_coef": float(health_model.coef_[1]),
                "screen_coef": float(health_model.coef_[2]),
                "social_coef": float(health_model.coef_[3])
            },
            "focus": focus_coefs
        }
        return trained_coefs, False
        
    except Exception as e:
        print(f"Error training models: {e}. Falling back to default heuristics.")
        return fallback, True

def predict_scenario_scores(
    coefs: Dict[str, Any],
    sleep_hours: float,
    exercise_hours: float,
    screen_hours: float,
    social_hours: float,
    study_hours: float
) -> Dict[str, float]:
    """
    Use model coefficients to predict scores.
    Scores are bounded to [1, 10].
    """
    h = coefs["health"]
    health_pred = (
        h["intercept"] + 
        h["sleep_coef"] * sleep_hours + 
        h["exercise_coef"] * exercise_hours + 
        h["screen_coef"] * screen_hours + 
        h["social_coef"] * social_hours
    )
    
    f = coefs["focus"]
    focus_pred = (
        f["intercept"] + 
        f["sleep_coef"] * sleep_hours + 
        f["exercise_coef"] * exercise_hours + 
        f["screen_coef"] * screen_hours + 
        f["study_coef"] * study_hours
    )
    
    return {
        "health_index": float(np.clip(health_pred, 1.0, 10.0)),
        "focus_index": float(np.clip(focus_pred, 1.0, 10.0))
    }
