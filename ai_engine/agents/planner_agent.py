"""
PlannerAgent — directly adds/removes/completes tasks in the planner from chat.

Triggers on: "add a task: Morning Run at 07:00 for 30 minutes",
             "add task X", "schedule X at Y for Z minutes"
"""

import re
import json
import time
from typing import Dict, Any, Optional, List


def handle_planner_agent(
    prompt: str,
    p_lower: str,
    user_info: Dict[str, Any],
    t_data: Dict[str, Any],
    think_mode: bool = False
) -> Optional[Dict[str, Any]]:
    """
    Detect single direct task add intent (without full schedule generation) and return
    a direct-execution action payload. Returns None if not a direct task-add request.

    Note: multi-task routine planning (e.g. "plan my day") remains handled by the
    existing routine_planning intent with the "proposed" approval flow.
    """
    # Must explicitly name a task (not just ask for a plan)
    direct_add_triggers = [
        "add a task", "add task", "add this task",
        "schedule a task", "create a task", "new task",
        "remind me to", "add to planner", "add to my planner",
        "add to tasks", "add to my tasks",
    ]

    has_trigger = any(k in p_lower for k in direct_add_triggers)
    if not has_trigger:
        return None

    # Extract task details
    # Pattern: "add task: <title> at <time> for <duration>"
    # Or:      "add task <title>"

    title = None
    start_time = "09:00"
    duration_minutes = 30
    category = "Focus"

    # Two-pass parse: first strip the trigger prefix, then extract title / time / duration
    # from the remainder using anchored patterns (avoids lazy-quantifier title truncation).
    TRIGGER_PREFIX = re.compile(
        r"(?:add\s+(?:a\s+)?task[:\s]+|schedule\s+(?:a\s+)?task[:\s]+"
        r"|new\s+task[:\s]+|create\s+(?:a\s+)?task[:\s]+)",
        re.IGNORECASE,
    )
    pfx_m = TRIGGER_PREFIX.search(p_lower)
    if pfx_m:
        remainder = p_lower[pfx_m.end():].strip()

        # Extract duration first (rightmost "for X min/h")
        dur_m = re.search(r"\bfor\s+([0-9]+)\s*(minutes?|mins?|hours?|hrs?|h\b)", remainder)
        if dur_m:
            raw_dur = int(dur_m.group(1))
            duration_minutes = raw_dur * 60 if "hour" in dur_m.group(2) or "hr" in dur_m.group(2) else raw_dur
            remainder = (remainder[:dur_m.start()] + remainder[dur_m.end():]).strip()

        # Extract time ("at HH:MM" or "at HH:MM am/pm")
        time_m = re.search(r"\bat\s+([0-9]{1,2}:[0-9]{2}(?:\s*[ap]m?)?)", remainder, re.IGNORECASE)
        if time_m:
            raw_time = time_m.group(1).strip().upper()
            # Normalize 12h → 24h
            if "PM" in raw_time:
                parts = re.findall(r"[0-9]+", raw_time)
                if parts:
                    h = (int(parts[0]) % 12) + 12
                    m2 = int(parts[1]) if len(parts) > 1 else 0
                    start_time = f"{h:02d}:{m2:02d}"
            elif "AM" in raw_time:
                parts = re.findall(r"[0-9]+", raw_time)
                if parts:
                    h = int(parts[0]) % 12
                    m2 = int(parts[1]) if len(parts) > 1 else 0
                    start_time = f"{h:02d}:{m2:02d}"
            else:
                # Already 24h format like "07:00"
                start_time = raw_time
            remainder = (remainder[:time_m.start()] + remainder[time_m.end():]).strip()

        # Whatever is left is the task title
        raw_title = remainder.strip().strip(":").strip()
        if raw_title:
            title = raw_title.title()

    if not title:
        # Fallback: extract just the title after trigger (no time/duration structured parse)
        for trigger in direct_add_triggers:
            idx = p_lower.find(trigger)
            if idx != -1:
                after = prompt[idx + len(trigger):].strip().lstrip(":").strip()
                if after:
                    title = after[:60].title()
                break

    if not title or len(title) < 2:
        return None

    # Detect category from title keywords
    cat_map = {
        "run": "Fitness", "gym": "Fitness", "workout": "Fitness", "exercise": "Fitness",
        "yoga": "Fitness", "walk": "Fitness", "cycle": "Fitness",
        "study": "Academic", "read": "Academic", "revision": "Academic", "review": "Academic",
        "sleep": "Health", "nap": "Health", "meditate": "Health", "meditation": "Health",
        "call": "Work", "meeting": "Work", "work": "Work", "review": "Work",
    }
    for keyword, cat in cat_map.items():
        if keyword in title.lower():
            category = cat
            break

    task_id = f"chat-task-{int(time.time())}"
    task = {
        "id": task_id,
        "title": title,
        "category": category,
        "start": start_time,
        "minutes": duration_minutes,
        "impact": f"+0.8 {category}",
        "detail": f"Added via Visual Risk Copilot — {title}",
        "done": False,
        "fromSuggestion": True,
        "is_auto_planned": True,
    }

    think_prefix = ""
    if think_mode:
        think_prefix = f"""<think>
Step 1 — Goal Definition:
• Objective: Add a single task directly to the user's planner from chat.

Step 2 — Telemetry Search & Gathered User Data:
• Task: {title} at {start_time} for {duration_minutes}min, Category: {category}

Step 3 — Multi-Criteria Analysis & Optimization:
• Task validated. Category detected from title keywords.

Step 4 — Formulated Strategic Execution Plan:
• Adding task directly to planner tasks_json in MongoDB.
</think>

"""

    content = f"""{think_prefix}### ✓ Task Added to Planner

- **{title}**
  - Time: {start_time} | Duration: {duration_minutes} min | Category: {category}

Your planner has been updated. The task will appear in your daily view immediately.
"""

    return {
        "content": content,
        "action_type": "add_task",
        "action_payload": json.dumps(task),
        "action_status": "auto_execute",
    }
