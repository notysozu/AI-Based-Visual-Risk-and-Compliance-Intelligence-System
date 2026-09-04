import json
import re
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from database import crud, models, schemas
from ai_engine.simulation import simulator
from ai_engine.llm_integration.advisor import process_twin_copilot_turn
from backend.api.action_handlers import execute_action_payload

router = APIRouter(prefix="/chat", tags=["chat"])


def generate_chat_title_summary(prompt: str) -> str:
    """Generate a clean, concise AI title summarizing the user's initial inquiry."""
    p_lower = prompt.lower().strip()
    if "laptop" in p_lower or ("buy" in p_lower and "$" in prompt):
        return "Laptop Purchase Simulation"
    elif "sleep" in p_lower and ("study" in p_lower or "work" in p_lower or "hour" in p_lower):
        return "Sleep & Focus Shift"
    elif "deep work" in p_lower or "sprint" in p_lower or "schedule" in p_lower:
        return "Daily Focus Sprint"
    elif "wealth" in p_lower or "monte carlo" in p_lower or "retirement" in p_lower:
        return "Monte Carlo Wealth Plan"
    elif "income" in p_lower or "expense" in p_lower or "savings" in p_lower:
        return "Cash Flow Optimization"
    elif any(k in p_lower for k in ["tutorial", "how does", "what is this", "explain website", "features"]):
        return "Platform Guide"

    words = re.findall(r"[\w$]+", prompt)
    if not words:
        return "New Dialogue"
    if len(words) <= 4:
        return " ".join(words).title()
    return " ".join(words[:4]).title()


async def build_user_telemetry_bundle(user: models.UserDoc) -> Dict[str, Any]:
    """Search and aggregate all recent telemetry logs and baseline stats for the user from MongoDB."""
    u_id_str = str(user.id)
    baseline = await simulator.get_user_baseline_metrics(u_id_str)
    recent_habits = await crud.get_habit_records(u_id_str, limit=30)
    recent_studies = await crud.get_study_records(u_id_str, limit=30)
    recent_txns = await crud.get_financial_records(u_id_str, limit=30)
    user_suggestions = await crud.get_user_suggestions(u_id_str)

    sleep_logs = [h.duration_minutes / 60.0 for h in recent_habits if h.habit_name.lower() == "sleep"]
    screen_logs = [h.duration_minutes / 60.0 for h in recent_habits if "screen" in h.habit_name.lower()]
    exercise_logs = [h for h in recent_habits if "exercise" in h.habit_name.lower() or "workout" in h.habit_name.lower()]
    mood_logs = [h.impact_score for h in recent_habits if h.impact_score is not None]

    avg_sleep = round(sum(sleep_logs) / len(sleep_logs), 1) if sleep_logs else float(baseline.get("sleep_hours", 7.5))
    avg_screen = round(sum(screen_logs) / len(screen_logs), 1) if screen_logs else 4.0
    study_mins = sum(s.duration_minutes for s in recent_studies)
    study_hours_week = round((study_mins / 60.0) * (7.0 / max(1, len(recent_habits) or 1)), 1) if recent_studies else float(baseline.get("study_hours_week", 10.0))
    subjects = list({s.subject for s in recent_studies if s.subject})[:4]

    monthly_savings = max(0.0, float(user.monthly_income or 0.0) - float(user.monthly_expenses or 0.0))
    savings_rate = round((monthly_savings / float(user.monthly_income)) * 100) if user.monthly_income and user.monthly_income > 0 else 0

    return {
        "baseline": baseline,
        "avg_sleep": avg_sleep,
        "sleep_target": float(user.sleep_target_hours or 8.0),
        "sleep_debt": round(max(0.0, float(user.sleep_target_hours or 8.0) - avg_sleep), 1),
        "avg_screen": avg_screen,
        "exercise_days_count": len(exercise_logs),
        "avg_mood": round(sum(mood_logs) / len(mood_logs), 1) if mood_logs else 7.5,
        "study_hours_week": study_hours_week,
        "study_target_week": float(user.study_target_hours_week or 10.0),
        "recent_subjects": subjects,
        "monthly_income": float(user.monthly_income or 0.0),
        "monthly_expenses": float(user.monthly_expenses or 0.0),
        "monthly_savings": monthly_savings,
        "savings_rate": savings_rate,
        "net_worth": float(user.net_worth or 0.0),
        "target_net_worth": float(user.target_net_worth or 1000000.0),
        "target_retirement_age": int(user.retirement_goal_age or 60),
        "active_adopted_tasks": len([s for s in user_suggestions if s.is_adopted == 1]),
    }


