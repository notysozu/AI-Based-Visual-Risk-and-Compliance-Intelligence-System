from fastapi import APIRouter, HTTPException, status
from typing import List, Union
from database import crud, schemas, models
from ai_engine.llm_integration.advisor import generate_smart_role_suggestions

router = APIRouter(
    prefix="/suggestions",
    tags=["suggestions"],
    responses={404: {"description": "Resource not found"}}
)


async def get_user_baseline_metrics(user: models.UserDoc):
    """Calculate 30-day baseline statistics from MongoDB records."""
    habits = await crud.get_habit_records(user.id, limit=30)
    studies = await crud.get_study_records(user.id, limit=30)

    sleep_records = [h.duration_minutes / 60.0 for h in habits if h.habit_name.lower() == "sleep"]
    screen_records = [h.duration_minutes / 60.0 for h in habits if "screen" in h.habit_name.lower()]
    exercise_records = [h.duration_minutes for h in habits if "exercise" in h.habit_name.lower()]
    mood_records = [h.impact_score for h in habits if h.impact_score is not None]

    study_minutes = sum([s.duration_minutes for s in studies])
    study_hours_week = (study_minutes / 60.0) * (7.0 / max(1, len(habits) or 1))

    return {
        "sleep": sum(sleep_records) / len(sleep_records) if sleep_records else user.sleep_target_hours or 7.5,
        "screen": sum(screen_records) / len(screen_records) if screen_records else 4.0,
        "exercise": sum(exercise_records) / len(exercise_records) if exercise_records else 25.0,
        "study": (study_minutes / 60.0) / max(1, len(studies) or 1) if studies else (user.study_target_hours_week or 10.0) / 7.0,
        "study_hours_week": study_hours_week if studies else user.study_target_hours_week or 10.0,
        "mood": sum(mood_records) / len(mood_records) if mood_records else 7.0,
        "monthly_savings": max(0, (user.monthly_income or 5000.0) - (user.monthly_expenses or 2900.0)),
        "current_net_worth": user.net_worth or 15000.0
    }


@router.get("/{user_id}", response_model=schemas.SuggestionsListResponse)
async def get_user_suggestions(user_id: str):
    """Retrieve all saved suggestions for a user from MongoDB, initializing defaults if none exist."""
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    items = await crud.get_user_suggestions(user_id)
    if not items:
        items = await crud.reset_user_suggestions(user_id, user.role or "professional")

    baseline = await get_user_baseline_metrics(user)
    diagnostic = f"Analyzed {user.role.capitalize()} profile · Sleep: {baseline['sleep']:.1f}h · Screen: {baseline['screen']:.1f}h · Focus: {baseline['study']:.1f}h/day"

    return schemas.SuggestionsListResponse(
        user_id=str(user.id),
        role=user.role or "professional",
        lifestyle_diagnostic=diagnostic,
        suggestions=[
            schemas.SuggestionItem(
                id=str(s.id),
                suggestion_id=s.suggestion_id,
                title=s.title,
                category=s.category,
                detail=s.detail,
                impact=s.impact,
                start_time=s.start_time,
                duration_minutes=s.duration_minutes,
                is_adopted=bool(s.is_adopted),
                is_ai_generated=bool(s.is_ai_generated),
                created_at=s.created_at
            )
            for s in items
        ]
    )


@router.post("/generate/{user_id}", response_model=schemas.SuggestionsListResponse)
async def generate_suggestions(
    user_id: str,
    req: schemas.GenerateSuggestionsRequest
):
    """
    Analyzes user data & role to formulate fresh AI suggestions in MongoDB.
    """
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_info = {
        "id": str(user.id),
        "username": user.username,
        "role": user.role or "professional",
        "age": user.age or 25,
        "retirement_goal_age": user.retirement_goal_age or 60,
        "target_net_worth": user.target_net_worth or 1000000.0,
        "monthly_income": user.monthly_income or 5000.0,
        "monthly_expenses": user.monthly_expenses or 2900.0,
        "net_worth": user.net_worth or 15000.0
    }

    baseline = await get_user_baseline_metrics(user)
    existing_records = await crud.get_user_suggestions(user_id)
    existing_items = [
        {"title": s.title, "category": s.category, "suggestion_id": s.suggestion_id}
        for s in existing_records
    ]

    ai_result = generate_smart_role_suggestions(
        user_info=user_info,
        baseline=baseline,
        recent_logs=[],
        existing_suggestions=existing_items,
        mode=req.mode
    )

    new_suggestions = ai_result.get("suggestions", [])
    if req.mode == "regenerate":
        u_id_str = str(user.id)
        await models.UserSuggestionDoc.find(models.UserSuggestionDoc.user_id == u_id_str).delete()

    for item in new_suggestions:
        await crud.create_user_suggestion(user_id, item)

    all_current = await crud.get_user_suggestions(user_id)

    return schemas.SuggestionsListResponse(
        user_id=str(user.id),
        role=user.role or "professional",
        lifestyle_diagnostic=ai_result.get("diagnostic"),
        suggestions=[
            schemas.SuggestionItem(
                id=str(s.id),
                suggestion_id=s.suggestion_id,
                title=s.title,
                category=s.category,
                detail=s.detail,
                impact=s.impact,
                start_time=s.start_time,
                duration_minutes=s.duration_minutes,
                is_adopted=bool(s.is_adopted),
                is_ai_generated=bool(s.is_ai_generated),
                created_at=s.created_at
            )
            for s in all_current
        ]
    )


@router.post("/adopt/{user_id}", response_model=schemas.SuggestionItem)
async def toggle_adopt_suggestion(
    user_id: str,
    req: schemas.SuggestionAdoptRequest
):
    """Toggle or set the adopted status of a suggestion in MongoDB."""
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated = await crud.adopt_user_suggestion(user_id, req.suggestion_id, req.is_adopted)
    if not updated:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    return schemas.SuggestionItem(
        id=str(updated.id),
        suggestion_id=updated.suggestion_id,
        title=updated.title,
        category=updated.category,
        detail=updated.detail,
        impact=updated.impact,
        start_time=updated.start_time,
        duration_minutes=updated.duration_minutes,
        is_adopted=bool(updated.is_adopted),
        is_ai_generated=bool(updated.is_ai_generated),
        created_at=updated.created_at
    )


@router.post("/reset/{user_id}", response_model=schemas.SuggestionsListResponse)
async def reset_suggestions(user_id: str):
    """Reset user suggestions to role defaults in MongoDB."""
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    items = await crud.reset_user_suggestions(user_id, user.role or "professional")

    return schemas.SuggestionsListResponse(
        user_id=str(user.id),
        role=user.role or "professional",
        lifestyle_diagnostic=f"Reset to default {user.role.capitalize()} baseline templates.",
        suggestions=[
            schemas.SuggestionItem(
                id=str(s.id),
                suggestion_id=s.suggestion_id,
                title=s.title,
                category=s.category,
                detail=s.detail,
                impact=s.impact,
                start_time=s.start_time,
                duration_minutes=s.duration_minutes,
                is_adopted=bool(s.is_adopted),
                is_ai_generated=bool(s.is_ai_generated),
                created_at=s.created_at
            )
            for s in items
        ]
    )
