import json
import re
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
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


async def build_user_telemetry_bundle(
    user: models.UserDoc,
    client_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
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
    study_hours_week = round((study_mins / 60.0) * (7.0 / max(1, len(recent_habits) or 1)), 1) if recent_studies else float(baseline.get("study_hours_week", 0.0))

    study_prof = await crud.get_user_study_profile(u_id_str)
    onboarded_subjects = study_prof.get("subjects", [])
    subjects = list({s.subject for s in recent_studies if s.subject}) or onboarded_subjects
    upcoming_exams = study_prof.get("exams", [])

    monthly_savings = max(0.0, float(user.monthly_income or 0.0) - float(user.monthly_expenses or 0.0))
    savings_rate = round((monthly_savings / float(user.monthly_income)) * 100) if user.monthly_income and user.monthly_income > 0 else 0

    c_ctx = client_context or {}
    now_utc = datetime.utcnow()
    local_time = c_ctx.get("localTime") or now_utc.strftime("%I:%M %p")
    local_date = c_ctx.get("localDate") or now_utc.strftime("%A, %B %d, %Y")
    time_zone = c_ctx.get("timeZone") or "UTC"
    location = c_ctx.get("location") or time_zone.replace("_", " ")
    day_of_week = c_ctx.get("dayOfWeek") or now_utc.strftime("%A")

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
        "onboarded_subjects": onboarded_subjects,
        "upcoming_exams": upcoming_exams,
        "monthly_income": float(user.monthly_income or 0.0),
        "monthly_expenses": float(user.monthly_expenses or 0.0),
        "monthly_savings": monthly_savings,
        "savings_rate": savings_rate,
        "net_worth": float(user.net_worth or 0.0),
        "target_net_worth": float(user.target_net_worth or 1000000.0),
        "target_retirement_age": int(user.retirement_goal_age or 60),
        "active_adopted_tasks": len([s for s in user_suggestions if s.is_adopted == 1]),
        "local_time": local_time,
        "local_date": local_date,
        "time_zone": time_zone,
        "location": location,
        "day_of_week": day_of_week,
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
        await crud.ensure_user_tutorial_session(u_id_str)
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
        content="New conversation thread started. What life decision or schedule adjustment would you like to simulate?",
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
        last_message_preview="New conversation thread started."
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


async def _maybe_auto_execute_chat_action(
    user: models.UserDoc,
    bot_result: Dict[str, Any],
    prompt: str = ""
) -> Tuple[Dict[str, Any], models.UserDoc]:
    """
    Evaluates autonomy mode and explicit confirmation directives to decide whether
    to auto-execute actions or present an interactive approval card in chat.
    """
    autonomy_mode = user.autonomy_mode or "semi_autonomous"
    act_type = bot_result.get("action_type", "none")
    act_status = bot_result.get("action_status", "none")
    act_payload_str = bot_result.get("action_payload")

    p_lower = prompt.lower().strip()
    is_explicit_confirmation = any(k in p_lower for k in [
        "yes confirm", "yes apply", "yes plug it in", "plug it into planner",
        "confirm plan", "apply plan", "approve plan", "confirm changes",
        "approve changes", "approve", "confirm", "plug it in", "add them",
        "add it", "1,2,3 add it", "1, 2, 3 add it", "commit to planner", "yes add them", "yes add all"
    ])

    should_auto_execute = False
    if act_type != "none" and act_payload_str:
        if act_status == "auto_execute":
            # Multi-agent direct mutations — always execute immediately
            should_auto_execute = True
        elif act_status == "proposed":
            if autonomy_mode == "full_autonomous":
                should_auto_execute = True
            elif is_explicit_confirmation:
                should_auto_execute = True

    if should_auto_execute:
        try:
            payload_dict = json.loads(act_payload_str)
            await execute_action_payload(user, act_type, payload_dict)
            bot_result["action_status"] = "executed"
            refreshed_user = await crud.get_user(str(user.id))
            if refreshed_user:
                user = refreshed_user
        except Exception as e:
            print(f"[Autonomous Execution] Notice: {e}")

    return bot_result, user


@router.post("/message/create_thread")
async def create_chat_thread(req: schemas.ChatPromptRequest):
    """
    Creates a new conversational thread in MongoDB and processes the first turn.
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

    telemetry = await build_user_telemetry_bundle(user, client_context=req.client_context)

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

    bot_result, user = await _maybe_auto_execute_chat_action(user, bot_result, prompt=req.prompt)

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
    Gracefully auto-recovers if a session ID is stale or expired.
    """
    user = await crud.get_user(req.user_id)
    if not user:
        user = await crud.get_or_create_demo_user("professional")

    u_id_str = str(user.id)
    session = await crud.get_chat_session(session_id)
    if not session:
        # Auto-create fresh session if stale ID was requested
        session = await crud.create_chat_session(u_id_str, title=generate_chat_title_summary(req.prompt))
    elif session.user_id != u_id_str:
        # Re-assign or fork session for active user
        if session.user_id in ["default", "1", "default_twin", u_id_str]:
            session.user_id = u_id_str
            await session.save()
        else:
            session = await crud.create_chat_session(u_id_str, title=generate_chat_title_summary(req.prompt))

    current_session_id = str(session.id)
    user_msg = await crud.create_chat_message(
        session_id=current_session_id,
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
        for m in (session.messages[:-1] if session.messages else [])
    ]

    telemetry = await build_user_telemetry_bundle(user, client_context=req.client_context)

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

    bot_result, user = await _maybe_auto_execute_chat_action(user, bot_result, prompt=req.prompt)

    assistant_msg = await crud.create_chat_message(
        session_id=current_session_id,
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
            "id": user_msg.id if user_msg else "msg_user",
            "session_id": current_session_id,
            "role": user_msg.role if user_msg else "user",
            "content": user_msg.content if user_msg else req.prompt,
            "action_type": user_msg.action_type if user_msg else "none",
            "action_payload": user_msg.action_payload if user_msg else None,
            "action_status": user_msg.action_status if user_msg else "none",
            "created_at": user_msg.created_at.isoformat() if user_msg and user_msg.created_at else ""
        },
        "assistant_message": {
            "id": assistant_msg.id if assistant_msg else "msg_asst",
            "session_id": current_session_id,
            "role": assistant_msg.role if assistant_msg else "assistant",
            "content": assistant_msg.content if assistant_msg else bot_result["content"],
            "action_type": assistant_msg.action_type if assistant_msg else "none",
            "action_payload": assistant_msg.action_payload if assistant_msg else None,
            "action_status": assistant_msg.action_status if assistant_msg else "none",
            "created_at": assistant_msg.created_at.isoformat() if assistant_msg and assistant_msg.created_at else ""
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


@router.post("/gemini-live")
async def gemini_live_voice_turn(req: Dict[str, Any]):
    """
    Low-latency conversational voice study assistant turn (Gemini Live Mode).
    Optimized for continuous speech synthesis with short, crisp 1-3 sentence answers.
    """
    user_id = str(req.get("user_id") or "1")
    prompt = (req.get("prompt") or "").strip()
    subject = (req.get("subject") or "General Study").strip()
    active_task = req.get("active_task")
    history = req.get("history") or []

    if not prompt:
        return {"text": "I'm listening. Ask me any study question, formula, or concept.", "prompt": "", "timestamp": datetime.utcnow().isoformat()}

    user = await crud.get_user(user_id)
    username = user.username if user and user.username else "Student"
    role = getattr(user, "role", "student") or "student"

    system_prompt = f"""You are Gemini Live, an instant real-time conversational voice study assistant and personal AI tutor for {username} (Role: {role}).
Active Subject Context: {subject}
{f"Active Task: {active_task}" if active_task else ""}

CRITICAL VOICE INSTRUCTIONS:
1. Provide extremely concise, punchy, high-impact study answers (1 to 3 short sentences maximum).
2. Answer immediately without conversational filler, preamble, or fluff like 'Sure!', 'Certainly!', or 'Here is your answer:'.
3. Write for natural speech synthesis audio: use clean, spoken English without markdown tables, asterisks, bullet points, or complex code blocks.
4. If asked for a formula, definition, or concept, explain it instantly with zero delay.
5. If asked to quiz the user, state 1 sharp active recall question clearly."""

    messages_payload = [{"role": "system", "content": system_prompt}]

    # Include last 4 turns of history for dialogue continuity
    for h in history[-4:]:
        r = h.get("role")
        c = h.get("content") or h.get("text")
        if r in ["user", "assistant"] and c:
            messages_payload.append({"role": r, "content": c})

    messages_payload.append({"role": "user", "content": prompt})

    try:
        from ai_engine.llm_integration.client import get_groq_client, get_active_groq_models
        client = get_groq_client()
        if client:
            models_to_try = get_active_groq_models(client)
            for m in models_to_try:
                try:
                    resp = client.chat.completions.create(
                        model=m,
                        messages=messages_payload,
                        temperature=0.5,
                        max_tokens=220,
                        timeout=8.0
                    )
                    content = resp.choices[0].message.content.strip()
                    # Clean any <think> tags if present
                    clean_content = re.sub(r"<think>[\s\S]*?</think>", "", content).strip()
                    # Clean asterisks for smooth TTS
                    clean_content = clean_content.replace("**", "").replace("*", "").replace("###", "").replace("##", "")
                    if clean_content:
                        return {
                            "text": clean_content,
                            "prompt": prompt,
                            "timestamp": datetime.utcnow().isoformat()
                        }
                except Exception as inner_err:
                    continue
    except Exception as e:
        print(f"[GeminiLive] LLM error: {e}")

    # Fallback response
    p_low = prompt.lower()
    if "quiz" in p_low:
        fallback = f"Here is your active recall question for {subject}: What is the primary governing principle and core formula behind this concept?"
    elif "formula" in p_low:
        fallback = f"For {subject}, focus on foundational relationships: inputs directly scale output velocity under equilibrium constraints."
    elif "mnemonic" in p_low:
        fallback = "A great memory anchor is to link the first letters into a vivid visual story in your mind."
    else:
        fallback = f"Focus on the core definition in {subject}: break the concept down to first principles, verify the key assumption, and apply it directly to your current problem."

    return {
        "text": fallback,
        "prompt": prompt,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/jarvis")
async def jarvis_voice_assistant(req: Dict[str, Any]):
    """
    JARVIS Autonomous Voice Copilot endpoint.
    Handles natural voice commands, screen/window action parsing, and ultra-crisp voice synthesis responses.
    """
    user_id = str(req.get("user_id") or "1")
    prompt = (req.get("prompt") or "").strip()
    subject = (req.get("subject") or "Study").strip()
    history = req.get("history") or []

    if not prompt:
        return {
            "text": "Jarvis online. Standing by for your command, sir.",
            "action": None,
            "prompt": "",
            "timestamp": datetime.utcnow().isoformat()
        }

    p_low = prompt.lower()
    user = await crud.get_user(user_id)
    username = user.username if user and user.username else "Sir"

    # 1. Action Pattern Matching
    # Take note / idea
    if any(k in p_low for k in ["take a note", "note down", "write a note", "save an idea", "save idea", "add a note", "remember this", "make a note"]):
        cleaned = re.sub(r"^(jarvis\s*,?\s*|hey jarvis\s*,?\s*|please\s*)", "", prompt, flags=re.IGNORECASE)
        cleaned = re.sub(r"^(take a note\s*(that|about|:|to)?|note down\s*(that|about|:|to)?|write a note\s*(that|about|:|to)?|save an idea\s*(that|about|:|to)?|save idea\s*(that|about|:|to)?|add a note\s*(that|about|:|to)?|remember this\s*(that|about|:|to)?|make a note\s*(that|about|:|to)?)\s*", "", cleaned, flags=re.IGNORECASE).strip()
        
        note_content = cleaned if cleaned else prompt
        words = note_content.split()
        note_title = " ".join(words[:4]).capitalize() if len(words) >= 4 else note_content.capitalize()

        created_note = None
        if user:
            try:
                created_note = await crud.save_user_note(user.id, {
                    "title": note_title,
                    "content": note_content,
                    "category": "ideas",
                    "tags": ["jarvis", subject.lower()]
                })
            except Exception as e:
                print(f"[Jarvis] Auto-note save error: {e}")

        return {
            "text": f"Noted, {username}. I have recorded that into your notes.",
            "action": {
                "type": "create_note",
                "payload": {
                    "id": str(created_note.id) if created_note else str(uuid.uuid4()),
                    "title": note_title,
                    "content": note_content,
                    "category": "ideas"
                }
            },
            "prompt": prompt,
            "timestamp": datetime.utcnow().isoformat()
        }

    # Window Actions
    if "open youtube" in p_low or "play youtube" in p_low or "start youtube" in p_low:
        return {"text": f"Opening YouTube focus player, {username}.", "action": {"type": "open_youtube"}, "prompt": prompt, "timestamp": datetime.utcnow().isoformat()}
    if "close youtube" in p_low or "hide youtube" in p_low:
        return {"text": f"YouTube player dismissed.", "action": {"type": "close_youtube"}, "prompt": prompt, "timestamp": datetime.utcnow().isoformat()}

    if "open spotify" in p_low or "play spotify" in p_low or "start spotify" in p_low:
        return {"text": f"Launching Spotify music player.", "action": {"type": "open_spotify"}, "prompt": prompt, "timestamp": datetime.utcnow().isoformat()}
    if "close spotify" in p_low or "hide spotify" in p_low:
        return {"text": f"Spotify player closed.", "action": {"type": "close_spotify"}, "prompt": prompt, "timestamp": datetime.utcnow().isoformat()}

    if "open browser" in p_low or "launch browser" in p_low or "show browser" in p_low:
        return {"text": f"Opening in-cockpit web browser.", "action": {"type": "open_browser"}, "prompt": prompt, "timestamp": datetime.utcnow().isoformat()}
    if "close browser" in p_low or "hide browser" in p_low:
        return {"text": f"Closing web browser.", "action": {"type": "close_browser"}, "prompt": prompt, "timestamp": datetime.utcnow().isoformat()}

    if "open note" in p_low or "show note" in p_low or "open my notes" in p_low:
        return {"text": f"Opening your notes and ideas board.", "action": {"type": "open_notes"}, "prompt": prompt, "timestamp": datetime.utcnow().isoformat()}
    if "close note" in p_low or "hide note" in p_low:
        return {"text": f"Notes board closed.", "action": {"type": "close_notes"}, "prompt": prompt, "timestamp": datetime.utcnow().isoformat()}

    if "open workspace" in p_low or "show tasks" in p_low or "open planner" in p_low or "show planner" in p_low:
        return {"text": f"Opening your workspace and planner.", "action": {"type": "open_workspace"}, "prompt": prompt, "timestamp": datetime.utcnow().isoformat()}
    if "close workspace" in p_low or "hide workspace" in p_low:
        return {"text": f"Workspace minimized.", "action": {"type": "close_workspace"}, "prompt": prompt, "timestamp": datetime.utcnow().isoformat()}

    if "start timer" in p_low or "play timer" in p_low or "resume timer" in p_low:
        return {"text": f"Starting your focus sprint timer now.", "action": {"type": "start_timer"}, "prompt": prompt, "timestamp": datetime.utcnow().isoformat()}
    if "pause timer" in p_low or "stop timer" in p_low:
        return {"text": f"Timer paused.", "action": {"type": "pause_timer"}, "prompt": prompt, "timestamp": datetime.utcnow().isoformat()}
    if "reset timer" in p_low:
        return {"text": f"Timer reset to beginning.", "action": {"type": "reset_timer"}, "prompt": prompt, "timestamp": datetime.utcnow().isoformat()}

    # LLM Query for complex requests or academic knowledge
    system_prompt = f"""You are J.A.R.V.I.S., the ultra-intelligent, highly capable AI assistant and cockpit copilot for {username}.
Subject in focus: {subject}.
CRITICAL INSTRUCTIONS:
1. Speak in a crisp, polite, refined British tone (e.g. 'Right away, sir', 'Certainly', 'At your service').
2. Keep spoken responses to 1 to 2 concise sentences.
3. Use plain English without markdown asterisks, hashes, or bullet points so it sounds natural when spoken.
4. Answer scientific, academic, and technical queries with sharp first-principles precision."""

    messages_payload = [{"role": "system", "content": system_prompt}]
    for h in history[-3:]:
        r = h.get("role")
        c = h.get("content") or h.get("text")
        if r in ["user", "assistant"] and c:
            messages_payload.append({"role": r, "content": c})
    messages_payload.append({"role": "user", "content": prompt})

    try:
        from ai_engine.llm_integration.client import get_groq_client, get_active_groq_models
        client = get_groq_client()
        if client:
            models_to_try = get_active_groq_models(client)
            for m in models_to_try:
                try:
                    resp = client.chat.completions.create(
                        model=m,
                        messages=messages_payload,
                        temperature=0.4,
                        max_tokens=180,
                        timeout=7.0
                    )
                    content = resp.choices[0].message.content.strip()
                    clean_content = re.sub(r"<think>[\s\S]*?</think>", "", content).strip()
                    clean_content = clean_content.replace("**", "").replace("*", "").replace("###", "").replace("##", "")
                    if clean_content:
                        return {
                            "text": clean_content,
                            "action": None,
                            "prompt": prompt,
                            "timestamp": datetime.utcnow().isoformat()
                        }
                except Exception:
                    continue
    except Exception as e:
        print(f"[Jarvis] LLM error: {e}")

    # Fallback JARVIS response
    return {
        "text": f"Right away, {username}. I'm standing by to manage your study windows, notes, and timers.",
        "action": None,
        "prompt": prompt,
        "timestamp": datetime.utcnow().isoformat()
    }