@router.get("/sessions/{user_id}", response_model=List[schemas.ChatSessionResponse])
async def list_user_chat_sessions(user_id: str):
    """
    List all chat sessions strictly belonging to the specified user from MongoDB.
    If no sessions exist for a new user, initialize the default 'Tutorial' guide thread.
    """
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    u_id_str = str(user.id)
    sessions = await crud.get_chat_sessions(u_id_str)
    if not sessions:
        tutorial_session = await crud.create_chat_session(u_id_str, title="Tutorial")
        await crud.create_chat_message(
            session_id=str(tutorial_session.id),
            role="assistant",
            content="""### 👋 Welcome to your **Digital Twin AI Copilot**!

I am your personal AI connected in real time to your daily routines, academic focus, and financial engine.

#### 🚀 What you can do here:
1. **Simulate Purchases & Financial Tradeoffs**: Ask *"If I buy a $1,200 laptop today, how does that affect my emergency fund goal?"* to see exact milestone delays and 5-year opportunity costs.
2. **Stress-Test Habits & Routines**: Type *"What if I study 5 more hours a week and sleep 30 mins less?"* to evaluate vitality and cognitive focus elasticity.
3. **Automate Daily Scheduling**: Type *"Add a 45 min deep work sprint at 10:00 AM"* to schedule focus blocks directly into your Daily Planner.
4. **Explore the Website & Architecture**: Ask me anything about the **Planner**, **Simulator**, **Wealth Engine**, or **Analytics** modules.

Feel free to ask your first question below!""",
            action_type="none",
            action_payload=None,
            action_status="none"
        )
        sessions = await crud.get_chat_sessions(u_id_str)

    res = []
    for s in sessions:
        last_preview = s.messages[-1].content[:60] if s.messages else ""
        res.append(schemas.ChatSessionResponse(
            id=str(s.id),
            user_id=s.user_id,
            title=s.title,
            created_at=s.created_at,
            updated_at=s.updated_at,
            message_count=len(s.messages),
            last_message_preview=last_preview
        ))
    return res


@router.post("/sessions/{user_id}", response_model=schemas.ChatSessionResponse)
async def create_new_chat_session(
    user_id: str,
    session_data: schemas.ChatSessionCreate
):
    """Create a new conversational thread for a user in MongoDB."""
    user = await crud.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    u_id_str = str(user.id)
    session = await crud.create_chat_session(u_id_str, title=session_data.title or "New Conversation")

    await crud.create_chat_message(
        session_id=str(session.id),
        role="assistant",
        content="✨ New conversation thread started. What life decision or schedule adjustment would you like to simulate?",
        action_type="none",
        action_payload=None,
        action_status="none"
    )

    return schemas.ChatSessionResponse(
        id=str(session.id),
        user_id=session.user_id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=1,
        last_message_preview="✨ New conversation thread started."
    )


@router.delete("/sessions/{session_id}")
async def remove_chat_session(
    session_id: str,
    user_id: Optional[str] = Query(None)
):
    """Delete a chat session from MongoDB with ownership verification."""
    session = await crud.get_chat_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    if user_id is not None:
        user = await crud.get_user(user_id)
        u_id_str = str(user.id) if user else str(user_id)
        if session.user_id != u_id_str:
            raise HTTPException(status_code=403, detail="Unauthorized: Chat session does not belong to this user")

    await crud.delete_chat_session(session_id)
    return {"message": "Chat session deleted successfully", "session_id": session_id}


