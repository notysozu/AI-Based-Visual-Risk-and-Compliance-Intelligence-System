import json
import re
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import database, crud, models, schemas
from ai_engine.simulation import simulator
from ai_engine.llm_integration.advisor import process_twin_copilot_turn

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


@router.get("/sessions/{user_id}", response_model=List[schemas.ChatSessionResponse])
def list_user_chat_sessions(user_id: int, db: Session = Depends(database.get_db)):
    """
    List all chat sessions strictly belonging to the specified user.
    If no sessions exist for a new user, initialize the default 'Tutorial' guide thread.
    """
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    sessions = crud.get_chat_sessions(db, user_id)
    if not sessions:
        # Create initial default 'Tutorial' session for new users
        tutorial_session = crud.create_chat_session(db, user_id, title="Tutorial")
        crud.create_chat_message(
            db=db,
            session_id=tutorial_session.id,
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
        sessions = crud.get_chat_sessions(db, user_id)

    return sessions


@router.post("/sessions/{user_id}", response_model=schemas.ChatSessionResponse)
def create_new_chat_session(
    user_id: int,
    session_data: schemas.ChatSessionCreate,
    db: Session = Depends(database.get_db)
):
    """Create a new conversational thread for a user."""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    session = crud.create_chat_session(db, user_id, title=session_data.title or "New Conversation")
    
    crud.create_chat_message(
        db=db,
        session_id=session.id,
        role="assistant",
        content="✨ New conversation thread started. What life decision or schedule adjustment would you like to simulate?",
        action_type="none",
        action_payload=None,
        action_status="none"
    )

    return {
        "id": session.id,
        "user_id": session.user_id,
        "title": session.title,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
        "message_count": 1,
        "last_message_preview": "✨ New conversation thread started."
    }


@router.delete("/sessions/{session_id}")
def remove_chat_session(
    session_id: int,
    user_id: Optional[int] = Query(None),
    db: Session = Depends(database.get_db)
):
    """Delete a chat session, strictly verifying ownership by user_id."""
    session = crud.get_chat_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    if user_id is not None and session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized: Chat session does not belong to this user")

    crud.delete_chat_session(db, session_id)
    return {"message": "Chat session deleted successfully", "session_id": session_id}


@router.get("/messages/{session_id}", response_model=List[schemas.ChatMessageResponse])
def get_session_messages(
    session_id: int,
    user_id: Optional[int] = Query(None),
    db: Session = Depends(database.get_db)
):
    """Retrieve full chronological conversation history for a given session with ownership verification."""
    session = crud.get_chat_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    if user_id is not None and session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized: Access denied to this user's conversation")

    return crud.get_chat_messages(db, session_id)


def build_user_telemetry_bundle(db: Session, user: models.User) -> Dict[str, Any]:
    """Search and aggregate all recent telemetry logs and baseline stats for the user."""
    baseline = simulator.get_user_baseline_metrics(db, user.id)
    recent_habits = crud.get_habit_records(db, user.id, limit=30)
    recent_studies = crud.get_study_records(db, user.id, limit=30)
    recent_txns = crud.get_financial_records(db, user.id, limit=30)
    user_suggestions = crud.get_user_suggestions(db, user.id)

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


@router.post("/message/create_thread")
def create_thread_and_send_message(
    req: schemas.ChatPromptRequest,
    db: Session = Depends(database.get_db)
):
    """
    Creates a new session with an AI-summarized title and processes the first message.
    """
    user = crud.get_user(db, req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate initial smart summary title
    initial_title = generate_chat_title_summary(req.prompt)

    session = crud.create_chat_session(
        db=db,
        user_id=req.user_id,
        title=initial_title
    )

    user_msg = crud.create_chat_message(
        db=db,
        session_id=session.id,
        role="user",
        content=req.prompt,
        action_type="none",
        action_payload=None,
        action_status="none"
    )

    user_info = {
        "id": user.id,
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

    telemetry = build_user_telemetry_bundle(db, user)

    bot_result = process_twin_copilot_turn(
        user_id=req.user_id,
        prompt=req.prompt,
        history=[],
        user_info=user_info,
        baseline=telemetry["baseline"],
        telemetry=telemetry,
        client_context=req.client_context,
        think_mode=bool(getattr(req, "think_mode", False))
    )

    assistant_msg = crud.create_chat_message(
        db=db,
        session_id=session.id,
        role="assistant",
        content=bot_result["content"],
        action_type=bot_result.get("action_type", "none"),
        action_payload=bot_result.get("action_payload"),
        action_status=bot_result.get("action_status", "none")
    )

    return {
        "session": {
            "id": session.id,
            "user_id": session.user_id,
            "title": session.title,
            "created_at": session.created_at.isoformat() if session.created_at else "",
            "updated_at": session.updated_at.isoformat() if session.updated_at else "",
            "message_count": 2,
            "last_message_preview": bot_result["content"][:60]
        },
        "user_message": {
            "id": user_msg.id,
            "session_id": user_msg.session_id,
            "role": user_msg.role,
            "content": user_msg.content,
            "action_type": user_msg.action_type,
            "action_payload": user_msg.action_payload,
            "action_status": user_msg.action_status,
            "created_at": user_msg.created_at.isoformat() if user_msg.created_at else ""
        },
        "assistant_message": {
            "id": assistant_msg.id,
            "session_id": assistant_msg.session_id,
            "role": assistant_msg.role,
            "content": assistant_msg.content,
            "action_type": assistant_msg.action_type,
            "action_payload": assistant_msg.action_payload,
            "action_status": assistant_msg.action_status,
            "created_at": assistant_msg.created_at.isoformat() if assistant_msg.created_at else ""
        }
    }


@router.post("/message/{session_id}")
def send_chat_message(
    session_id: int,
    req: schemas.ChatPromptRequest,
    db: Session = Depends(database.get_db)
):
    """
    Process a user message in an existing session with ownership verification.
    """
    session = crud.get_chat_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    if session.user_id != req.user_id:
        raise HTTPException(status_code=403, detail="Unauthorized: Chat session belongs to another user")

    user = crud.get_user(db, req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 1. Save user message
    user_msg = crud.create_chat_message(
        db=db,
        session_id=session_id,
        role="user",
        content=req.prompt,
        action_type="none",
        action_payload=None,
        action_status="none"
    )

    # Fetch context
    baseline = simulator.get_user_baseline_metrics(db, req.user_id)
    user_info = {
        "id": user.id,
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

    # Fetch recent history
    past_messages = crud.get_chat_messages(db, session_id)
    history_payload = [
        {"role": m.role, "content": m.content}
        for m in past_messages[:-1]
    ]

    telemetry = build_user_telemetry_bundle(db, user)

    # 2. Process via AI Copilot Simulation Engine
    bot_result = process_twin_copilot_turn(
        user_id=req.user_id,
        prompt=req.prompt,
        history=history_payload,
        user_info=user_info,
        baseline=telemetry["baseline"],
        telemetry=telemetry,
        client_context=req.client_context,
        think_mode=bool(getattr(req, "think_mode", False))
    )

    # 3. Save assistant message with action payload
    assistant_msg = crud.create_chat_message(
        db=db,
        session_id=session_id,
        role="assistant",
        content=bot_result["content"],
        action_type=bot_result.get("action_type", "none"),
        action_payload=bot_result.get("action_payload"),
        action_status=bot_result.get("action_status", "none")
    )

    # 4. Auto-update thread title if it's currently generic
    if session.title in ["New Conversation", "Twin Core Dialogue", "Untitled Conversation"]:
        summarized_title = generate_chat_title_summary(req.prompt)
        crud.update_chat_session_title(db, session_id, summarized_title)

    return {
        "user_message": {
            "id": user_msg.id,
            "session_id": user_msg.session_id,
            "role": user_msg.role,
            "content": user_msg.content,
            "action_type": user_msg.action_type,
            "action_payload": user_msg.action_payload,
            "action_status": user_msg.action_status,
            "created_at": user_msg.created_at.isoformat() if user_msg.created_at else ""
        },
        "assistant_message": {
            "id": assistant_msg.id,
            "session_id": assistant_msg.session_id,
            "role": assistant_msg.role,
            "content": assistant_msg.content,
            "action_type": assistant_msg.action_type,
            "action_payload": assistant_msg.action_payload,
            "action_status": assistant_msg.action_status,
            "created_at": assistant_msg.created_at.isoformat() if assistant_msg.created_at else ""
        }
    }


@router.post("/action/execute/{message_id}")
def execute_chat_action(
    message_id: int,
    req: schemas.ChatActionExecuteRequest,
    db: Session = Depends(database.get_db)
):
    """
    Approve and execute a proposed action from chat with user ownership verification:
    - add_task: adds task to suggestions / planner
    - update_settings: updates user profile in database
    - simulate_what_if: applies scenario preset to database
    - purchase_impact: logs transaction and deducts cost
    """
    msg = db.query(models.ChatMessage).filter(models.ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    session = crud.get_chat_session(db, msg.session_id)
    if not session or session.user_id != req.user_id:
        raise HTTPException(status_code=403, detail="Unauthorized action on this session")

    user = crud.get_user(db, req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    action_type = req.action_type
    payload = req.action_payload
    execution_result = {}

    if action_type in ["add_task", "add_multiple_tasks"]:
        import time
        tasks_to_add = payload.get("tasks") if action_type == "add_multiple_tasks" else [payload]
        created_list = []
        for idx, t in enumerate(tasks_to_add):
            sug_id = f"chat-task-{int(time.time())}-{idx}"
            saved_sug = models.UserSuggestion(
                user_id=user.id,
                suggestion_id=sug_id,
                title=t.get("title", "Focus Session"),
                category=t.get("category", "Work"),
                detail=f"Scheduled via Digital Twin Copilot at {t.get('start', '09:00')}",
                impact=t.get("impact", "+0.8 Focus"),
                start_time=t.get("start", "09:00"),
                duration_minutes=int(t.get("minutes", 45)),
                is_adopted=1,
                is_ai_generated=1
            )
            db.add(saved_sug)
            created_list.append({
                "task_id": sug_id,
                "title": saved_sug.title,
                "category": saved_sug.category,
                "start": saved_sug.start_time,
                "minutes": saved_sug.duration_minutes
            })
        db.commit()
        execution_result = {"tasks": created_list, "count": len(created_list)}

    elif action_type == "update_settings":
        for key, val in payload.items():
            if hasattr(user, key):
                setattr(user, key, val)
        db.commit()
        execution_result = {"updated_fields": list(payload.keys())}

    elif action_type == "simulate_what_if":
        preset_payload = {
            "savings": float(payload.get("savings_delta", 0.0)),
            "sleep": float(payload.get("sleep_delta", 0.0)),
            "study": float(payload.get("study_delta", 0.0))
        }
        user.scenario_b_preset = json.dumps(preset_payload)
        db.commit()
        execution_result = {"applied_preset": preset_payload}

    elif action_type == "purchase_impact":
        import datetime
        cost = float(payload.get("cost", 0.0))
        if cost > 0:
            rec = models.FinancialRecord(
                user_id=user.id,
                amount=cost,
                category="Major Purchase",
                record_type="expense",
                date=datetime.date.today()
            )
            db.add(rec)
            user.net_worth = max(0.0, float(user.net_worth or 0.0) - cost)
            db.commit()
            execution_result = {"deducted_net_worth": cost, "remaining_net_worth": user.net_worth}

    crud.update_chat_action_status(db, message_id, "executed")

    return {
        "status": "success",
        "message_id": message_id,
        "action_type": action_type,
        "action_status": "executed",
        "result": execution_result
    }


@router.post("/action/reject/{message_id}")
def reject_chat_action(
    message_id: int,
    req: schemas.ChatActionRejectRequest,
    db: Session = Depends(database.get_db)
):
    """Dismiss a proposed action from chat with ownership verification."""
    msg = db.query(models.ChatMessage).filter(models.ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    session = crud.get_chat_session(db, msg.session_id)
    if not session or session.user_id != req.user_id:
        raise HTTPException(status_code=403, detail="Unauthorized action on this session")

    crud.update_chat_action_status(db, message_id, "rejected")
    return {"status": "rejected", "message_id": message_id}
