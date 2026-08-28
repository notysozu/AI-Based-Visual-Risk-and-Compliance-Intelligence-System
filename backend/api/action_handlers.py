import time
import json
import datetime
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from database import models


def execute_action_payload(db: Session, user: models.User, action_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Dispatches and executes validated interactive action proposals approved by the user.
    """
    execution_result: Dict[str, Any] = {}

    if action_type in ["add_task", "add_multiple_tasks"]:
        tasks_to_add = payload.get("tasks") if action_type == "add_multiple_tasks" else [payload]
        created_list = []
        for idx, t in enumerate(tasks_to_add):
            sug_id = f"chat-task-{int(time.time())}-{idx}"
            saved_sug = models.UserSuggestion(
                user_id=user.id,
                suggestion_id=sug_id,
                title=t.get("title", "Focus Session"),
                category=t.get("category", "Work"),
                detail=f"Scheduled via Visual Risk Copilot at {t.get('start', '09:00')}",
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

    elif action_type == "log_study":
        subject = payload.get("subject", "Academic Study")
        dur_mins = int(payload.get("duration_minutes", 60))
        focus_score = int(payload.get("focus_score", 8))
        exam_score = float(payload["exam_score"]) if payload.get("exam_score") is not None else None
        notes = payload.get("notes", "Logged via Visual Risk Copilot")

        study_rec = models.StudyRecord(
            user_id=user.id,
            subject=subject,
            duration_minutes=dur_mins,
            focus_score=focus_score,
            exam_score=exam_score,
            notes=notes,
            session_type="study"
        )
        db.add(study_rec)
        db.commit()
        execution_result = {
            "study_record_id": study_rec.id,
            "subject": subject,
            "duration_minutes": dur_mins,
            "focus_score": focus_score
        }

    elif action_type == "log_habit":
        h_name = payload.get("habit_name", "Sleep")
        dur_mins = int(payload.get("duration_minutes", 300))
        impact_score = int(payload.get("impact_score", 5))

        habit_rec = models.HabitRecord(
            user_id=user.id,
            habit_name=h_name,
            duration_minutes=dur_mins,
            impact_score=impact_score
        )
        db.add(habit_rec)
        db.commit()
        execution_result = {
            "habit_record_id": habit_rec.id,
            "habit_name": h_name,
            "duration_minutes": dur_mins,
            "impact_score": impact_score
        }

    return execution_result
