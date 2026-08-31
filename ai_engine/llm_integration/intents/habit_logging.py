import re
import json
from typing import Dict, Any, Optional


def extract_duration(text: str) -> tuple[int, float]:
    """Extracts duration in minutes and hours from text, supporting 'an hour', 'a hour', '45 mins', '2.5h'."""
    text_lower = text.lower()
    
    # Check for "an hour" or "a hour"
    if re.search(r"\b(?:an|a)\s+hours?\b", text_lower):
        return 60, 1.0
    
    # Check for hours: e.g. "1.5 hours", "2 hrs", "1h"
    hrs_m = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*(?:hours?|hrs?|h\b)", text_lower)
    if hrs_m:
        hrs = float(hrs_m.group(1))
        return int(hrs * 60), hrs
    
    # Check for minutes: e.g. "45 mins", "90 minutes", "30m"
    mins_m = re.search(r"([0-9]+)\s*(?:mins?|minutes?|m\b)", text_lower)
    if mins_m:
        mins = int(mins_m.group(1))
        return mins, round(mins / 60.0, 1)
        
    return 60, 1.0


def handle_habit_logging_intent(
    prompt: str,
    p_lower: str,
    user_info: Dict[str, Any],
    t_data: Dict[str, Any],
    think_mode: bool = False
) -> Optional[Dict[str, Any]]:
    # Triggers for Exercise / Workouts
    exercise_keywords = [
        "exercise", "excercise", "workout", "worked out", "working out", 
        "gym", "training", "cardio", "running", "ran", "cycling", "swimming", 
        "walked", "walking", "yoga", "fitness"
    ]
    is_exercise = any(k in p_lower for k in exercise_keywords) and any(
        w in p_lower for w in ["hour", "hours", "hr", "hrs", "min", "mins", "minute", "minutes", "h\b", "did", "logged", "log", "finished", "completed", "went"]
    )

    # Triggers for Sleep
    sleep_keywords = ["sleep", "slept", "bed", "nap", "rest"]
    is_sleep = any(k in p_lower for k in sleep_keywords) and any(
        w in p_lower for w in ["hour", "hours", "hr", "hrs", "min", "mins", "minute", "minutes", "h\b", "only", "got", "had", "log", "was"]
    )

    # Triggers for Screen Time
    is_screen = "screen" in p_lower and any(
        w in p_lower for w in ["hour", "hours", "hr", "hrs", "min", "mins", "minute", "minutes", "log", "time", "was"]
    )

    if not (is_exercise or is_sleep or is_screen):
        return None

    # --- 1. Exercise / Workout Logging ---
    if is_exercise:
        dur_mins, logged_hours = extract_duration(prompt)
        habit_name = "Exercise"
        impact_score = 9 if logged_hours >= 0.75 else 7
        curr_active_days = t_data.get("exercise_days_count", 3)
        new_active_days = min(7, curr_active_days + 1)

        advice_text = f"""### Biometric Habit Logged: **Exercise ({logged_hours:.1f}h)**

Recorded your **{logged_hours:.1f}-hour ({dur_mins} mins)** workout session into your biometric telemetry.

| Telemetry Metric | Recorded Value | Weekly Active Days | Vitality Impact |
| :--- | :--- | :--- | :--- |
| **Activity** | **Exercise / Training** | **{new_active_days} days / week** | +0.8 Resilience & Stress Buffer |
| **Duration** | **{logged_hours:.1f} hours ({dur_mins} mins)** | Daily Movement Goal | Boosts next-day cognitive focus |

Click **Confirm & Save to Biometric Records** below to commit this entry to your habit logs and update `/analytics`."""

        if think_mode:
            think_block = f"""<think>
Step 1 — Goal Definition:
• Objective: Log {logged_hours:.1f}h exercise session ({dur_mins} mins) and update weekly active days telemetry.

Step 2 — Telemetry Search & Gathered User Data:
• Current Active Days: {curr_active_days}d/wk -> {new_active_days}d/wk | Stress Buffer Index: High
• Persona: {user_info.get('role', 'professional').title()} | Cash Flow Surplus: +${t_data['monthly_savings']:,.2f}/mo

Step 3 — Formulated Concise Response:
• Formatted concise biometric summary table and prepared 1-click habit record logging proposal.
</think>

"""
            advice_text = think_block + advice_text

        action_payload = {
            "habit_name": "Exercise",
            "duration_minutes": dur_mins,
            "hours": logged_hours,
            "impact_score": impact_score
        }

        return {
            "content": advice_text,
            "action_type": "log_habit",
            "action_payload": json.dumps(action_payload),
            "action_status": "proposed"
        }

    # --- 2. Sleep Logging ---
    if is_sleep:
        dur_mins, logged_hours = extract_duration(prompt)
        habit_name = "Sleep"
        baseline_target = t_data["sleep_target"]
        deficit = round(baseline_target - logged_hours, 1)
        impact_score = 4 if logged_hours < 6.0 else 8
        status_desc = f"-{deficit:.1f}h below target" if deficit > 0 else f"+{abs(deficit):.1f}h Restorative Surplus"

        advice_text = f"""### Biometric Habit Logged: **Sleep ({logged_hours:.1f}h)**

Recorded your sleep baseline for today.

| Metric | Logged Value | Target Baseline | Variance | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Daily Sleep** | **{logged_hours:.1f} hours** | {baseline_target:.1f} hours | **{status_desc}** | {('Afternoon 20m recharge recommended' if deficit > 1.0 else 'Optimal Recovery')} |
| **Cognitive Alertness Peak** | 09:00 – 11:30 | Natural Morning Cortisol | High Focus | Front-load deep cognitive sprints |

Click **Confirm & Save to Biometric Records** below to commit this entry to your habit logs and update `/analytics`."""

        if think_mode:
            think_block = f"""<think>
Step 1 — Goal Definition:
• Objective: Log {logged_hours:.1f}h sleep, compute acute sleep deficit (-{deficit:.1f}h below {baseline_target:.1f}h target).

Step 2 — Telemetry Search & Gathered User Data:
• Logged Sleep: {logged_hours:.1f}h | Target Baseline: {baseline_target:.1f}h | Sleep Debt: {max(0.0, deficit):.1f}h
• Role Persona: {user_info.get('role', 'professional').title()}

Step 3 — Formulated Concise Response:
• Formatted biometric summary table and prepared 1-click habit record logging proposal.
</think>

"""
            advice_text = think_block + advice_text

        action_payload = {
            "habit_name": "Sleep",
            "duration_minutes": dur_mins,
            "hours": logged_hours,
            "impact_score": impact_score
        }

        return {
            "content": advice_text,
            "action_type": "log_habit",
            "action_payload": json.dumps(action_payload),
            "action_status": "proposed"
        }

    # --- 3. Screen Time Logging ---
    if is_screen:
        dur_mins, logged_hours = extract_duration(prompt)
        habit_name = "Screen Time"
        impact_score = 4 if logged_hours > 5.0 else 8

        advice_text = f"""### Biometric Habit Logged: **Screen Time ({logged_hours:.1f}h)**

Recorded your recreational screen time for today.

| Metric | Logged Value | Daily Baseline | Fatigue Rating |
| :--- | :--- | :--- | :--- |
| **Screen Time** | **{logged_hours:.1f} hours** | {t_data.get('avg_screen', 4.0):.1f} hours | {('Elevated eye strain' if logged_hours > 5.0 else 'Controlled digital consumption')} |

Click **Confirm & Save to Biometric Records** below to commit this entry to your habit logs and update `/analytics`."""

        if think_mode:
            think_block = f"""<think>
Step 1 — Objective: Log {logged_hours:.1f}h screen time.
Step 2 — Formulate concise table with 1-click confirmation.
</think>

"""
            advice_text = think_block + advice_text

        action_payload = {
            "habit_name": "Screen Time",
            "duration_minutes": dur_mins,
            "hours": logged_hours,
            "impact_score": impact_score
        }

        return {
            "content": advice_text,
            "action_type": "log_habit",
            "action_payload": json.dumps(action_payload),
            "action_status": "proposed"
        }

    return None
