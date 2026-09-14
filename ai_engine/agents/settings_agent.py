"""
SettingsAgent — handles user profile settings mutations from chat.

Triggers on: "set my sleep target to X", "retire at age X",
             "my study target is X hours", "change my role to student",
             "set autonomy to full", "change theme to light"
"""

import re
import json
from typing import Dict, Any, Optional


def handle_settings_agent(
    prompt: str,
    p_lower: str,
    user_info: Dict[str, Any],
    t_data: Dict[str, Any],
    think_mode: bool = False
) -> Optional[Dict[str, Any]]:
    """
    Detect settings/profile mutation intent and return a direct-execution action payload.
    Returns None if this message is not a settings mutation request.
    """
    settings_triggers = [
        "set my sleep", "sleep target", "sleep goal",
        "set my study", "study target", "study goal", "study hours",
        "set my exercise", "exercise target", "workout target",
        "set my screen time", "screen time target",
        "retire at", "retirement age", "retire by",
        "target net worth", "wealth target",
        "savings target", "savings rate target",
        "change my role", "set my role", "i am a", "i'm a",
        "autonomy mode", "set autonomy", "full autonomous", "semi autonomous", "supervised mode",
        "change theme", "set theme", "dark mode", "light mode",
        "set my age", "my age is", "i am", "i'm",
    ]

    has_trigger = any(k in p_lower for k in settings_triggers)
    # Must also have a value indicator
    has_value = bool(re.search(r"[0-9]|student|professional|doctor|engineer|developer|dark|light|full|semi|supervised", p_lower))

    if not has_trigger or not has_value:
        return None

    diff_fields: Dict[str, Any] = {}
    descriptions = []

    # Sleep target
    slp_m = re.search(
        r"sleep\s*(?:target|hours?|goal)?\s*(?:is|to|=|:)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:hours?|hrs?|h\b)?",
        p_lower
    )
    if slp_m:
        val = float(slp_m.group(1))
        if 4 <= val <= 12:
            diff_fields["sleep_target_hours"] = val
            descriptions.append(f"Sleep Target → **{val}h/day**")

    # Study target
    study_m = re.search(
        r"study\s*(?:target|hours?|goal|hours?\s*(?:per\s*)?week)?\s*(?:is|to|=|:)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:hours?|hrs?|h\b)?",
        p_lower
    )
    if study_m:
        val = float(study_m.group(1))
        if 1 <= val <= 80:
            diff_fields["study_target_hours_week"] = val
            descriptions.append(f"Weekly Study Target → **{val}h/week**")

    # Exercise target (days/week)
    exc_m = re.search(
        r"exercise\s*(?:target|days?|goal)?\s*(?:is|to|=|:)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:days?|times?\s*(?:a\s*)?week)?",
        p_lower
    )
    if exc_m:
        val = float(exc_m.group(1))
        if 0 <= val <= 7:
            diff_fields["exercise_target_days"] = val
            descriptions.append(f"Exercise Target → **{val} days/week**")

    # Screen time target
    scr_m = re.search(
        r"screen\s*time\s*(?:target|limit|goal)?\s*(?:is|to|=|:)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:hours?|hrs?|h\b)?",
        p_lower
    )
    if scr_m:
        val = float(scr_m.group(1))
        if 0 <= val <= 16:
            diff_fields["screen_time_target_hours"] = val
            descriptions.append(f"Screen Time Target → **{val}h/day**")

    # Retirement age
    ret_m = re.search(
        r"(?:retire|retirement)\s*(?:at|by|age|goal)?\s*(?:age|=|:)?\s*([0-9]{2})",
        p_lower
    )
    if ret_m:
        val = int(ret_m.group(1))
        if 30 <= val <= 80:
            diff_fields["retirement_goal_age"] = val
            descriptions.append(f"Retirement Age → **{val}**")

    # Target net worth
    tnw_m = re.search(
        r"(?:target\s*net\s*worth|wealth\s*target|net\s*worth\s*goal)\s*(?:is|to|=|:)?\s*\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:k|m|million|thousand)?",
        p_lower
    )
    if tnw_m:
        raw = tnw_m.group(1).replace(",", "")
        val = float(raw)
        suffix_area = p_lower[tnw_m.end():tnw_m.end()+10]
        if "million" in suffix_area or suffix_area.strip().startswith("m"):
            val *= 1_000_000
        elif "thousand" in suffix_area or suffix_area.strip().startswith("k"):
            val *= 1_000
        diff_fields["target_net_worth"] = val
        descriptions.append(f"Target Net Worth → **${val:,.0f}**")

    # Role
    role_map = {
        "student": "student", "college": "student", "university": "student",
        "doctor": "doctor", "physician": "doctor", "medical": "doctor",
        "engineer": "engineer", "developer": "developer", "programmer": "developer",
        "professional": "professional", "manager": "professional",
        "entrepreneur": "entrepreneur", "founder": "entrepreneur",
        "freelancer": "freelancer",
    }
    for keyword, role_val in role_map.items():
        if f"role to {keyword}" in p_lower or f"role is {keyword}" in p_lower or (
            re.search(rf"i(?:'m| am) a(?:n)? {keyword}", p_lower)
        ):
            diff_fields["role"] = role_val
            descriptions.append(f"Role → **{role_val.title()}**")
            break

    # Autonomy mode
    if "full autonomous" in p_lower or "fully autonomous" in p_lower or "full_autonomous" in p_lower:
        diff_fields["autonomy_mode"] = "full_autonomous"
        descriptions.append("Autonomy Mode → **Full Autonomous**")
    elif "semi autonomous" in p_lower or "semi_autonomous" in p_lower:
        diff_fields["autonomy_mode"] = "semi_autonomous"
        descriptions.append("Autonomy Mode → **Semi-Autonomous**")
    elif "supervised" in p_lower and "autonomy" in p_lower:
        diff_fields["autonomy_mode"] = "supervised"
        descriptions.append("Autonomy Mode → **Supervised**")

    # Theme
    if ("dark mode" in p_lower or "dark theme" in p_lower or "set theme to dark" in p_lower or "theme dark" in p_lower):
        diff_fields["theme_preference"] = "dark"
        descriptions.append("Theme → **Dark**")
    elif ("light mode" in p_lower or "light theme" in p_lower or "set theme to light" in p_lower or "theme light" in p_lower):
        diff_fields["theme_preference"] = "light"
        descriptions.append("Theme → **Light**")

    # Age
    age_m = re.search(r"(?:my age is|i am|i'm)\s*([0-9]{2})\s*(?:years?\s*old)?", p_lower)
    if age_m:
        val = int(age_m.group(1))
        if 13 <= val <= 100:
            diff_fields["age"] = val
            descriptions.append(f"Age → **{val}**")

    if not diff_fields:
        return None

    think_prefix = ""
    if think_mode:
        think_prefix = f"""<think>
Step 1 — Goal Definition:
• Objective: Update profile settings fields from user statement.

Step 2 — Telemetry Search & Gathered User Data:
• Detected settings changes: {json.dumps(diff_fields)}

Step 3 — Multi-Criteria Analysis & Optimization:
• Values validated and boundary-checked.

Step 4 — Formulated Strategic Execution Plan:
• Executing settings update directly to MongoDB.
</think>

"""

    changes_str = "\n".join(f"- {d}" for d in descriptions)
    content = f"""{think_prefix}### ✓ Settings Updated

{changes_str}

Your profile has been updated and all forecasts will recalculate with the new values.
"""

    return {
        "content": content,
        "action_type": "update_user_fields",
        "action_payload": json.dumps(diff_fields),
        "action_status": "auto_execute",
    }
