import json
import re
from typing import Dict, Any, List, Optional
from ai_engine.llm_integration.schedule_builder import (
    build_smart_role_schedule,
    build_fitness_schedule,
    build_study_schedule
)
from ai_engine.llm_integration.table_parser import parse_schedule_tasks_from_text


def handle_routine_planning_intent(
    prompt: str,
    p_lower: str,
    user_info: Dict[str, Any],
    t_data: Dict[str, Any],
    goal_name: str,
    goal_pct: int,
    goal_gap: float,
    think_mode: bool = False,
    active_logged_sleep: Optional[float] = None,
    active_study_subject: Optional[str] = None,
    history: Optional[List[Dict[str, Any]]] = None
) -> Optional[Dict[str, Any]]:
    # Guard: Do not trigger schedule generation on informational questions
    if any(p_lower.startswith(q) for q in [
        "what is", "what does", "how does", "how do", "why is", "why does",
        "why are", "explain", "tell me about", "can you explain", "what can"
    ]):
        return None

    # 1. Explicit multi-task routine & schedule request phrases
    explicit_schedule_requests = [
        "plan my day", "plan today", "plan some crazy tasks", "plan crazy tasks",
        "plan some tasks", "plan tasks", "plan a day", "plan my routine", "plan routine",
        "plan a schedule", "plan schedule", "suggest a schedule", "suggest schedule",
        "suggest a routine", "suggest routine", "daily routine", "suggest tasks",
        "suggest some tasks", "schedule my day", "build a schedule", "build schedule",
        "optimize my day", "routine for today", "plan a productive day", "boost my productivity",
        "productivity suggestions", "task suggestions", "tasks for productivity",
        "recommend tasks", "give me some tasks", "create a schedule", "create schedule",
        "make a schedule", "make schedule", "organize my day", "organize schedule",
        "fitness schedule", "workout schedule", "gym schedule",
        "exercise schedule", "fitness routine", "workout routine", "gym routine",
        "fitness plan", "workout plan", "training schedule", "cardio routine",
        "strength routine", "fitness blueprint", "workout blueprint",
        "lets say fitness schedule", "let's say fitness schedule", "say fitness schedule",
        "study schedule", "study routine", "exam routine", "learning schedule",
        "study plan schedule", "full schedule", "daily timetable", "timetable for today",
        "generate schedule", "generate daily plan", "build my schedule"
    ]

    schedule_intent_pattern = re.compile(
        r"\b(?:plan|suggest|create|build|generate|make|organize|schedule)\s+(?:some\s+|a\s+|my\s+|our\s+)?(?:crazy\s+|productive\s+|daily\s+|smart\s+|calibrated\s+|fitness\s+|study\s+)?(?:tasks|day|schedule|routine|blueprint|timetable|blocks)\b",
        re.IGNORECASE
    )

    confirmation_phrases = [
        "plug it in", "plug in", "plug into planner", "plug into my planner",
        "plug in my daily planner", "plug it in my daily planner",
        "plug in my daily plannar", "plug it in my daily plannar",
        "plug it into my daily planner", "plug it into daily planner",
        "add all to planner", "add all tasks to planner", "add these to planner",
        "add this schedule", "apply schedule", "apply plan", "confirm plan",
        "yes schedule it", "schedule these", "commit to planner", "save to planner",
        "yes plug it in", "yes add to planner", "plug all tasks",
        "add these in my tasks", "add these to my tasks", "add in my tasks",
        "add to my tasks", "add to tasks", "add them to my tasks",
        "add in my task", "add to my task", "can you add these in my tasks",
        "can you add these to my tasks", "add these into my tasks",
        "add these tasks", "add all", "add all of them", "add them all",
        "yes add them", "yes add all", "add it", "add them", "plug them in"
    ]

    number_select_match = re.search(
        r"(?:^|\b)(?:add\s+)?([0-9]+(?:\s*,\s*[0-9]+)*(?:\s*(?:and|&)\s*[0-9]+)?)(?:\s+(?:add\s+it|add\s+them|add|to\s+tasks|to\s+planner|to\s+my\s+tasks))?(?:\b|$)",
        p_lower
    )

    requested_indices: List[int] = []
    if number_select_match:
        digits = re.findall(r"\b\d+\b", p_lower)
        if digits and any(k in p_lower for k in ["add", "plug", "task", "planner", ",", "and"]):
            requested_indices = [int(d) for d in digits if int(d) > 0]

    is_explicit_request = any(k in p_lower for k in explicit_schedule_requests) or bool(schedule_intent_pattern.search(p_lower))
    is_confirmation_turn = any(k in p_lower for k in confirmation_phrases) or (len(requested_indices) > 0)

    if not is_explicit_request and not is_confirmation_turn:
        return None

    user_role_title = user_info.get("role", "professional").title()
    tasks: List[Dict[str, Any]] = []
    plan_title = f"Calibrated Daily Routine for **{user_role_title}**"

    # Step 1: If it's a confirmation turn and history is present, extract tasks from previous assistant messages
    if is_confirmation_turn and history:
        for prev_msg in reversed(history):
            if prev_msg.get("role") == "assistant":
                content = prev_msg.get("content", "")
                extracted = parse_schedule_tasks_from_text(content)
                if extracted:
                    if requested_indices:
                        selected = [extracted[idx - 1] for idx in requested_indices if 0 <= idx - 1 < len(extracted)]
                        if selected:
                            tasks = selected
                        else:
                            tasks = extracted
                    else:
                        tasks = extracted

                    if "fitness" in content.lower() or "workout" in content.lower() or "strength" in content.lower():
                        plan_title = "Calibrated Fitness & Vitality Routine"
                    elif "study" in content.lower() or "academic" in content.lower():
                        plan_title = "Calibrated Academic Deep Study Plan"
                    else:
                        plan_title = f"Calibrated Daily Routine for **{user_role_title}**"
                    break

    # Step 2: If no tasks extracted from history, generate domain-specific schedule
    if not tasks:
        # Check domain context: fitness, study, or role routine
        combined_text = " ".join([h.get("content", "") for h in (history or [])] + [prompt]).lower()
        is_fitness = any(k in p_lower or k in combined_text for k in ["fitness", "workout", "gym", "exercise", "strength", "cardio", "hiit"])
        is_study = any(k in p_lower or k in combined_text for k in ["study", "academic", "exam", "syllabus", "revision"])

        if is_fitness:
            tasks = build_fitness_schedule(user_info, t_data, active_logged_sleep=active_logged_sleep)
            plan_title = "Calibrated Fitness & Vitality Routine"
        elif is_study:
            tasks = build_study_schedule(user_info, t_data, active_study_subject=active_study_subject, active_logged_sleep=active_logged_sleep)
            plan_title = "Calibrated Academic Deep Study Plan"
        else:
            tasks = build_smart_role_schedule(
                user_info.get("role", "professional"),
                user_info,
                t_data,
                active_logged_sleep=active_logged_sleep,
                active_study_subject=active_study_subject
            )
            plan_title = f"Calibrated Daily Routine for **{user_role_title}**"

    table_rows = "\n".join(
        f"| `{t['start']}` | **{t['title']}** | {t['minutes']} mins | `{t['category']}` | {t['impact']} |"
        for t in tasks
    )

    if is_confirmation_turn:
        headline = f"### {plan_title} – Scheduled to Daily Planner\n\nI have added these **{len(tasks)} focus blocks** directly into your **Daily Planner**:"
    else:
        headline = f"### {plan_title}\n\nBased on your telemetry analysis (Sleep Baseline: **{active_logged_sleep or t_data['avg_sleep']:.1f}h** vs **{t_data['sleep_target']:.1f}h** target, Monthly Surplus: **+${t_data['monthly_savings']:,.2f}**, Goal: **{goal_name}** at **{goal_pct}%**), I have structured a circadian-optimized daily plan:"

    advice_text = f"""{headline}

| Time | Task / Block | Duration | Category | Predicted Impact |
| :--- | :--- | :--- | :--- | :--- |
{table_rows}

#### Telemetry & Optimization Highlights:
- **Circadian Alertness Peak (08:30 – 11:30):** High-leverage cognitive focus blocks scheduled during natural cortisol alertness peaks.
- **Context-Switching Protection:** Tasks separated into clean, protected intervals to minimize fragmentation.
- **Physical & Cognitive Recovery:** Dedicated vitality block to stabilize your **Health Index** and sleep architecture.

All {len(tasks)} time-blocks are queued for your Daily Planner. Click **Approve & Add All Tasks** below to finalize or view them directly on your timetable."""

    if think_mode:
        think_block = f"""<think>
Step 1 — Goal Definition:
• Objective: Optimize daily routine, maximize peak cognitive alertness window, and protect vitality recovery.

Step 2 — Telemetry Search & Gathered User Data:
• Role Persona: {user_role_title} (Age: {user_info.get('age', 25)} | Retirement Target: Age {t_data['target_retirement_age']})
• Biometrics & Baseline: Sleep = {active_logged_sleep or t_data['avg_sleep']:.1f}h (Target: {t_data['sleep_target']:.1f}h | Sleep Debt: {t_data['sleep_debt']:.1f}h), Screen Time = {t_data['avg_screen']:.1f}h/day, Active Days = {t_data['exercise_days_count']}d/wk
• Financial Health: Cash flow surplus = +${t_data['monthly_savings']:,.2f}/mo ({t_data['savings_rate']}% Savings Rate) | Net Worth = ${t_data['net_worth']:,.2f}
• Active Milestone: "{goal_name}" ({goal_pct}% complete, ${goal_gap:,.2f} gap remaining)
• Focus Domain: {active_study_subject or ','.join(t_data.get('recent_subjects', [])) or user_info.get('focus_area', 'Deep Work')}

Step 3 — Multi-Criteria Analysis & Optimization:
• Circadian Alertness Curve: Identified optimal cognitive peak window between 08:30 and 11:30.
• Workload Balancing: Structured {len(tasks)} non-overlapping focus blocks totaling {sum(t['minutes'] for t in tasks)} minutes of intentional execution.
• Predicted Trajectory: +1.8 Cumulative Focus Index, +1.0 Vitality Stability.

Step 4 — Formulated Strategic Execution Plan:
• Formatted daily schedule table and packaged interactive multi-task proposal for user approval.
</think>

"""
        advice_text = think_block + advice_text

    return {
        "content": advice_text,
        "action_type": "add_multiple_tasks",
        "action_payload": json.dumps({"tasks": tasks}),
        "action_status": "proposed"
    }
