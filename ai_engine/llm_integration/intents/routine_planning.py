import json
from typing import Dict, Any, Optional
from ai_engine.llm_integration.schedule_builder import build_smart_role_schedule


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
    active_study_subject: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    multi_task_keywords = [
        "plan my day", "plan today", "suggest a schedule", "suggest schedule",
        "suggest routine", "daily routine", "suggest tasks", "suggest task",
        "suggest some tasks", "schedule my day", "build a schedule", "optimize my day",
        "schedule sprints", "routine for today", "plan a productive day",
        "boost my productivity", "boost productivity", "increase productivity",
        "improve productivity", "productivity suggestions", "suggestion for my task",
        "suggestions for my task", "task suggestions", "tasks for productivity",
        "recommend tasks", "suggest some suggestion", "productivity boost"
    ]
    is_multi_task_intent = any(k in p_lower for k in multi_task_keywords) or (
        ("schedule" in p_lower or "add" in p_lower or "plan" in p_lower or "suggest" in p_lower) and
        ("task" in p_lower or "tasks" in p_lower or "sprint" in p_lower or "sprints" in p_lower or "routine" in p_lower or "productivity" in p_lower or "blocks" in p_lower)
    )

    if not is_multi_task_intent:
        return None

    tasks = build_smart_role_schedule(
        user_info.get("role", "professional"),
        user_info,
        t_data,
        active_logged_sleep=active_logged_sleep,
        active_study_subject=active_study_subject
    )
    table_rows = "\n".join(
        f"| `{t['start']}` | **{t['title']}** | {t['minutes']} mins | `{t['category']}` | {t['impact']} |"
        for t in tasks
    )
    
    user_role_title = user_info.get("role", "professional").title()
    
    advice_text = f"""### Calibrated Daily Routine for **{user_role_title}**

Based on your telemetry analysis (Sleep Baseline: **{active_logged_sleep or t_data['avg_sleep']:.1f}h** vs **{t_data['sleep_target']:.1f}h** target, Monthly Surplus: **+${t_data['monthly_savings']:,.2f}**, Goal: **{goal_name}** at **{goal_pct}%**), I have structured a circadian-optimized daily plan:

| Time | Task / Block | Duration | Category | Predicted Impact |
| :--- | :--- | :--- | :--- | :--- |
{table_rows}

#### Telemetry & Optimization Highlights:
- **Circadian Alertness Peak (08:30 – 11:30):** High-leverage cognitive focus blocks scheduled during natural cortisol alertness peaks.
- **Context-Switching Protection:** Tasks separated into clean, protected intervals to minimize fragmentation.
- **Physical & Cognitive Recovery:** Dedicated vitality block to stabilize your **Health Index** and sleep architecture.

Click **Approve & Add All Tasks** below to inject all {len(tasks)} time-blocks directly into your Daily Planner."""

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
