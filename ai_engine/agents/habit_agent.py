"""
HabitAgent — directly logs habit records (sleep, exercise, screen time, mood) from chat.

Triggers on: "I slept X hours", "I exercised today", "my screen time was X", "mood 8/10"
Directly inserts HabitRecordDoc without requiring approval.
"""

import re
import json
from typing import Dict, Any, Optional


def handle_habit_agent(
    prompt: str,
    p_lower: str,
    user_info: Dict[str, Any],
    t_data: Dict[str, Any],
    think_mode: bool = False
) -> Optional[Dict[str, Any]]:
    """
    Detect habit logging intent and return a direct-execution action payload.
    Returns None if this message is not a habit log request.
    """
    habit_triggers = [
        "i slept", "slept for", "had only", "only got", "got only",
        "i exercised", "i worked out", "went for a run", "went to the gym",
        "did yoga", "did workout", "completed workout",
        "my screen time", "screen time was", "spent on screen",
        "my mood is", "mood today is", "feeling a", "mood:",
        "i drank", "drank water", "glasses of water",
    ]

    has_trigger = any(k in p_lower for k in habit_triggers)
    if not has_trigger:
        return None

    habit_entries = []
    descriptions = []

    # Sleep
    sleep_m = re.search(
        r"(?:slept|only\s+got|got|had)\s*(?:for\s*|only\s*)?([0-9]+(?:\.[0-9]+)?)\s*(?:hours?|hrs?|h\b)",
        p_lower
    )
    if sleep_m:
        hrs = float(sleep_m.group(1))
        mins = int(hrs * 60)
        habit_entries.append({
            "habit_name": "Sleep",
            "duration_minutes": mins,
            "impact_score": max(1, min(10, int(hrs)))
        })
        descriptions.append(f"Sleep logged: **{hrs}h**")

    # Exercise / workout
    exercise_keywords = ["exercised", "worked out", "run", "gym", "yoga", "workout", "jogged", "cycled", "walked"]
    is_exercise = any(k in p_lower for k in exercise_keywords)
    if is_exercise:
        # Try to extract duration
        dur_m = re.search(r"([0-9]+)\s*(?:minutes?|mins?|hours?|hrs?|h\b)", p_lower)
        dur_mins = int(dur_m.group(1)) if dur_m else 45
        if dur_m and "hour" in p_lower[dur_m.start():dur_m.end()]:
            dur_mins = int(dur_m.group(1)) * 60
        habit_entries.append({
            "habit_name": "Exercise",
            "duration_minutes": dur_mins,
            "impact_score": 8
        })
        descriptions.append(f"Exercise logged: **{dur_mins} min**")

    # Screen time
    scr_m = re.search(
        r"screen\s*time\s*(?:was|is|=|:)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:hours?|hrs?|h\b)",
        p_lower
    )
    if scr_m:
        hrs = float(scr_m.group(1))
        mins = int(hrs * 60)
        target = float(user_info.get("screen_time_target_hours", 3.5) or 3.5)
        impact = max(1, min(10, int(10 - min(10, hrs / target * 5))))
        habit_entries.append({
            "habit_name": "Screen Time",
            "duration_minutes": mins,
            "impact_score": impact
        })
        descriptions.append(f"Screen Time logged: **{hrs}h**")

    # Mood
    mood_m = re.search(
        r"(?:mood|feeling)\s*(?:is|:)?\s*(?:a\s*)?([0-9]+(?:\.[0-9]+)?)\s*(?:/\s*10)?",
        p_lower
    )
    if mood_m:
        score = min(10, max(1, int(float(mood_m.group(1)))))
        habit_entries.append({
            "habit_name": "Mood",
            "duration_minutes": 0,
            "impact_score": score
        })
        descriptions.append(f"Mood logged: **{score}/10**")

    if not habit_entries:
        return None

    think_prefix = ""
    if think_mode:
        think_prefix = f"""<think>
Step 1 — Goal Definition:
• Objective: Log biometric habit records directly to MongoDB from user chat statement.

Step 2 — Telemetry Search & Gathered User Data:
• Detected habits: {json.dumps(habit_entries)}

Step 3 — Multi-Criteria Analysis & Optimization:
• Validated habit entries. Impact scores calculated.

Step 4 — Formulated Strategic Execution Plan:
• Inserting HabitRecordDoc(s) directly to MongoDB. No approval required.
</think>

"""

    changes_str = "\n".join(f"- {d}" for d in descriptions)
    content = f"""{think_prefix}### ✓ Habits Logged

{changes_str}

Your biometric telemetry has been updated. Analytics will reflect these entries immediately.
"""

    return {
        "content": content,
        "action_type": "log_habits_batch",
        "action_payload": json.dumps({"habits": habit_entries}),
        "action_status": "auto_execute",
    }
