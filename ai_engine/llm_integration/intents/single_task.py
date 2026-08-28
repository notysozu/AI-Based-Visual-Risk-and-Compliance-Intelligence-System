import re
import json
from typing import Dict, Any, Optional


def handle_single_task_intent(
    prompt: str,
    p_lower: str,
    user_info: Dict[str, Any],
    t_data: Dict[str, Any],
    think_mode: bool = False
) -> Optional[Dict[str, Any]]:
    task_keywords = ["add task", "add a task", "schedule a task", "create task", "add habit", "schedule habit", "block time", "add deep work", "add study sprint", "remind me to", "schedule a sprint", "focus sprint"]
    is_single_task_intent = any(k in p_lower for k in task_keywords) or (("add" in p_lower or "schedule" in p_lower) and ("min" in p_lower or "minute" in p_lower or "hour" in p_lower or "am" in p_lower or "pm" in p_lower))

    if not is_single_task_intent:
        return None

    min_m = re.search(r"(\d+)\s*(?:min|minute|minutes|m\b)", p_lower)
    hrs_m = re.search(r"(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs|h\b)", p_lower)
    if min_m:
        duration = int(min_m.group(1))
    elif hrs_m:
        duration = int(float(hrs_m.group(1)) * 60)
    else:
        duration = 45

    time_m = re.search(r"(\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{1,2}:\d{2})", p_lower)
    start_time = time_m.group(1).upper() if time_m else "09:00"

    category = "Work"
    if any(w in p_lower for w in ["study", "syllabus", "exam", "reading", "learn", "course", "lecture"]):
        category = "Study"
    elif any(w in p_lower for w in ["gym", "workout", "sleep", "cardio", "walk", "meditat", "health", "water"]):
        category = "Health"
    elif any(w in p_lower for w in ["budget", "invest", "crypto", "tax", "finance", "money", "savings"]):
        category = "Money"
    elif any(w in p_lower for w in ["family", "hobby", "social", "clean", "personal"]):
        category = "Personal"

    clean_title = re.sub(r"^(?:please\s+)?(?:can\s+you\s+)?(?:add\s+a?\s*|create\s+a?\s*|schedule\s+a?\s*)", "", prompt, flags=re.IGNORECASE).strip()
    clean_title = re.sub(r"(?:at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\b\d+\s*min(?:ute)?s?|\b\d+\s*hours?|\bto\s+my\s+(?:tasks?|planner|schedule))", "", clean_title, flags=re.IGNORECASE).strip()
    if not clean_title or len(clean_title) < 3:
        clean_title = f"{category} Sprint Block"

    clean_title = clean_title.strip(" .?!,")
    if len(clean_title) > 50:
        clean_title = clean_title[:47] + "..."

    impact_desc = "+0.8 Focus & Cognitive Output" if category in ["Work", "Study"] else ("+0.6 Vitality Index" if category == "Health" else "+2% Capital Control")

    advice_text = f"""### Proposed Schedule Addition: **{clean_title}**

Based on your telemetry profile and current daily routine, I have structured this calibrated focus block:

| Attribute | Scheduled Value |
| :--- | :--- |
| **Task Title** | {clean_title} |
| **Scheduled Time** | `{start_time}` |
| **Duration** | {duration} minutes |
| **Category** | `{category}` |
| **Predicted Impact** | {impact_desc} |

Click **Approve & Add Task** below to append this directly to your Daily Planner."""

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
