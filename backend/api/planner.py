import json
from datetime import date
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, status
from database import crud, schemas, models
from ai_engine.auto_planner import generate_autonomous_daily_schedule
from backend.api.suggestions import get_user_baseline_metrics


router = APIRouter(
    prefix="/planner",
    tags=["planner"],
    responses={404: {"description": "Resource not found"}}
)


@router.post("/auto-plan/{user_id}", response_model=schemas.AutoPlanResponse)
async def auto_plan_today(
    user_id: str,
    req: Optional[schemas.AutoPlanRequest] = None
):
    """
    Autonomous AI daily routine planner.
    Analyzes live telemetry, creates 4-5 circadian scheduled focus blocks,
    and commits them directly to MongoDB (UserSuggestionDoc + UserDoc.tasks_json).
    """
    user = await crud.get_user(user_id)
    if not user:
        user = await crud.get_or_create_demo_user("professional")

    u_id_str = str(user.id)
    target_date = (req.plan_date if req and req.plan_date else date.today().isoformat())
    force = req.force if req else False

    # Check if already planned for today (unless forced)
    if not force and user.last_auto_planned_date == target_date and user.last_auto_plan_briefing:
        # Load existing auto-planned tasks from tasks_json
        existing_tasks = []
        if user.tasks_json:
            try:
                all_tasks = json.loads(user.tasks_json)
                existing_tasks = [
                    t for t in all_tasks
                    if t.get("date") == target_date and (t.get("is_auto_planned") or str(t.get("id", "")).startswith("autoplan-"))
                ]
            except Exception:
                existing_tasks = []

        if existing_tasks:
            return schemas.AutoPlanResponse(
                user_id=u_id_str,
                role=user.role or "professional",
                plan_date=target_date,
                autonomy_mode=user.autonomy_mode or "semi_autonomous",
                briefing=user.last_auto_plan_briefing,
                tasks=[schemas.AutoPlanTaskItem(**t) for t in existing_tasks],
                task_count=len(existing_tasks),
                auto_committed=True,
                status="success"
            )

    user_info = {
        "id": u_id_str,
        "username": user.username,
        "role": user.role or "professional",
        "age": user.age or 25,
        "retirement_goal_age": user.retirement_goal_age or 60,
        "target_net_worth": user.target_net_worth or 1000000.0,
        "monthly_income": user.monthly_income or 5000.0,
        "monthly_expenses": user.monthly_expenses or 2900.0,
        "net_worth": user.net_worth or 15000.0,
        "sleep_target_hours": user.sleep_target_hours or 8.0,
        "study_target_hours_week": user.study_target_hours_week or 15.0,
        "goal_name": user.goal_name or "Emergency Fund",
        "goal_target": user.goal_target or 50000.0,
        "goal_current": user.goal_current or 15000.0,
    }

    baseline = await get_user_baseline_metrics(user)

    plan_result = generate_autonomous_daily_schedule(
        user_info=user_info,
        baseline=baseline,
        plan_date=target_date
    )

    # Commit directly to MongoDB
    await crud.save_auto_planned_tasks(
        user_id=u_id_str,
        tasks=plan_result["tasks"],
        briefing=plan_result["briefing"],
        plan_date=target_date
    )

    return schemas.AutoPlanResponse(
        user_id=u_id_str,
        role=user.role or "professional",
        plan_date=target_date,
        autonomy_mode=user.autonomy_mode or "semi_autonomous",
        briefing=plan_result["briefing"],
        tasks=[schemas.AutoPlanTaskItem(**t) for t in plan_result["tasks"]],
        task_count=len(plan_result["tasks"]),
        auto_committed=True,
        status="success"
    )


@router.get("/auto-plan/status/{user_id}")
async def get_auto_plan_status(user_id: str):
    """
    Returns today's auto-planning status, last briefing, and task count for the user.
    """
    user = await crud.get_user(user_id)
    if not user:
        user = await crud.get_or_create_demo_user("professional")

    today_str = date.today().isoformat()
    tasks_count = 0
    if user.tasks_json:
        try:
            all_tasks = json.loads(user.tasks_json)
            tasks_count = len([t for t in all_tasks if t.get("date") == today_str])
        except Exception:
            tasks_count = 0

    return {
        "user_id": str(user.id),
        "role": user.role or "professional",
        "autonomy_mode": user.autonomy_mode or "semi_autonomous",
        "auto_planner_enabled": user.auto_planner_enabled if user.auto_planner_enabled is not None else True,
        "is_planned_today": (user.last_auto_planned_date == today_str),
        "last_planned_date": user.last_auto_planned_date,
        "last_briefing": user.last_auto_plan_briefing,
        "today_task_count": tasks_count
    }


@router.put("/autonomy-mode/{user_id}")
async def update_autonomy_mode(
    user_id: str,
    req: schemas.AutonomyModeUpdateRequest
):
    """
    Updates user AI autonomy mode ('supervised' | 'semi_autonomous' | 'full_autonomous').
    """
    if req.autonomy_mode not in ["supervised", "semi_autonomous", "full_autonomous"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid autonomy_mode. Must be 'supervised', 'semi_autonomous', or 'full_autonomous'."
        )

    user = await crud.update_user_autonomy_mode(
        user_id=user_id,
        mode=req.autonomy_mode,
        auto_planner_enabled=req.auto_planner_enabled
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    return {
        "user_id": str(user.id),
        "autonomy_mode": user.autonomy_mode,
        "auto_planner_enabled": user.auto_planner_enabled,
        "status": "updated"
    }
