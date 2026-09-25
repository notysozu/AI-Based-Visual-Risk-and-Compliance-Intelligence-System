import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, List, Optional
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
        weekly_study_hours=habits_data.get("avg_weekly_hours", 0.0)
    )

    return {
        "trend_analysis": trend_data,
        "readiness_analysis": readiness_data,
        "retention_health_score": habits_data.get("retention_health_score", 100),
        "avg_weekly_hours": habits_data.get("avg_weekly_hours", 0.0),
        "total_study_hours": habits_data.get("total_study_hours", 0.0)
    }


@router.get("/onboarding-status/{user_id}")
async def get_study_onboarding_status(user_id: str):
    """
    Check if the user has completed study & academic onboarding and retrieve their study profile.
    """
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return await crud.get_user_study_profile(user_id)


@router.post("/onboarding/{user_id}")
async def submit_study_onboarding(user_id: str, payload: Dict[str, Any]):
    """
    Submit mandatory onboarding questionnaire, register subjects, and save to MongoDB.
    """
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated_user = await crud.save_user_study_onboarding(user_id, payload)
    if not updated_user:
        raise HTTPException(status_code=500, detail="Failed to save onboarding data")

    return {
        "status": "success",
        "message": "Study onboarding completed and persisted to MongoDB",
        "study_onboarded": True,
        "profile": await crud.get_user_study_profile(user_id)
    }


@router.get("/exams/{user_id}")
async def get_study_exams(user_id: str):
    """
    Retrieve user's registered upcoming exams with days-remaining countdown.
    """
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    prof = await crud.get_user_study_profile(user_id)
    exams = prof.get("exams", [])

    now_date = datetime.utcnow().date()
    enriched_exams = []
    for ex in exams:
        item = dict(ex)
        exam_date_str = item.get("exam_date")
        days_left = None
        if exam_date_str:
            try:
                ex_d = datetime.strptime(exam_date_str, "%Y-%m-%d").date()
                days_left = (ex_d - now_date).days
            except Exception:
                days_left = None
        item["days_left"] = days_left
        enriched_exams.append(item)

    enriched_exams.sort(key=lambda x: (x.get("days_left") is None, x.get("days_left") if x.get("days_left") is not None else 999))
    return enriched_exams


@router.post("/exams/{user_id}")
async def add_study_exam_endpoint(user_id: str, exam: Dict[str, Any]):
    """
    Register a new upcoming exam in MongoDB.
    """
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    saved_exam = await crud.add_user_exam(user_id, exam)
    return saved_exam


@router.delete("/exams/{user_id}/{exam_id}")
async def delete_study_exam_endpoint(user_id: str, exam_id: str):
    """
    Remove or mark an exam completed.
    """
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    deleted = await crud.delete_user_exam(user_id, exam_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Exam not found")
    return {"status": "deleted", "exam_id": exam_id}


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
    payload: Optional[schemas.StudyPlanRequest] = Body(default=None)
):
    """
    Generate an AI-optimized 7-day study plan with Pomodoro sprint blocks,
    prioritized subject allocations, and spaced repetition intervals.
    """
    if payload is None:
        payload = schemas.StudyPlanRequest()

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


# ──────────────────────────────────────────────
# Study Notes Endpoints (Jarvis & Notes Module)
# ──────────────────────────────────────────────

@router.get("/notes/{user_id}")
async def get_study_notes_endpoint(
    user_id: str,
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100
):
    """
    Retrieve user study notes from MongoDB.
    """
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    notes = await crud.get_user_notes(user_id, category=category, search=search, limit=limit)
    return [
        {
            "id": str(n.id),
            "user_id": n.user_id,
            "title": n.title,
            "content": n.content,
            "category": n.category,
            "tags": n.tags,
            "is_pinned": n.is_pinned,
            "created_at": n.created_at.isoformat() if isinstance(n.created_at, datetime) else str(n.created_at),
            "updated_at": n.updated_at.isoformat() if isinstance(n.updated_at, datetime) else str(n.updated_at)
        }
        for n in notes
    ]


@router.post("/notes/{user_id}")
async def save_study_note_endpoint(
    user_id: str,
    payload: Dict[str, Any] = Body(...)
):
    """
    Create or update a note in MongoDB.
    """
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    note = await crud.save_user_note(user_id, payload)
    return {
        "id": str(note.id),
        "user_id": note.user_id,
        "title": note.title,
        "content": note.content,
        "category": note.category,
        "tags": note.tags,
        "is_pinned": note.is_pinned,
        "created_at": note.created_at.isoformat() if isinstance(note.created_at, datetime) else str(note.created_at),
        "updated_at": note.updated_at.isoformat() if isinstance(note.updated_at, datetime) else str(note.updated_at)
    }


@router.delete("/notes/{user_id}/{note_id}")
async def delete_study_note_endpoint(
    user_id: str,
    note_id: str
):
    """
    Delete a user note from MongoDB.
    """
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    deleted = await crud.delete_user_note(user_id, note_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"status": "deleted", "note_id": note_id}