@router.get("/messages/{session_id}", response_model=List[schemas.ChatMessageResponse])
async def get_session_messages(
    session_id: str,
    user_id: Optional[str] = Query(None)
):
    """Retrieve full chronological conversation history for a session from MongoDB."""
    session = await crud.get_chat_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    if user_id is not None:
        user = await crud.get_user(user_id)
        u_id_str = str(user.id) if user else str(user_id)
        if session.user_id != u_id_str:
            raise HTTPException(status_code=403, detail="Unauthorized: Access denied to this user's conversation")

    return [
        schemas.ChatMessageResponse(
            id=m.id,
            session_id=str(session.id),
            role=m.role,
            content=m.content,
            action_type=m.action_type,
            action_payload=m.action_payload,
            action_status=m.action_status,
            created_at=m.created_at
        )
        for m in session.messages
    ]


@router.post("/message/create_thread")
async def create_thread_and_send_message(req: schemas.ChatPromptRequest):
    """
    Creates a new session with an AI-summarized title and processes the first message in MongoDB.
    """
    user = await crud.get_user(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    u_id_str = str(user.id)
    initial_title = generate_chat_title_summary(req.prompt)

    session = await crud.create_chat_session(u_id_str, title=initial_title)

    user_msg = await crud.create_chat_message(
        session_id=str(session.id),
        role="user",
        content=req.prompt,
        action_type="none",
        action_payload=None,
        action_status="none"
    )

    user_info = {
        "id": u_id_str,
        "username": user.username,
        "role": user.role,
        "age": user.age,
        "retirement_goal_age": user.retirement_goal_age,
        "target_net_worth": user.target_net_worth,
        "monthly_income": user.monthly_income,
        "monthly_expenses": user.monthly_expenses,
        "net_worth": user.net_worth,
        "sleep_target_hours": user.sleep_target_hours,
        "study_target_hours_week": user.study_target_hours_week,
    }

    telemetry = await build_user_telemetry_bundle(user)

    bot_result = process_twin_copilot_turn(
        user_id=u_id_str,
        prompt=req.prompt,
        history=[],
        user_info=user_info,
        baseline=telemetry["baseline"],
        telemetry=telemetry,
        client_context=req.client_context,
        think_mode=bool(getattr(req, "think_mode", False))
    )

    assistant_msg = await crud.create_chat_message(
        session_id=str(session.id),
        role="assistant",
        content=bot_result["content"],
        action_type=bot_result.get("action_type", "none"),
        action_payload=bot_result.get("action_payload"),
        action_status=bot_result.get("action_status", "none")
    )

    return {
        "session": {
            "id": str(session.id),
            "user_id": session.user_id,
            "title": session.title,
            "created_at": session.created_at.isoformat() if session.created_at else "",
            "updated_at": session.updated_at.isoformat() if session.updated_at else "",
            "message_count": 2,
            "last_message_preview": bot_result["content"][:60]
        },
        "user_message": {
            "id": user_msg.id,
            "session_id": str(session.id),
            "role": user_msg.role,
            "content": user_msg.content,
            "action_type": user_msg.action_type,
            "action_payload": user_msg.action_payload,
            "action_status": user_msg.action_status,
            "created_at": user_msg.created_at.isoformat() if user_msg.created_at else ""
        },
        "assistant_message": {
            "id": assistant_msg.id,
            "session_id": str(session.id),
            "role": assistant_msg.role,
            "content": assistant_msg.content,
            "action_type": assistant_msg.action_type,
            "action_payload": assistant_msg.action_payload,
            "action_status": assistant_msg.action_status,
            "created_at": assistant_msg.created_at.isoformat() if assistant_msg.created_at else ""
        }
    }


@router.post("/message/{session_id}")
async def send_chat_message(
    session_id: str,
    req: schemas.ChatPromptRequest
):
    """
    Process a user message in an existing session with ownership verification in MongoDB.
    """
    session = await crud.get_chat_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    user = await crud.get_user(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    u_id_str = str(user.id)
    if session.user_id != u_id_str:
        raise HTTPException(status_code=403, detail="Unauthorized: Chat session belongs to another user")

    user_msg = await crud.create_chat_message(
        session_id=session_id,
        role="user",
        content=req.prompt,
        action_type="none",
        action_payload=None,
        action_status="none"
    )

    user_info = {
        "id": u_id_str,
        "username": user.username,
        "role": user.role,
        "age": user.age,
        "retirement_goal_age": user.retirement_goal_age,
        "target_net_worth": user.target_net_worth,
        "monthly_income": user.monthly_income,
        "monthly_expenses": user.monthly_expenses,
        "net_worth": user.net_worth,
        "sleep_target_hours": user.sleep_target_hours,
        "study_target_hours_week": user.study_target_hours_week,
    }

    # Fetch history
    history_payload = [
        {"role": m.role, "content": m.content}
        for m in session.messages[:-1]
    ]

    telemetry = await build_user_telemetry_bundle(user)

    bot_result = process_twin_copilot_turn(
        user_id=u_id_str,
        prompt=req.prompt,
        history=history_payload,
        user_info=user_info,
        baseline=telemetry["baseline"],
        telemetry=telemetry,
        client_context=req.client_context,
        think_mode=bool(getattr(req, "think_mode", False))
    )

    assistant_msg = await crud.create_chat_message(
        session_id=session_id,
        role="assistant",
        content=bot_result["content"],
        action_type=bot_result.get("action_type", "none"),
        action_payload=bot_result.get("action_payload"),
        action_status=bot_result.get("action_status", "none")
    )

    if session.title in ["New Conversation", "Twin Core Dialogue", "Untitled Conversation"]:
        session.title = generate_chat_title_summary(req.prompt)
        await session.save()

    return {
        "user_message": {
            "id": user_msg.id,
            "session_id": session_id,
            "role": user_msg.role,
            "content": user_msg.content,
            "action_type": user_msg.action_type,
            "action_payload": user_msg.action_payload,
            "action_status": user_msg.action_status,
            "created_at": user_msg.created_at.isoformat() if user_msg.created_at else ""
        },
        "assistant_message": {
            "id": assistant_msg.id,
            "session_id": session_id,
            "role": assistant_msg.role,
            "content": assistant_msg.content,
            "action_type": assistant_msg.action_type,
            "action_payload": assistant_msg.action_payload,
            "action_status": assistant_msg.action_status,
            "created_at": assistant_msg.created_at.isoformat() if assistant_msg.created_at else ""
        }
    }


@router.post("/action/execute/{message_id}")
async def execute_chat_action(
    message_id: str,
    req: schemas.ChatActionExecuteRequest
):
    """
    Approve and execute a proposed action from chat with user ownership verification in MongoDB.
    """
    user = await crud.get_user(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    action_type = req.action_type
    payload = req.action_payload

    execution_result = await execute_action_payload(user, action_type, payload)
    updated_msg = await crud.update_chat_message_status(message_id, "executed", user_id=user.id)

    if not updated_msg:
        raise HTTPException(status_code=404, detail="Message not found")

    return {
        "status": "success",
        "message_id": message_id,
        "action_type": action_type,
        "action_status": "executed",
        "result": execution_result
    }


@router.post("/action/reject/{message_id}")
async def reject_chat_action(
    message_id: str,
    req: schemas.ChatActionRejectRequest
):
    """Dismiss a proposed action from chat with ownership verification in MongoDB."""
    user = await crud.get_user(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated_msg = await crud.update_chat_message_status(message_id, "rejected", user_id=user.id)
    if not updated_msg:
        raise HTTPException(status_code=404, detail="Message not found")

    return {"status": "rejected", "message_id": message_id}
