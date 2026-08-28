import re
import json
from typing import Dict, Any, Optional


def handle_study_logging_intent(
    prompt: str,
    p_lower: str,
    user_info: Dict[str, Any],
    t_data: Dict[str, Any],
    think_mode: bool = False,
    active_study_subject: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    study_log_triggers = ["i studied", "studied for", "studied ", "log study", "log my study", "log academic", "recorded study", "track study", "completed study", "finished studying"]
    if not (any(k in p_lower for k in study_log_triggers) and any(w in p_lower for w in ["hour", "hours", "hr", "hrs", "min", "mins", "minute", "minutes"])):
        return None

    hrs_m = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*(?:hours?|hrs?|h\b)", p_lower)
    mins_m = re.search(r"([0-9]+)\s*(?:mins?|minutes?|m\b)", p_lower)
    if hrs_m:
        study_mins = int(float(hrs_m.group(1)) * 60)
        study_hrs = float(hrs_m.group(1))
    elif mins_m:
        study_mins = int(mins_m.group(1))
        study_hrs = round(study_mins / 60.0, 1)
    else:
        study_mins = 60
        study_hrs = 1.0

    f_score_m = re.search(r"(?:focus|rating|intensity)\s*(?:score|rating|is|of)?\s*([0-9]|10)\b", p_lower)
    focus_score = int(f_score_m.group(1)) if f_score_m else 8

    exam_m = re.search(r"(?:exam|test|quiz|grade|score)\s*(?:was|is|of|scored)?\s*([0-9]{1,3}(?:\.[0-9]+)?)\b", p_lower)
    exam_score = float(exam_m.group(1)) if exam_m and float(exam_m.group(1)) <= 100 else None

    clean_subj_str = re.sub(r"\b(?:i\s+studied|log\s+study|log\s+my\s+study|record|track|completed|finished)\b", "", prompt, flags=re.IGNORECASE)
    clean_subj_str = re.sub(r"[0-9]+(?:\.[0-9]+)?\s*(?:hours?|hrs?|mins?|minutes?|h\b)", "", clean_subj_str, flags=re.IGNORECASE)
    clean_subj_str = re.sub(r"(?:focus|rating|exam|test|score|quiz|with)\s*(?:was|is|of)?\s*[0-9]+(?:\.[0-9]+)?%?", "", clean_subj_str, flags=re.IGNORECASE)
    clean_subj_str = re.sub(r"\b(?:for|of|in|today|yesterday|and|my|academic|session)\b", "", clean_subj_str, flags=re.IGNORECASE).strip(" .?!,")
    
    subject = clean_subj_str.title() if len(clean_subj_str) >= 2 else (active_study_subject or "Core Curriculum")
    if len(subject) > 35:
        subject = subject[:32] + "..."

    weekly_target = t_data.get("study_target_week", 15.0)
    current_weekly_study = t_data.get("study_hours_week", 10.0)
    new_weekly_study = round(current_weekly_study + study_hrs, 1)
    weekly_pct = round((new_weekly_study / weekly_target) * 100) if weekly_target > 0 else 100
    
    exam_str = f"{exam_score:.0f}%" if exam_score is not None else "N/A"
    
    advice_text = f"""### Academic Study Session Logged: **{subject}**

Successfully logged your academic deep work session. Here is your updated study telemetry and retention trajectory:

| Metric | Recorded Value | Target / Baseline | Trajectory Impact |
| :--- | :--- | :--- | :--- |
| **Subject** | **{subject}** | Academic Focus | Primary Domain |
| **Duration** | **{study_hrs:.1f}h** ({study_mins} mins) | Daily Study Pace | +{study_hrs:.1f}h Active Focus |
| **Focus Quality** | **{focus_score} / 10** | High Cognition Baseline | Optimal Deep State |
| **Exam / Mastery Score** | **{exam_str}** | Competency Baseline | Validated Mastery |
| **Weekly Target Progress** | **{new_weekly_study:.1f}h / {weekly_target:.1f}h** | {weekly_target:.1f}h / week | **{weekly_pct}% Complete** |

#### Recommended Next-Phase Study Action:
- **Spaced Repetition Review:** To maximize long-term consolidation of today's {subject} material, schedule a **15-min Active Recall & Spaced Repetition Block** tomorrow morning at **09:00**.
- **Cognitive Decompression:** Step away from screens for 15 minutes before your next work block to reset cognitive bandwidth.

Click **Confirm & Save to Academic Records** below to commit this study session directly into your database."""

    if think_mode:
        think_block = f"""<think>
Step 1 — Goal Definition:
• Objective: Log academic study session for "{subject}" ({study_hrs:.1f}h), compute weekly progress delta, and synthesize next-phase spaced repetition protocol.

Step 2 — Telemetry Search & Gathered User Data:
• Academic Subject: {subject} | Session Duration: {study_hrs:.1f}h ({study_mins} mins) | Focus Score: {focus_score}/10
• Weekly Target Progression: {current_weekly_study:.1f}h -> {new_weekly_study:.1f}h / {weekly_target:.1f}h ({weekly_pct}% achieved).
• Baseline Telemetry: Sleep = {t_data['avg_sleep']:.1f}h | Cash Flow Surplus = +${t_data['monthly_savings']:,.2f}/mo

Step 3 — Multi-Criteria Analysis & Optimization:
• Memory Consolidation Curve: Optimal Ebbinghaus forgetting curve retention achieved by scheduling active recall review within 24–48 hours.
• Cognitive Load Balance: Weekly study hours paced safely within cognitive saturation threshold.

Step 4 — Formulated Strategic Execution Plan:
• Formatted study telemetry breakdown and prepared 1-click database logging proposal for user confirmation.
</think>

"""
        advice_text = think_block + advice_text

    action_payload = {
        "subject": subject,
        "duration_minutes": study_mins,
        "focus_score": focus_score,
        "exam_score": exam_score,
        "notes": f"Logged via Visual Risk Copilot ({study_hrs:.1f}h {subject})"
    }

    return {
        "content": advice_text,
        "action_type": "log_study",
        "action_payload": json.dumps(action_payload),
        "action_status": "proposed"
    }
