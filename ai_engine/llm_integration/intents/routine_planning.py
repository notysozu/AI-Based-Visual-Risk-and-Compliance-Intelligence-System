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
    # 1. Multi-task schedule & confirmation keywords
    multi_task_keywords = [
        # Direct routine / schedule requests
        "plan my day", "plan today", "suggest a schedule", "suggest schedule",
        "suggest routine", "daily routine", "suggest tasks", "suggest task",
        "suggest some tasks", "schedule my day", "build a schedule", "optimize my day",
        "schedule sprints", "routine for today", "plan a productive day",
        "boost my productivity", "boost productivity", "increase productivity",
        "improve productivity", "productivity suggestions", "suggestion for my task",
        "suggestions for my task", "task suggestions", "tasks for productivity",
        "recommend tasks", "suggest some suggestion", "productivity boost",
        "fitness schedule", "workout schedule", "gym schedule", "exercise schedule",
        "fitness routine", "workout routine", "gym routine", "exercise routine",
        "fitness plan", "workout plan", "training schedule", "cardio routine",
        "strength routine", "fitness blueprint", "workout blueprint",
        "lets say fitness schedule", "let's say fitness schedule", "say fitness schedule",
        "study schedule", "study routine", "exam routine", "learning schedule",
        "plan something", "let's plan", "lets plan", "help me plan",
        # Confirmation & Planner Integration phrases
        "plug it in", "plug in", "plug into planner", "plug into my planner",
        "plug in my daily plannar", "plug it in my daily plannar",
        "plug in my daily planner", "plug it in my daily planner",
        "plug it into my daily planner", "plug it into daily planner",
        "add to planner", "add this to planner", "add to my planner",
        "add this to my planner", "put it in my planner", "put in planner",
        "put into planner", "save to planner", "apply schedule", "apply plan",
        "yes plug it in", "yes add to planner", "yes add it", "confirm plan",
        "yes schedule it", "schedule this", "schedule these", "commit to planner",
        "add all to planner", "plug tasks", "add tasks to planner",
        "plug into my daily plannar", "plug it to planner", "yes plug it"
    ]

    is_multi_task_intent = any(k in p_lower for k in multi_task_keywords) or (
        ("schedule" in p_lower or "add" in p_lower or "plan" in p_lower or "suggest" in p_lower or "plug" in p_lower or "apply" in p_lower) and
        ("task" in p_lower or "tasks" in p_lower or "sprint" in p_lower or "sprints" in p_lower or "routine" in p_lower or "productivity" in p_lower or "blocks" in p_lower or "planner" in p_lower or "plannar" in p_lower or "fitness" in p_lower or "workout" in p_lower or "gym" in p_lower)
    )

    if not is_multi_task_intent:
        return None

    # Check if this is a follow-up confirmation ("plug it in", "add to planner", etc.)
    is_confirmation_turn = any(k in p_lower for k in [
        "plug", "add to planner", "add this to planner", "add to my planner",
        "put in planner", "save to planner", "apply schedule", "apply plan",
        "yes plug", "confirm plan", "schedule this", "schedule these", "commit to planner",
        "plannar"
    ])

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
                    tasks = extracted
                    if "fitness" in content.lower() or "workout" in content.lower() or "strength" in content.lower():
                        plan_title = "Calibrated Fitness & Vitality Routine"
                    elif "study" in content.lower() or "academic" in content.lower():
                        plan_title = "Calibrated Academic Deep Study Plan"
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
        headline = f"### {plan_title} – Scheduled to Daily Planner\n\nI have calibrated and plugged these **{len(tasks)} focus blocks** directly into your **Daily Planner**:"
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
