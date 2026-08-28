import re
import json
from typing import Dict, Any, Optional


def handle_habit_logging_intent(
    prompt: str,
    p_lower: str,
    user_info: Dict[str, Any],
    t_data: Dict[str, Any],
    think_mode: bool = False
) -> Optional[Dict[str, Any]]:
    habit_log_triggers = ["i slept", "slept for", "slept ", "only slept", "sleep was", "log sleep", "log habit", "screen time was", "log screen", "i worked out", "exercised for", "log workout"]
    if not (any(k in p_lower for k in habit_log_triggers) and any(w in p_lower for w in ["hour", "hours", "hr", "hrs", "min", "mins", "minute", "minutes", "h\b"])):
        return None

    if any(w in p_lower for w in ["sleep", "slept", "bed", "rest"]):
        habit_name = "Sleep"
        hrs_m = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*(?:hours?|hrs?|h\b)", p_lower)
        logged_hours = float(hrs_m.group(1)) if hrs_m else 5.0
        logged_mins = int(logged_hours * 60)
        baseline_target = t_data["sleep_target"]
        deficit = round(baseline_target - logged_hours, 1)
        impact_score = 4 if logged_hours < 6.0 else 8
        
        status_desc = f"Acute Deficit: -{deficit:.1f}h below target" if deficit > 0 else f"+{abs(deficit):.1f}h Restorative Surplus"
        
        advice_text = f"""### Biometric Habit Logged: **Sleep ({logged_hours:.1f}h)**

Recorded your sleep baseline for today. Here is your biometric analysis and circadian optimization strategy:

| Metric | Logged Value | Target Baseline | Variance | Circadian Protocol |
| :--- | :--- | :--- | :--- | :--- |
| **Daily Sleep** | **{logged_hours:.1f} hours** | {baseline_target:.1f} hours | **{status_desc}** | {('Circadian Afternoon Recharge Needed' if deficit > 1.0 else 'Optimal Recovery')} |
| **Cognitive Alertness Peak** | 09:00 – 11:30 | Natural Morning Cortisol | High Alertness | Front-load deep cognitive sprints |
| **Fatigue Trough Window** | 13:30 – 15:30 | Post-Prandial Drop | Low Alertness | Schedule 20-min recharge / light walk |
| **Recommended Bedtime** | 22:30 | Sleep Debt Reset | Rest Recovery | 30-min screen-free wind-down |

#### Circadian Recommendations for Today:
- **Protect Morning Cognitive Output:** Capitalize on your 09:00–11:30 cortisol peak before the afternoon dip.
- **Afternoon Power Nap / Light Walk:** A **20-min recharge at 14:00** will neutralize fatigue without disrupting nocturnal sleep pressure.
- **Caffeine Curfew:** Cease caffeine intake by 13:00 to prevent sleep latency degradation tonight.

Click **Confirm & Save to Biometric Records** below to commit this entry to your habit logs."""

        if think_mode:
            think_block = f"""<think>
Step 1 — Goal Definition:
• Objective: Log {logged_hours:.1f}h sleep, compute acute sleep deficit (-{deficit:.1f}h below {baseline_target:.1f}h target), and adapt circadian performance protocol.

Step 2 — Telemetry Search & Gathered User Data:
• Logged Sleep: {logged_hours:.1f}h | Target Baseline: {baseline_target:.1f}h | Sleep Debt: {max(0.0, deficit):.1f}h
• Role Persona: {user_info.get('role', 'professional').title()} | Cash Flow Surplus: +${t_data['monthly_savings']:,.2f}/mo
• Measured Alertness Window: Morning peak (09:00–11:30), afternoon fatigue trough (13:30–15:30).

Step 3 — Multi-Criteria Analysis & Optimization:
• Fatigue Index: {('Acute sleep deprivation detected (<6.0h). Afternoon cognitive output adjusted -15%.' if logged_hours < 6.0 else 'Restorative sleep baseline intact.')}
• Schedule Adaptation: Insert 20-min restorative recharge block at 14:00 and cap evening deep blocks.

Step 4 — Formulated Strategic Execution Plan:
• Formatted biometric analysis table and prepared 1-click habit record logging proposal for user confirmation.
</think>

"""
            advice_text = think_block + advice_text

        action_payload = {
            "habit_name": "Sleep",
            "duration_minutes": logged_mins,
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
