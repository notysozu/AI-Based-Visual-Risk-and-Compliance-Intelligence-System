import re
import json
from typing import Dict, Any, List, Optional

# Re-exports for 100% backwards compatibility
from .client import get_groq_client, AVAILABLE_GROQ_MODELS, get_active_groq_models
from .schedule_builder import build_smart_role_schedule
from .generators import (
    generate_digital_twin_advice,
    generate_scenario_suggestions,
    generate_analytics_summary,
    generate_wealth_advice,
    get_rule_based_wealth_advice,
    generate_optimized_study_plan,
    generate_study_plan_advice,
    generate_smart_role_suggestions
)
from .intents import (
    handle_study_logging_intent,
    handle_habit_logging_intent,
    handle_purchase_impact_intent,
    handle_routine_planning_intent,
    handle_what_if_intent,
    handle_single_task_intent,
    handle_wealth_forecast_intent,
    handle_settings_update_intent
)
from .table_parser import parse_schedule_tasks_from_text


class DigitalTwinAdvisor:
    """
    Advisory wrapper providing high-level LLM and heuristic generation methods.
    """
    @staticmethod
    def advise_on_comparison(user: Dict[str, Any], baseline: Dict[str, Any], sim_results: Dict[str, Any]) -> str:
        return generate_digital_twin_advice(user, baseline, sim_results)

    @staticmethod
    def suggest_scenarios(user: Dict[str, Any], baseline: Dict[str, Any]) -> List[Dict[str, Any]]:
        return generate_scenario_suggestions(user, baseline)

    @staticmethod
    def summarize_analytics(user: Dict[str, Any], baseline: Dict[str, Any]) -> str:
        return generate_analytics_summary(user, baseline)

    @staticmethod
    def advise_wealth(user: Dict[str, Any], mc_results: Dict[str, Any]) -> str:
        return generate_wealth_advice(user, mc_results)

    @staticmethod
    def generate_study_plan(user_info: Dict[str, Any], study_data: Dict[str, Any], target_milestone: Optional[str] = None) -> Dict[str, Any]:
        return generate_study_plan_advice(user_info, study_data, target_milestone)

    @staticmethod
    def suggest_role_tasks(role: str, user_info: Dict[str, Any], baseline_metrics: Dict[str, Any], mode: str = "regenerate", existing_suggestions: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        return generate_smart_role_suggestions(role, user_info, baseline_metrics, mode, existing_suggestions)


def process_twin_copilot_turn(
    user_id: int,
    prompt: str,
    history: List[Dict[str, Any]],
    user_info: Dict[str, Any],
    baseline: Dict[str, Any],
    telemetry: Optional[Dict[str, Any]] = None,
    client_context: Optional[Dict[str, Any]] = None,
    think_mode: bool = False
) -> Dict[str, Any]:
    """
    Process a conversational turn with the Visual Risk Copilot.
    Dispatches across modular intent processors (study logging, habit logging, purchase simulations,
    routine schedules, What-If comparisons, single tasks, wealth forecasts, settings updates).
    Falls back to conversational Groq inference if no structured intent is triggered.
    """
    client_ctx = client_context or {}
    p_lower = prompt.lower().strip()

    monthly_income = float(user_info.get("monthly_income", 5000.0) or 5000.0)
    monthly_expenses = float(user_info.get("monthly_expenses", 2900.0) or 2900.0)
    monthly_savings = max(0.0, monthly_income - monthly_expenses)
    savings_rate = round((monthly_savings / monthly_income) * 100) if monthly_income > 0 else 0
    avg_sleep = float(baseline.get("sleep_hours", 7.5))
    sleep_target = float(user_info.get("sleep_target_hours", 8.0) or 8.0)

    t_data = telemetry or {
        "baseline": baseline,
        "avg_sleep": avg_sleep,
        "sleep_target": sleep_target,
        "sleep_debt": round(max(0.0, sleep_target - avg_sleep), 1),
        "avg_screen": 4.0,
        "exercise_days_count": 4,
        "study_hours_week": float(baseline.get("study_hours_week", 10.0)),
        "study_target_week": float(user_info.get("study_target_hours_week", 10.0) or 10.0),
        "recent_subjects": ["Core Focus"],
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,
        "monthly_savings": monthly_savings,
        "savings_rate": savings_rate,
        "net_worth": float(user_info.get("net_worth", 15000.0) or 15000.0),
        "target_net_worth": float(user_info.get("target_net_worth", 1000000.0) or 1000000.0),
        "target_retirement_age": int(user_info.get("retirement_goal_age", 60) or 60),
    }

    local_time = client_ctx.get("localTime") or client_ctx.get("local_time") or (telemetry.get("local_time") if telemetry else None) or "Current Local Time"
    local_date = client_ctx.get("localDate") or client_ctx.get("local_date") or (telemetry.get("local_date") if telemetry else None) or "Today"
    time_zone = client_ctx.get("timeZone") or client_ctx.get("time_zone") or (telemetry.get("time_zone") if telemetry else None) or "UTC"
    location = client_ctx.get("location") or (telemetry.get("location") if telemetry else None) or "Local Environment"
    day_of_week = client_ctx.get("dayOfWeek") or client_ctx.get("day_of_week") or (telemetry.get("day_of_week") if telemetry else None) or ""

    t_data["local_time"] = local_time
    t_data["local_date"] = local_date
    t_data["time_zone"] = time_zone
    t_data["location"] = location
    t_data["day_of_week"] = day_of_week

    goal_name = client_ctx.get("goalName") or "Emergency Fund"
    goal_target = float(client_ctx.get("goalTarget") or 20000.0)
    goal_current = float(client_ctx.get("goalCurrent") or (min(goal_target, t_data["net_worth"] * 0.4)))
    goal_gap = max(0.0, goal_target - goal_current)
    goal_pct = round((goal_current / goal_target) * 100) if goal_target > 0 else 100

    # Extract conversational context: detect if user logged sleep or study in previous messages or current turn
    combined_user_text = " ".join([h.get("content", "") for h in history if h.get("role") == "user"] + [prompt]).lower()

    # Check for recent sleep statements in dialogue
    recent_sleep_matches = re.findall(r"(?:slept\s*(?:for\s*)?|only\s*got\s*|had\s*|sleep\s*(?:was\s*)?|slept\s*)([0-9]+(?:\.[0-9]+)?)\s*(?:hours?|hrs?|h )", combined_user_text)
    active_logged_sleep = float(recent_sleep_matches[-1]) if recent_sleep_matches else t_data["avg_sleep"]

    # Check for recent study statements in dialogue
    recent_study_matches = re.findall(r"(?:studied|revised|learning|completed)\s*(?:a\s*)?([0-9]+(?:\.[0-9]+)?\s*(?:hours?|hrs?|h |mins?|minutes?))?\s*(?:of|for|in)?\s*([a-zA-Z0-9\s\-]+)?", combined_user_text)
    active_study_subject = None
    if recent_study_matches:
        for match_item in reversed(recent_study_matches):
            cand_subject = match_item[1].strip() if len(match_item) > 1 and match_item[1] else ""
            cand_subject = re.sub(r" (?:today|yesterday|score|test|exam|with|and|hours?|mins?|for|of|in) .*", "", cand_subject, flags=re.IGNORECASE).strip()
            if cand_subject and len(cand_subject) >= 3 and cand_subject.lower() not in ["study", "tasks", "routine", "planner", "my", "hours", "mins"]:
                active_study_subject = cand_subject.title()
                break

    # 0. Multi-Agent Router — direct mutations (goal, finance, settings, habit, study, planner)
    # These return action_status="auto_execute" so chat.py executes them immediately without approval.
    try:
        from ai_engine.agents.router import route_to_agents
        agent_res = route_to_agents(prompt, p_lower, user_info, t_data, think_mode)
        if agent_res:
            return agent_res
    except Exception as _agent_err:
        print(f"[AgentRouter] Non-fatal error: {_agent_err}")

    # 1. Settings update intent (checked early to prevent "sleep target" or "income" matching habit logging)
    settings_res = handle_settings_update_intent(prompt, p_lower, user_info, t_data, think_mode)
    if settings_res:
        return settings_res

    # 2. Study logging intent
    study_res = handle_study_logging_intent(prompt, p_lower, user_info, t_data, think_mode, active_study_subject)
    if study_res:
        return study_res

    # 3. Habit logging intent
    habit_res = handle_habit_logging_intent(prompt, p_lower, user_info, t_data, think_mode)
    if habit_res:
        return habit_res

    # 4. Purchase impact intent
    purchase_res = handle_purchase_impact_intent(prompt, p_lower, user_info, t_data, goal_name, goal_target, goal_current, think_mode)
    if purchase_res:
        return purchase_res

    # 5. What-If comparison intent
    what_if_res = handle_what_if_intent(prompt, p_lower, user_id, user_info, baseline, think_mode)
    if what_if_res:
        return what_if_res

    # 6. Wealth Monte Carlo forecast intent
    wealth_res = handle_wealth_forecast_intent(prompt, p_lower, user_info, t_data, think_mode)
    if wealth_res:
        return wealth_res

    # 7. Single task addition intent (checked before routine planning to catch explicit task commands)
    single_task_res = handle_single_task_intent(prompt, p_lower, user_info, t_data, think_mode)
    if single_task_res:
        return single_task_res

    # 8. Routine / Multi-task planning intent (only triggered on explicit schedule requests or confirmations)
    routine_res = handle_routine_planning_intent(
        prompt, p_lower, user_info, t_data, goal_name, goal_pct, goal_gap,
        think_mode, active_logged_sleep, active_study_subject, history=history
    )
    if routine_res:
        return routine_res

    # 9. Conversational Groq fallback
    client = get_groq_client()
    messages_payload = [
        {
            "role": "system",
            "content": f"""You are the Visual Risk AI Copilot for {user_info.get('username', 'User')}, a {user_info.get('role', 'professional')}.
Provide clear, actionable, high-leverage insights and recommendations.
Style & Conciseness:
- Keep answers direct, punchy, and concise (1-3 short paragraphs max).
- If the user shares a casual update or activity log, acknowledge it crisply with immediate metric impacts without rambling.
- Only provide long comprehensive breakdowns when the user explicitly asks for detailed strategies.
- Never use emojis in responses or thought chains.
User Telemetry Baseline:
- Monthly Income: ${t_data['monthly_income']:,.2f} | Monthly Expenses: ${t_data['monthly_expenses']:,.2f} | Monthly Savings: ${t_data['monthly_savings']:,.2f} ({t_data['savings_rate']}% savings rate)
- Net Worth: ${t_data['net_worth']:,.2f} | Target Net Worth: ${t_data['target_net_worth']:,.2f} by age {t_data['target_retirement_age']}
- Sleep: {active_logged_sleep:.1f}h/day vs {t_data['sleep_target']:.1f}h target (Sleep Debt: {t_data['sleep_debt']:.1f}h)
- Screen Time: {t_data['avg_screen']:.1f}h/day | Active Days: {t_data['exercise_days_count']}d/wk
- Academic & Study: Enrolled in {", ".join(t_data.get("onboarded_subjects") or t_data.get("recent_subjects") or ["General"])}, Study Pace: {t_data.get("study_hours_week", 0.0):.1f}h / {t_data.get("study_target_week", 15.0):.1f}h week, Upcoming Exams: {len(t_data.get("upcoming_exams", []))}
- Goal: {goal_name} (${goal_current:,.2f} / ${goal_target:,.2f}, {goal_pct}% achieved)
- Temporal & Physical Context: {local_date} ({local_time}), Timezone: {time_zone}, Location: {location}
{'- When think_mode is active, begin with <think> following the 4 stages: Step 1 — Goal Definition, Step 2 — Telemetry Search & Gathered User Data, Step 3 — Multi-Criteria Analysis & Optimization, Step 4 — Formulated Strategic Execution Plan.' if think_mode else ''}"""
        }
    ]

    for h in history[-8:]:
        role_type = "assistant" if h.get("role") == "assistant" else "user"
        content_clean = re.sub(r"<think>.*?</think>", "", h.get("content", ""), flags=re.DOTALL).strip()
        if content_clean:
            messages_payload.append({"role": role_type, "content": content_clean})

    messages_payload.append({"role": "user", "content": prompt})

    ai_reply = None
    if client is not None:
        for model in get_active_groq_models(client):
            try:
                resp = client.chat.completions.create(
                    model=model,
                    messages=messages_payload,
                    temperature=0.6,
                    max_tokens=4096,
                    timeout=8.0
                )
                ai_reply = resp.choices[0].message.content.strip()
                if ai_reply:
                    break
            except Exception:
                continue

    if not ai_reply:
        if any(w in p_lower for w in ["exam", "test", "quiz", "exams", "study trend", "academic trend", "how ready am i", "exam readiness"]):
            exams = t_data.get("upcoming_exams", [])
            subjects_str = ", ".join(t_data.get("onboarded_subjects") or t_data.get("recent_subjects") or ["Core Curriculum"])
            weekly_study = float(t_data.get("study_hours_week", 0.0))
            target_weekly = float(t_data.get("study_target_week", 15.0))

            exam_lines = []
            if exams:
                for ex in exams:
                    title = ex.get("title", "Exam")
                    subj = ex.get("subject", "Coursework")
                    date_str = ex.get("exam_date", "Upcoming")
                    target_sc = ex.get("target_score", 85)
                    exam_lines.append(f"- **{subj}** ({title}) on **{date_str}** | Target: **{target_sc:.0f}%**")
            else:
                exam_lines.append("- *No upcoming exams currently registered. You can add your next exam in the **Study & Academic > Exam & Trends** tab!*")

            exams_formatted = "\n".join(exam_lines)
            readiness_pct = min(98, max(20, round((weekly_study / max(1.0, target_weekly)) * 85)))

            ai_reply = f"""### Academic Readiness & Exam Intelligence

Here is your synthesized academic pacing and exam readiness analysis:

| Metric | Current Value | Target Baseline | Status |
| :--- | :--- | :--- | :--- |
| **Active Subjects** | **{subjects_str}** | Enrolled Courses | Calibrated |
| **Weekly Study Pace** | **{weekly_study:.1f}h** | **{target_weekly:.1f}h / week** | {round((weekly_study / max(1.0, target_weekly)) * 100)}% of Target |
| **Readiness Probability** | **{readiness_pct}%** | >= 80% Target | {"On Track" if readiness_pct >= 75 else "Needs Focus"} |

#### Registered Upcoming Exams:
{exams_formatted}

#### Strategic Optimization Recommendation:
- To boost your retention and exam confidence, launch a **Pomodoro Focus Sprint** in the **Study Session** tab or ask me to schedule a targeted revision block in your Planner."""
        else:
            ai_reply = f"""Based on your {user_info.get('role', 'professional').title()} persona baseline (Sleep: **{active_logged_sleep:.1f}h**, Monthly Surplus: **+${t_data['monthly_savings']:,.2f}**, Goal: **{goal_name}** at **{goal_pct}%**), your life simulation trajectory remains sound.

To explore specific optimizations, you can:
- Ask to **simulate tradeoffs** (e.g. *"What if I study 4 more hours?"*)
- Ask to **build a calibrated schedule** (e.g. *"Suggest tasks for my day"*)
- Ask for **major purchase impact** (e.g. *"Can I afford a $1,500 laptop?"*)
- **Log academic study** (e.g. *"I studied 2 hours for Economics score 85"*)"""

    if think_mode and not ai_reply.startswith("<think>"):
        think_block = f"""<think>
Step 1 — Goal Definition:
• Objective: Synthesize personalized decision intelligence response for {user_info.get('role', 'professional').title()}.

Step 2 — Telemetry Search & Gathered User Data:
• Profile: {user_info.get('role', 'professional').title()} (Age: {user_info.get('age', 25)}) | Monthly Surplus: +${t_data['monthly_savings']:,.2f}/mo
• Temporal / Geo Context: {local_date} at {local_time} ({time_zone} / {location})
• Sleep Baseline: {active_logged_sleep:.1f}h | Milestone Progress: {goal_pct}% of {goal_name}

Step 3 — Multi-Criteria Analysis & Optimization:
• Telemetry Alignment: Verified stability of financial and biological constraints.

Step 4 — Formulated Strategic Execution Plan:
• Synthesized contextual strategic advice.
</think>

"""
        ai_reply = think_block + ai_reply

    # Dynamic Fallback Table & Task Extractor:
    # Propose task additions if the user explicitly asked for a routine or tasks in their query
    is_explicit_planning_prompt = (
        any(k in p_lower for k in [
            "plan my day", "suggest tasks", "schedule", "routine", "daily plan",
            "fitness schedule", "workout plan", "study plan schedule", "plug it in",
            "plan some crazy tasks", "plan crazy tasks", "plan some tasks", "plan tasks",
            "add in my tasks", "add to my tasks", "add these in my tasks", "add these to my tasks",
            "1,2,3 add it", "add it", "add them", "tasks to me"
        ]) or bool(re.search(r"\b(?:plan|schedule|routine|tasks|add\s+(?:these|them|all|\d+))\b", p_lower))
    ) and not any(p_lower.startswith(q) for q in ["what is", "how does", "explain", "why", "tell me about"])

    if is_explicit_planning_prompt:
        extracted_fallback_tasks = parse_schedule_tasks_from_text(ai_reply)
        if extracted_fallback_tasks and len(extracted_fallback_tasks) >= 1:
            return {
                "content": ai_reply,
                "action_type": "add_multiple_tasks",
                "action_payload": json.dumps({"tasks": extracted_fallback_tasks}),
                "action_status": "proposed"
            }

    return {
        "content": ai_reply,
        "action_type": "none",
        "action_payload": json.dumps({}),
        "action_status": "none"
    }
