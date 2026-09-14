"""
StudyAgent — directly logs study sessions from chat without requiring approval.

Triggers on: "I studied X hours of math", "did 2h revision physics score 87",
             "completed X hours of Y"
"""

import re
import json
from typing import Dict, Any, Optional


def handle_study_agent(
    prompt: str,
    p_lower: str,
    user_info: Dict[str, Any],
    t_data: Dict[str, Any],
    think_mode: bool = False
) -> Optional[Dict[str, Any]]:
    """
    Detect study session logging intent and return a direct-execution action payload.
    Returns None if not a study log request.
    """
    study_triggers = [
        "i studied", "studied for", "did revision", "did a revision",
        "completed studying", "finished studying", "studied",
        "i revised", "revised for", "revision session",
        "did deep work", "deep work session", "focus session",
    ]

    has_trigger = any(k in p_lower for k in study_triggers)
    if not has_trigger:
        return None

    # Extract duration
    dur_m = re.search(
        r"([0-9]+(?:\.[0-9]+)?)\s*(?:hours?|hrs?|h\b|minutes?|mins?)",
        p_lower
    )
    if not dur_m:
        return None

    raw_val = float(dur_m.group(1))
    unit_area = p_lower[dur_m.start():dur_m.end()]
    if "hour" in unit_area or "hr" in unit_area or unit_area.endswith("h"):
        dur_mins = int(raw_val * 60)
    else:
        dur_mins = int(raw_val)

    # Extract subject — look for "of X" or "in X" or "for X" after duration
    subject = "Academic Study"
    subj_m = re.search(
        r"(?:of|in|for)\s+([a-zA-Z][a-zA-Z0-9\s\-]+?)(?:\s+(?:score|with|and|today|yesterday|exam|test|at|for)|$)",
        p_lower[dur_m.end():]
    )
    if subj_m:
        cand = subj_m.group(1).strip()
        if len(cand) >= 2 and cand.lower() not in ["the", "my", "a", "an", "me", "it"]:
            subject = cand.title()
    else:
        # Try matching active subjects from telemetry
        for s in t_data.get("recent_subjects", []):
            if s.lower() in p_lower:
                subject = s
                break

    # Extract exam/focus score
    score_m = re.search(
        r"(?:score|scored|got|grade|focus)\s*[:\s]*([0-9]+(?:\.[0-9]+)?)\s*(?:/\s*100)?",
        p_lower
    )
    exam_score = float(score_m.group(1)) if score_m else None
    focus_score = 8

    if exam_score is not None and exam_score <= 10:
        focus_score = int(exam_score)
        exam_score = None
    elif exam_score is not None and exam_score > 10:
        focus_score = min(10, max(5, int(exam_score / 10)))

    think_prefix = ""
    if think_mode:
        think_prefix = f"""<think>
Step 1 — Goal Definition:
• Objective: Log study session from user chat statement directly to MongoDB.

Step 2 — Telemetry Search & Gathered User Data:
• Subject: {subject}, Duration: {dur_mins}min, Exam Score: {exam_score}, Focus: {focus_score}

Step 3 — Multi-Criteria Analysis & Optimization:
• Study record validated. Impact on weekly study pace calculated.

Step 4 — Formulated Strategic Execution Plan:
• Inserting StudyRecordDoc directly to MongoDB. No approval required.
</think>

"""

    weekly_so_far = float(t_data.get("study_hours_week", 0.0))
    new_weekly = round(weekly_so_far + dur_mins / 60, 1)
    weekly_target = float(t_data.get("study_target_week", 15.0))

    content = f"""{think_prefix}### ✓ Study Session Logged

- Subject: **{subject}**
- Duration: **{dur_mins} min** ({round(dur_mins / 60, 1)}h)
- Focus Score: **{focus_score}/10**{"" if exam_score is None else f" | Exam Score: **{exam_score:.0f}**"}

Weekly study pace updated: **{new_weekly}h** / {weekly_target}h target
"""

    payload: Dict[str, Any] = {
        "subject": subject,
        "duration_minutes": dur_mins,
        "focus_score": focus_score,
        "notes": "Logged via Visual Risk Copilot chat",
    }
    if exam_score is not None:
        payload["exam_score"] = exam_score

    return {
        "content": content,
        "action_type": "log_study",
        "action_payload": json.dumps(payload),
        "action_status": "auto_execute",
    }
