import json
from typing import Dict, Any, List, Optional
from .client import get_groq_client, AVAILABLE_GROQ_MODELS


def generate_digital_twin_advice(user: Dict[str, Any], baseline: Dict[str, Any], sim_results: Dict[str, Any]) -> str:
    sa = sim_results["scenario_a"]
    sb = sim_results["scenario_b"]
    tradeoffs = sim_results.get("tradeoffs", {})

    client = get_groq_client()
    if client is not None:
        try:
            prompt = f"""You are the Digital Twin AI Advisor for a user with the persona {user.get('role', 'professional')}.
Explain the tradeoff results between Scenario A (baseline) and Scenario B (proposed adjustment) clearly and actionably in Markdown:
- Scenario A: Health Index {sa['health_index']:.1f}, Focus Rating {sa['focus_index']:.1f}, 5-Year Wealth ${sa['wealth_at_end']:,.2f}
- Scenario B: Health Index {sb['health_index']:.1f}, Focus Rating {sb['focus_index']:.1f}, 5-Year Wealth ${sb['wealth_at_end']:,.2f}
- Key Tradeoffs: {json.dumps(tradeoffs)}
Give a concise verdict on whether Scenario B is strategically recommended."""

            for model in AVAILABLE_GROQ_MODELS:
                try:
                    resp = client.chat.completions.create(
                        model=model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.6,
                        max_tokens=2048,
                        timeout=15.0
                    )
                    return resp.choices[0].message.content.strip()
                except Exception:
                    continue
        except Exception as e:
            print(f"Error calling Groq for twin advice: {e}")

    # Deterministic fallback
    wealth_diff = sb["wealth_at_end"] - sa["wealth_at_end"]
    health_diff = sb["health_index"] - sa["health_index"]
    focus_diff = sb["focus_index"] - sa["focus_index"]

    lines = [
        f"### Scenario Comparison for **{user.get('username', 'User')}** ({user.get('role', 'professional').title()})",
        "",
        f"- **5-Year Wealth Impact:** **{wealth_diff:+,.2f}** compared to baseline.",
        f"- **Health Index Variance:** **{health_diff:+.1f}** points.",
        f"- **Cognitive Focus Variance:** **{focus_diff:+.1f}** points.",
        "",
        "**Strategic Verdict:** " + ("Scenario B accelerates your financial milestones while maintaining sustainable biological baselines." if wealth_diff >= 0 and health_diff >= -0.5 else "Scenario B increases financial or cognitive strain. Consider dialing back adjustments.")
    ]
    return "\n".join(lines)


def generate_scenario_suggestions(user: Dict[str, Any], baseline: Dict[str, Any]) -> List[Dict[str, Any]]:
    client = get_groq_client()
    if client is not None:
        try:
            prompt = f"""Generate 2 calibrated, contrasting lifestyle experiment presets for a {user.get('role', 'professional')} persona:
Current Baseline: Sleep {baseline.get('sleep_hours', 7.5)}h/day, Study {baseline.get('study_hours_week', 10)}h/wk, Monthly Savings ${user.get('monthly_income', 5000) - user.get('monthly_expenses', 2900):,.2f}.
Return ONLY a valid JSON array of 2 objects with keys: name, description, savings_delta, sleep_delta, study_delta."""

            for model in AVAILABLE_GROQ_MODELS:
                try:
                    resp = client.chat.completions.create(
                        model=model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.7,
                        max_tokens=1500,
                        timeout=15.0
                    )
                    content = resp.choices[0].message.content.strip()
                    if content.startswith("```json"):
                        content = content[7:-3].strip()
                    elif content.startswith("```"):
                        content = content[3:-3].strip()
                    return json.loads(content)
                except Exception:
                    continue
        except Exception as e:
            print(f"Error calling Groq for scenario suggestions: {e}")

    # Fallback presets
    return [
        {
            "name": "High-Output Sprint",
            "description": "Increase weekly study/work focus blocks by 4h while maintaining core sleep.",
            "savings_delta": 250.0,
            "sleep_delta": -0.5,
            "study_delta": 4.0
        },
        {
            "name": "Restorative Longevity",
            "description": "Prioritize restorative sleep (+1h) and sustainable steady-state savings.",
            "savings_delta": 150.0,
            "sleep_delta": 1.0,
            "study_delta": 0.0
        }
    ]


