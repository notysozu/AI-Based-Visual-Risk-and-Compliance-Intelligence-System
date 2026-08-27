import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import database, crud, models, schemas
from ai_engine.simulation import simulator
from ai_engine.llm_integration.advisor import process_twin_copilot_turn
from typing import List

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/sessions/{user_id}", response_model=List[schemas.ChatSessionResponse])
def list_user_chat_sessions(user_id: int, db: Session = Depends(database.get_db)):
    """
    List all chat sessions for a user.
    If no sessions exist, automatically initialize a default session.
    """
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    sessions = crud.get_chat_sessions(db, user_id)
    if not sessions:
        # Create initial default session
        default_session = crud.create_chat_session(db, user_id, title="Twin Core Dialogue")
        # Add a welcoming assistant message
        crud.create_chat_message(
            db=db,
            session_id=default_session.id,
            role="assistant",
            content="👋 Hello! I am your **Digital Twin AI Copilot**. You can ask me anything about your finances, routines, and life projections.\n\n*Examples you can try:*\n- *\"If I buy a $1,200 laptop today, how does that affect my emergency fund goal?\"*\n- *\"What if I study 5 more hours a week and sleep 30 mins less?\"*\n- *\"Add a 45 min deep work sprint at 10:00 AM\"*\n- *\"Run Monte Carlo wealth projection\"*",
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
    
    # Welcome message in new thread
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
def remove_chat_session(session_id: int, db: Session = Depends(database.get_db)):
    """Delete a chat session and all associated messages."""
    success = crud.delete_chat_session(db, session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return {"message": "Chat session deleted successfully", "session_id": session_id}


@router.get("/messages/{session_id}", response_model=List[schemas.ChatMessageResponse])
def get_session_messages(session_id: int, db: Session = Depends(database.get_db)):
    """Retrieve full chronological conversation history for a given session."""
    session = crud.get_chat_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    return crud.get_chat_messages(db, session_id)


@router.post("/message/{session_id}")
def send_chat_message(
    session_id: int,
    req: schemas.ChatPromptRequest,
    db: Session = Depends(database.get_db)
):
    """
    Process a user message in a session:
    1. Persists user message to DB.
    2. Runs AI reasoning and simulation engines.
    3. Persists assistant reply & proposed interactive action card.
    4. Automatically generates a smart title for the session if it was default.
    """
    session = crud.get_chat_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

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

    # 2. Process via AI Copilot Simulation Engine
    bot_result = process_twin_copilot_turn(
        user_id=req.user_id,
        prompt=req.prompt,
        history=history_payload,
        user_info=user_info,
        baseline=baseline,
        client_context=req.client_context
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
        first_few_words = " ".join(req.prompt.strip().split()[:5])
        clean_title = first_few_words[:35].capitalize()
        crud.update_chat_session_title(db, session_id, clean_title)

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
    Approve and execute a proposed action from chat:
    - add_task: adds task to suggestions / planner
    - update_settings: updates user profile in database
    - simulate_what_if: applies scenario preset to database
    - purchase_impact: logs transaction and deducts cost
    """
    msg = db.query(models.ChatMessage).filter(models.ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    user = crud.get_user(db, req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    action_type = req.action_type
    payload = req.action_payload

    # Execute specific action
    execution_result = {}

    if action_type == "add_task":
        # Save as an adopted user suggestion in the planner
        import time
        sug_id = f"chat-task-{int(time.time())}"
        saved_sug = models.UserSuggestion(
            user_id=user.id,
            suggestion_id=sug_id,
            title=payload.get("title", "Focus Session"),
            category=payload.get("category", "Focus"),
            detail=f"Added via Digital Twin Copilot at {payload.get('start', '09:00')}",
            impact=payload.get("impact", "+1.0 focus"),
            start_time=payload.get("start", "09:00"),
            duration_minutes=int(payload.get("minutes", 45)),
            is_adopted=1,
            is_ai_generated=1
        )
        db.add(saved_sug)
        db.commit()
        execution_result = {
            "task_id": sug_id,
            "title": saved_sug.title,
            "category": saved_sug.category,
            "start": saved_sug.start_time,
            "minutes": saved_sug.duration_minutes
        }

    elif action_type == "update_settings":
        # Update user profile settings
        for key, val in payload.items():
            if hasattr(user, key):
                setattr(user, key, val)
        db.commit()
        db.refresh(user)
        execution_result = {"updated_fields": list(payload.keys())}

    elif action_type == "simulate_what_if":
        # Save scenario preset to Scenario B
        preset_data = {
            "savings": payload.get("savings_delta", 0),
            "sleep": payload.get("sleep_delta", 0),
            "study": payload.get("study_delta", 0)
        }
        user.scenario_b_preset = json.dumps(preset_data)
        db.commit()
        execution_result = {"applied_preset": preset_data}

    elif action_type == "purchase_impact":
        # Record expense transaction and update net worth
        cost = float(payload.get("cost", 0.0))
        item_name = payload.get("item_name", "Major Purchase")
        if cost > 0:
            txn = models.FinancialRecord(
                user_id=user.id,
                category="Discretionary Expense",
                description=f"Purchase: {item_name}",
                amount=cost
            )
            db.add(txn)
            user.net_worth = max(0.0, user.net_worth - cost)
            db.commit()
            db.refresh(user)
            execution_result = {"recorded_expense": cost, "new_net_worth": user.net_worth}

    # Mark message action as approved and executed
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
    """Mark a proposed action as rejected/dismissed by user."""
    msg = db.query(models.ChatMessage).filter(models.ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    crud.update_chat_action_status(db, message_id, "rejected")
    return {
        "status": "rejected",
        "message_id": message_id,
        "action_status": "rejected"
    }
