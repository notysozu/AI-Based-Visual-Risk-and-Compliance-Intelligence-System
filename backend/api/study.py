import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from database import crud, schemas
from ai_engine.forecasting import study
from ai_engine.llm_integration.advisor import generate_optimized_study_plan

router = APIRouter(prefix="/study", tags=["study"])


@router.get("/analytics/{user_id}")
async def get_study_analytics(user_id: str):
    """
    Get detailed study habits, subject time breakdown, retention health,
    and weekly schedule distribution from MongoDB.
    """
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    analytics_data = await study.analyze_study_habits(user_id)
    return analytics_data


@router.get("/forecast/{user_id}")
async def get_study_forecast(
    user_id: str,
    target_score: float = 85.0
):
    """
    Predict academic performance trends and exam/milestone readiness probability from MongoDB.
    """
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    records = await crud.get_study_records(user_id, limit=100)
    score_records = [
        {
            "performance_score": r.exam_score if r.exam_score is not None else (r.focus_score * 10),
            "focus_score": r.focus_score
        }
        for r in records
    ]

    habits_data = await study.analyze_study_habits(user_id)
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


@router.get("/plan/{user_id}")
async def get_study_plan_endpoint(user_id: str):
    """
    Retrieve the current saved/persisted 7-day study plan from MongoDB.
    """
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.last_study_plan:
        try:
            cached = json.loads(user.last_study_plan)
            if "daily_plans" in cached and "weekly_goal" in cached:
                return cached
        except Exception:
            pass
    return None


@router.post("/generate-plan/{user_id}", response_model=schemas.StudyPlanResponse)
async def generate_study_plan_endpoint(
    user_id: str,
    payload: schemas.StudyPlanRequest
):
    """
    Generate an AI-optimized 7-day study plan with Pomodoro sprint blocks,
    prioritized subject allocations, and spaced repetition intervals.
    """
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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

    study_summary = await study.get_study_summary(user_id)
    plan = generate_optimized_study_plan(user_info, study_summary, payload.target_milestone)

    try:
        user.last_study_plan = json.dumps(plan)
        user.last_study_plan_updated = datetime.utcnow().isoformat()
        await user.save()
    except Exception as e:
        print(f"Failed to persist study plan cache: {e}")

    return plan


@router.post("/log/{user_id}", response_model=schemas.StudyRecordResponse)
async def log_study_session(
    user_id: str,
    record: schemas.StudyRecordCreate
):
    """
    Log a new study session in MongoDB.
    """
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return await crud.create_study_record(record, user_id)


@router.get("/logs/{user_id}", response_model=List[schemas.StudyRecordResponse])
async def get_study_logs(
    user_id: str,
    limit: int = 50,
    offset: int = 0
):
    """
    Retrieve historical study logs for the user from MongoDB.
    """
    return await crud.get_study_records(user_id=user_id, limit=limit, offset=offset)