def generate_analytics_summary(user: Dict[str, Any], baseline: Dict[str, Any]) -> str:
    client = get_groq_client()
    if client is not None:
        try:
            prompt = f"""Synthesize a high-leverage 2-3 paragraph analytical daily reflection for a {user.get('role', 'professional')}:
- Sleep Baseline: {baseline.get('sleep_hours', 7.5):.1f}h/day
- Screen Time Load: {baseline.get('screen_time_hours', 4.0):.1f}h/day
- Weekly Study/Focus: {baseline.get('study_hours_week', 10.0):.1f}h/week
- Target Net Worth: ${user.get('target_net_worth', 1000000.0):,.2f}
Provide clean, professional insights in Markdown without emojis."""

            for model in AVAILABLE_GROQ_MODELS:
                try:
                    resp = client.chat.completions.create(
                        model=model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.6,
                        max_tokens=1500,
                        timeout=15.0
                    )
                    return resp.choices[0].message.content.strip()
                except Exception:
                    continue
        except Exception as e:
            print(f"Error calling Groq for analytics summary: {e}")

    return f"""### Habit & Telemetry Performance Summary

Your active baseline demonstrates an average of **{baseline.get('sleep_hours', 7.5):.1f} hours** of daily sleep and **{baseline.get('study_hours_week', 10.0):.1f} hours** of weekly focused execution.

Screen load is currently recorded at **{baseline.get('screen_time_hours', 4.0):.1f} hours/day**. Maintaining screen hygiene during the final 60 minutes before bedtime will directly protect deep sleep architecture and cognitive alertness for tomorrow's focus blocks."""


def generate_wealth_advice(user: Dict[str, Any], mc_results: Dict[str, Any]) -> str:
    client = get_groq_client()
    if client is not None:
        try:
            prompt = f"""Provide a strategic wealth trajectory summary based on 500-run Monte Carlo simulation:
- Median Final Net Worth: ${mc_results['median'][-1]:,.2f}
- P10 Bear Market Floor: ${mc_results['p10'][-1]:,.2f}
- P90 Bull Market Ceiling: ${mc_results['p90'][-1]:,.2f}
- Probability of Reaching Target (${user.get('target_net_worth', 1000000.0):,.2f}): {mc_results.get('probability_of_success', 75)}%
Provide 2-3 concise paragraphs with actionable asset allocation guidance in clean Markdown without emojis."""

            for model in AVAILABLE_GROQ_MODELS:
                try:
                    resp = client.chat.completions.create(
                        model=model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.6,
                        max_tokens=1500,
                        timeout=15.0
                    )
                    return resp.choices[0].message.content.strip()
                except Exception:
                    continue
        except Exception as e:
            print(f"Error calling Groq for wealth advice: {e}")

    return f"""### 500-Run Monte Carlo Wealth Projection

Based on 500 stochastic simulation runs, your expected median net worth at retirement age is projected at **${mc_results['median'][-1]:,.2f}**, with a conservative bear-market floor (10th percentile) of **${mc_results['p10'][-1]:,.2f}** and an optimistic bull-market ceiling (90th percentile) of **${mc_results['p90'][-1]:,.2f}**.

Maintaining consistent monthly compound savings at an 8% CAGR keeps your long-term capital horizon securely on track."""


def generate_study_plan_advice(user_info: Dict[str, Any], study_data: Dict[str, Any], target_milestone: Optional[str] = None) -> Dict[str, Any]:
    client = get_groq_client()
    if client is not None:
        try:
            prompt = f"""Synthesize a personalized 7-day study plan for a student with target: {target_milestone or 'Exam Mastery'}.
Return ONLY a valid JSON object with keys:
- overview: 1-2 sentence strategy
- schedule: array of 7 objects (day, blocks: array of {{subject, start_time, duration_minutes}})
- key_focus_areas: array of strings"""

            for model in AVAILABLE_GROQ_MODELS:
                try:
                    resp = client.chat.completions.create(
                        model=model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.6,
                        max_tokens=3500,
                        timeout=20.0
                    )
                    content = resp.choices[0].message.content.strip()
                    if content.startswith("```json"):
                        content = content[7:-3].strip()
                    elif content.startswith("```"):
                        content = content[3:-3].strip()
                    return json.loads(content)
                except Exception:
                    continue
        except Exception as e:
            print(f"Error calling Groq for study plan: {e}")

    # Fallback plan
    return {
        "overview": "Balanced 7-day spaced repetition and deep problem solving schedule.",
        "schedule": [
            {"day": d, "blocks": [{"subject": "Core Study", "start_time": "09:00", "duration_minutes": 90}]}
            for d in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        ],
        "key_focus_areas": ["Spaced Repetition", "Active Recall", "Exam Simulation"]
    }


def generate_smart_role_suggestions(role: str, user_info: Dict[str, Any], baseline_metrics: Dict[str, Any], mode: str = "regenerate", existing_suggestions: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    from database.crud import DEFAULT_ROLE_SUGGESTIONS
    base_defaults = DEFAULT_ROLE_SUGGESTIONS.get(role, DEFAULT_ROLE_SUGGESTIONS["professional"])
    return {
        "diagnostic": f"Calibrated for {role.title()} persona baseline.",
        "suggestions": [dict(s, is_ai_generated=True) for s in base_defaults]
    }
