import re
import json
from typing import Dict, Any, Optional


def parse_time_to_24h(time_str: Optional[str]) -> str:
    """Normalizes 5pm, 5:30pm, 5 PM, 17:00 to HH:MM format."""
    if not time_str:
        return "09:00"
    time_str = time_str.strip().lower()

    # Match 12-hour format e.g., 5pm, 5:30pm, 05:30 pm
    m_12h = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)", time_str)
    if m_12h:
        hour = int(m_12h.group(1))
        minute = int(m_12h.group(2)) if m_12h.group(2) else 0
        meridiem = m_12h.group(3)
        if meridiem == "pm" and hour < 12:
            hour += 12
        elif meridiem == "am" and hour == 12:
            hour = 0
        return f"{hour:02d}:{minute:02d}"

    # Match 24-hour format e.g., 17:00, 09:30
    m_24h = re.search(r"(\d{1,2}):(\d{2})", time_str)
    if m_24h:
        hour = int(m_24h.group(1))
        minute = int(m_24h.group(2))
        return f"{hour:02d}:{minute:02d}"

    return "09:00"


def handle_single_task_intent(
    prompt: str,
    p_lower: str,
    user_info: Dict[str, Any],
    t_data: Dict[str, Any],
    think_mode: bool = False
) -> Optional[Dict[str, Any]]:
    """
    Parses explicit commands to add a single task to the user's planner/tasks.
    Examples:
    - 'add in my task and planner workout at 5pm for 45 min'
    - 'add to planner 30 min reading at 10am'
    - 'schedule a 90 min deep work sprint at 09:00'
    - 'add task: Finish budget analysis at 2pm'
    """
    single_add_triggers = [
        "add task", "add a task", "schedule a task", "schedule task", "create task",
        "create a task", "add habit", "schedule habit", "block time", "add deep work",
        "add study", "remind me to", "schedule a sprint", "focus sprint", "plan a sprint",
        "plan task", "add in my task", "add in my tasks", "add in my planner",
        "add in my plannar", "add to my task", "add to my tasks", "add to my planner",
        "add to my plannar", "add to task", "add to tasks", "add to planner", "add to plannar",
        "put in my task", "put in my tasks", "put in my planner", "put in my plannar",
        "put in planner", "put in task", "insert into planner", "schedule into planner",
        "add this task", "add a focus block", "schedule a focus block"
    ]

    has_trigger = any(trigger in p_lower for trigger in single_add_triggers)

    has_pattern = bool(re.search(
        r"\b(?:add|schedule|create|insert|put)\b.*\b(?:at\s+\d{1,2}|\d+\s*(?:min|minute|hour|hr)|\b(?:to|in|into)\s+(?:my\s+)?(?:task|plann(?:er|ar)|schedule))\b",
        p_lower
    ))

    # Guard: Do not intercept whole-day routine requests (handled by routine_planning)
    is_whole_day_routine_request = any(k in p_lower for k in [
        "plan my day", "plan today", "suggest a schedule", "suggest schedule",
        "suggest routine", "daily routine", "suggest tasks", "workout schedule",
        "fitness schedule", "study schedule", "routine for today"
    ]) and not has_trigger

    if (not has_trigger and not has_pattern) or is_whole_day_routine_request:
        return None

    # 1. Extract Duration
    min_m = re.search(r"(\d+)\s*(?:min|minute|minutes|m\b)", p_lower)
    hrs_m = re.search(r"(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs|h\b)", p_lower)
    if min_m:
        duration = int(min_m.group(1))
    elif hrs_m:
        duration = int(float(hrs_m.group(1)) * 60)
    else:
        duration = 45

    # 2. Extract Time
    time_raw = re.search(r"(\d{1,2}(?::\d{2})?\s*(?:am|pm)|\b\d{1,2}:\d{2}\b)", p_lower)
    start_time = parse_time_to_24h(time_raw.group(1) if time_raw else None)

    # 3. Classify Category
    category = "Work"
    if any(w in p_lower for w in ["study", "syllabus", "exam", "reading", "learn", "course", "lecture", "homework", "math", "history", "physics"]):
        category = "Study"
    elif any(w in p_lower for w in ["gym", "workout", "sleep", "cardio", "walk", "meditat", "health", "water", "exercise", "run", "yoga", "stretch"]):
        category = "Health"
    elif any(w in p_lower for w in ["budget", "invest", "crypto", "tax", "finance", "money", "savings", "bill", "invoice", "portfolio"]):
        category = "Money"
    elif any(w in p_lower for w in ["family", "hobby", "social", "clean", "personal", "errand", "dinner", "lunch"]):
        category = "Personal"

    # 4. Clean and Extract Title
    clean_title = re.sub(r"^(?:please\s+)?(?:can\s+you\s+)?(?:add\s+a?\s*|create\s+a?\s*|schedule\s+a?\s*|put\s+a?\s*|insert\s+a?\s*|remind\s+me\s+to\s+)", "", prompt, flags=re.IGNORECASE).strip()
    clean_title = re.sub(r"(?:in|to|into)\s+my\s+(?:tasks?|plann(?:er|ar)|schedule)(?:\s+and\s+(?:tasks?|plann(?:er|ar)|schedule))?", "", clean_title, flags=re.IGNORECASE).strip()
    clean_title = re.sub(r"(?:in|to|into)\s+(?:the\s+)?(?:tasks?|plann(?:er|ar)|schedule)", "", clean_title, flags=re.IGNORECASE).strip()
    clean_title = re.sub(r"^task(?:\s*:|\s+is)?", "", clean_title, flags=re.IGNORECASE).strip()
    clean_title = re.sub(r"(?:at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b|\b\d{1,2}:\d{2}\b)", "", clean_title, flags=re.IGNORECASE).strip()
    clean_title = re.sub(r"(?:for\s+)?\b\d+\s*(?:mins?|minutes?|hours?|hrs?|h)\b", "", clean_title, flags=re.IGNORECASE).strip()
    clean_title = clean_title.strip(" :.-,?!")
    clean_title = re.sub(r"\s+", " ", clean_title).strip()

    if not clean_title or len(clean_title) < 2 or clean_title.lower() in ["task", "planner", "plannar", "schedule", "my", "a", "an", "the"]:
        clean_title = f"{category} Focus Session"

    if len(clean_title) <= 30:
        clean_title = clean_title.title()
    else:
        clean_title = clean_title[:1].upper() + clean_title[1:]

    impact_desc = "+0.8 Focus & Cognitive Output" if category in ["Work", "Study"] else ("+0.6 Vitality Index" if category == "Health" else "+2% Capital Control")

    advice_text = f"""### Scheduled Task: **{clean_title}**

I have configured this focus block for your Daily Planner:

| Attribute | Scheduled Value |
| :--- | :--- |
| **Task Title** | {clean_title} |
| **Scheduled Time** | `{start_time}` |
| **Duration** | {duration} minutes |
| **Category** | `{category}` |
| **Predicted Impact** | {impact_desc} |

Task scheduled and ready in your Daily Planner."""

    if think_mode:
        think_block = f"""<think>
Step 1 — Goal Definition:
• Objective: Schedule single focus block ("{clean_title}") without conflicting with existing routine.

Step 2 — Telemetry Search & Gathered User Data:
• Role Persona: {user_info.get('role', 'professional').title()} | Target Work/Study Hours: {t_data.get('study_target_week', 10.0)}h/wk
• Target Execution Time: {start_time} | Duration: {duration} minutes | Category: {category}

Step 3 — Multi-Criteria Analysis & Optimization:
• Task Load Alignment: Focus sprint structured to optimize cognitive execution.

Step 4 — Formulated Strategic Execution Plan:
• Formatted single task proposal card for user approval.
</think>

"""
        advice_text = think_block + advice_text

    action_payload = {
        "title": clean_title,
        "start": start_time,
        "minutes": duration,
        "category": category,
        "impact": impact_desc
    }

    return {
        "content": advice_text,
        "action_type": "add_task",
        "action_payload": json.dumps(action_payload),
        "action_status": "proposed"
    }
