import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import database, crud, schemas, models
from ai_engine.forecasting import study
from ai_engine.llm_integration.advisor import generate_optimized_study_plan
from typing import Dict, Any, List

router = APIRouter(prefix="/study", tags=["study"])


@router.get("/analytics/{user_id}")
def get_study_analytics(user_id: int, db: Session = Depends(database.get_db)):
    """
    Get detailed study habits, subject time breakdown, retention health,
    and weekly schedule distribution. Accessible for roles that need it.
    """
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    analytics_data = study.analyze_study_habits(db, user_id)
    return analytics_data


@router.get("/forecast/{user_id}")
def get_study_forecast(
    user_id: int, 
    target_score: float = 85.0, 
    db: Session = Depends(database.get_db)
):
    """
    Predict academic performance trends and exam/milestone readiness probability.
    """
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    records = db.query(models.StudyRecord).filter_by(user_id=user_id).order_by(models.StudyRecord.created_at.asc()).all()
    score_records = [
        {
            "performance_score": r.exam_score if r.exam_score is not None else (r.focus_score * 10),
            "focus_score": r.focus_score
        }
        for r in records
    ]

    habits_data = study.analyze_study_habits(db, user_id)
    trend_data = study.predict_performance_trend(score_records)
    readiness_data = study.predict_exam_readiness(
        score_records, 
        target_score=target_score, 
        weekly_study_hours=habits_data.get("avg_weekly_hours", 18.0)
    )

    return {
        "trend_analysis": trend_data,
        "readiness_analysis": readiness_data,
        "retention_health_score": habits_data.get("retention_health_score", 82),
        "avg_weekly_hours": habits_data.get("avg_weekly_hours", 18.0),
        "total_study_hours": habits_data.get("total_study_hours", 36.0)
    }


@router.post("/generate-plan/{user_id}", response_model=schemas.StudyPlanResponse)
def generate_study_plan_endpoint(
    user_id: int, 
    payload: schemas.StudyPlanRequest, 
    db: Session = Depends(database.get_db)
):
    """
    Generate an AI-optimized 7-day study plan with Pomodoro sprint blocks,
    prioritized subject allocations, and spaced repetition intervals.
    """
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # If cached plan exists and force_refresh is False, return cached plan
    if not payload.force_refresh and user.last_study_plan:
        try:
            cached = json.loads(user.last_study_plan)
            if "daily_plans" in cached and "weekly_goal" in cached:
                return cached
        except Exception:
            pass

    user_info = {
        "username": user.username,
        "role": getattr(user, "role", "student") or "student",
        "age": user.age,
        "study_target_hours_week": user.study_target_hours_week
    }

    study_summary = study.get_study_summary(db, user_id)
    plan = generate_optimized_study_plan(user_info, study_summary, payload.target_milestone)

    # Cache plan to user record
    try:
        user.last_study_plan = json.dumps(plan)
        user.last_study_plan_updated = datetime.utcnow().isoformat()
        db.commit()
    except Exception as e:
        print(f"Failed to persist study plan cache: {e}")

    return plan


@router.post("/log/{user_id}", response_model=schemas.StudyRecordResponse)
def log_study_session(
    user_id: int, 
    record: schemas.StudyRecordCreate, 
    db: Session = Depends(database.get_db)
):
    """
    Log a new study session with subject, duration, focus rating, and optional exam score.
    """
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db_record = models.StudyRecord(
        user_id=user_id,
        subject=record.subject,
        duration_minutes=record.duration_minutes,
        focus_score=record.focus_score,
        exam_score=record.exam_score,
        notes=record.notes,
        session_type=record.session_type or "study",
        created_at=record.created_at or datetime.utcnow()
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.get("/logs/{user_id}", response_model=List[schemas.StudyRecordResponse])
def get_study_logs(
    user_id: int, 
    limit: int = 50, 
    offset: int = 0, 
    db: Session = Depends(database.get_db)
):
    """
    Retrieve historical study logs for the user.
    """
    records = db.query(models.StudyRecord)\
        .filter(models.StudyRecord.user_id == user_id)\
        .order_by(models.StudyRecord.created_at.desc())\
        .offset(offset).limit(limit).all()
    return records