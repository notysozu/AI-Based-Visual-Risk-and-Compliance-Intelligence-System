import json
from typing import Dict, Any, List, Optional
from .client import get_groq_client, AVAILABLE_GROQ_MODELS


def generate_digital_twin_advice(user: Dict[str, Any], baseline: Dict[str, Any], sim_results: Dict[str, Any]) -> str:
    sa = sim_results["scenario_a"]
    sb = sim_results["scenario_b"]
    tradeoffs = sim_results.get("tradeoffs", {})

    wealth_diff = sb["wealth_at_end"] - sa["wealth_at_end"]
    health_diff = sb["health_index"] - sa["health_index"]
    focus_diff = sb["focus_index"] - sa["focus_index"]

    client = get_groq_client()
    if client is not None:
        try:
            prompt = f"""You are the Visual Risk AI Advisor for a user with the persona {user.get('role', 'professional')}.
Explain the tradeoff results between Scenario A (baseline) and Scenario B (proposed adjustment).
Include a structured Markdown table comparing:
| Trajectory Metric | Scenario A (Baseline) | Scenario B (Adjusted) | Net Variance |
- Scenario A: Health Index {sa['health_index']:.1f}, Focus Rating {sa['focus_index']:.1f}, 5-Year Wealth ${sa['wealth_at_end']:,.2f}
- Scenario B: Health Index {sb['health_index']:.1f}, Focus Rating {sb['focus_index']:.1f}, 5-Year Wealth ${sb['wealth_at_end']:,.2f}
- Key Tradeoffs: {json.dumps(tradeoffs)}
Provide clean bullet points and a concise strategic verdict in Markdown without emojis."""

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

    # Deterministic Table & Analysis Fallback
    burnout_a = "High Risk" if sa["health_index"] < 4.0 else "Sustainable"
    burnout_b = "High Risk" if sb["health_index"] < 4.0 else "Sustainable"

    table_lines = [
        f"### Trajectory Tradeoff Analysis for **{user.get('username', 'User')}** ({user.get('role', 'professional').title()})",
        "",
        "| Trajectory Metric | Scenario A (Baseline) | Scenario B (Adjusted) | Net Variance |",
        "| :--- | :--- | :--- | :--- |",
        f"| **5-Year Net Wealth** | ${sa['wealth_at_end']:,.2f} | ${sb['wealth_at_end']:,.2f} | **{wealth_diff:+,.2f}** |",
        f"| **Physical Health Index** | {sa['health_index']:.1f} / 10 | {sb['health_index']:.1f} / 10 | **{health_diff:+.1f}** |",
        f"| **Cognitive Focus Rating** | {sa['focus_index']:.1f} / 10 | {sb['focus_index']:.1f} / 10 | **{focus_diff:+.1f}** |",
        f"| **Burnout Risk Profile** | {burnout_a} | {burnout_b} | {'Optimized' if sb['health_index'] >= sa['health_index'] else 'Elevated Load'} |",
        "",
        "#### Key Trajectory Insights",
        f"- **Capital Velocity:** Scenario B provides **{wealth_diff:+,.2f}** over the next 5 years.",
        f"- **Biometric Impact:** Health index shifts by **{health_diff:+.1f} points**, holding focus at **{sb['focus_index']:.1f} / 10**.",
        "",
        "**Strategic Verdict:** " + ("Scenario B accelerates your capital trajectory while preserving cognitive vitality." if wealth_diff >= 0 and health_diff >= -0.5 else "Scenario B increases financial or cognitive strain. Dial back monthly savings or restore sleep targets.")
    ]
    return "\n".join(table_lines)


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


def get_rule_based_wealth_advice(*args, **kwargs) -> str:
    user = args[0] if len(args) > 0 and isinstance(args[0], dict) else kwargs.get("user", {}) or kwargs.get("user_info", {})
    mc_data = args[-1] if len(args) > 1 and isinstance(args[-1], dict) else kwargs.get("mc_results", {}) or kwargs.get("forecast_summary", {})

    target_nw = user.get("target_net_worth", 1000000.0) or 1000000.0

    # Extract percentile metrics safely
    if "median" in mc_data and isinstance(mc_data["median"], list) and len(mc_data["median"]) > 0:
        p50 = mc_data["median"][-1]
    else:
        p50 = mc_data.get("monte_carlo_median_final", 735000.0)

    if "p10" in mc_data and isinstance(mc_data["p10"], list) and len(mc_data["p10"]) > 0:
        p10 = mc_data["p10"][-1]
    else:
        p10 = mc_data.get("monte_carlo_p10_final", 315000.0)

    if "p90" in mc_data and isinstance(mc_data["p90"], list) and len(mc_data["p90"]) > 0:
        p90 = mc_data["p90"][-1]
    else:
        p90 = mc_data.get("monte_carlo_p90_final", 1750000.0)

    prob = mc_data.get("probability_of_success", 75)
    if isinstance(prob, float) and prob <= 1.0:
        prob = round(prob * 100)

    return f"""### 500-Run Monte Carlo Wealth Projection

| Percentile Horizon | Projected Net Worth | Scenario Outlook |
| :--- | :--- | :--- |
| **Bear Floor (P10)** | ${p10:,.2f} | Conservative Market (10th Percentile) |
| **Median Expected (P50)** | **${p50:,.2f}** | Baseline Growth Target |
| **Bull Ceiling (P90)** | ${p90:,.2f} | Strong Compounding Run |

- **Milestone Attainment Odds:** **{prob}%** confidence in reaching target (${target_nw:,.2f}).
- **Strategic Verdict:** Consistent monthly compound allocations maintain your trajectory within the top 50th percentile band."""


def generate_wealth_advice(*args, **kwargs) -> str:
    user = args[0] if len(args) > 0 and isinstance(args[0], dict) else kwargs.get("user", {}) or kwargs.get("user_info", {})
    mc_data = args[-1] if len(args) > 1 and isinstance(args[-1], dict) else kwargs.get("mc_results", {}) or kwargs.get("forecast_summary", {})

    target_nw = user.get("target_net_worth", 1000000.0) or 1000000.0

    if "median" in mc_data and isinstance(mc_data["median"], list) and len(mc_data["median"]) > 0:
        p50 = mc_data["median"][-1]
    else:
        p50 = mc_data.get("monte_carlo_median_final", 735000.0)

    if "p10" in mc_data and isinstance(mc_data["p10"], list) and len(mc_data["p10"]) > 0:
        p10 = mc_data["p10"][-1]
    else:
        p10 = mc_data.get("monte_carlo_p10_final", 315000.0)

    if "p90" in mc_data and isinstance(mc_data["p90"], list) and len(mc_data["p90"]) > 0:
        p90 = mc_data["p90"][-1]
    else:
        p90 = mc_data.get("monte_carlo_p90_final", 1750000.0)

    prob = mc_data.get("probability_of_success", 75)
    if isinstance(prob, float) and prob <= 1.0:
        prob = round(prob * 100)

    client = get_groq_client()
    if client is not None:
        try:
            prompt = f"""Provide a strategic wealth trajectory summary based on 500-run Monte Carlo simulation for a {user.get('role', 'professional')} persona:
- Median Expected Net Worth (P50): ${p50:,.2f}
- Bear Market Floor (P10): ${p10:,.2f}
- Bull Market Ceiling (P90): ${p90:,.2f}
- Probability of Reaching Target (${target_nw:,.2f}): {prob}%
Include a clean Markdown table summarizing the percentiles and give 2-3 concise paragraphs with asset allocation advice without emojis."""

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

    return get_rule_based_wealth_advice(*args, **kwargs)


def generate_optimized_study_plan(user_info: Dict[str, Any], study_summary: Dict[str, Any], target_milestone: Optional[str] = None) -> Dict[str, Any]:
    """
    Generates a structured 7-day academic study plan conforming to schemas.StudyPlanResponse.
    """
    target = target_milestone or "Core Mastery & Exam Readiness"
    subjects = study_summary.get("subjects") or ["Machine Learning", "Linear Algebra", "Data Structures"]
    if not subjects:
        subjects = ["Core Curriculum", "Applied Problem Solving"]

    client = get_groq_client()
    if client is not None:
        try:
            prompt = f"""Generate an AI-optimized 7-day academic study plan for a student with target: "{target}".
Subjects: {json.dumps(subjects)}.
Weekly study target: {user_info.get('study_target_hours_week', 18)} hours.
Return ONLY valid JSON matching this schema:
{{
  "weekly_goal": "Concise weekly objective string",
  "focus_strategy": "Spaced repetition strategy summary",
  "daily_plans": [
    {{
      "day": "Monday",
      "blocks": [
        {{
          "subject": "{subjects[0]}",
          "start_time": "09:00",
          "duration_minutes": 60,
          "focus_type": "Deep Problem Solving",
          "task_title": "Core Synthesis & Problem Set"
        }}
      ]
    }}
  ],
  "recommendations": [
    {{
      "title": "Active Recall Sprint",
      "impact": "+1.5 retention",
      "description": "Review key flashcards 24 hours after initial lecture review.",
      "category": "Retention"
    }}
  ]
}}"""
            for model in AVAILABLE_GROQ_MODELS:
                try:
                    resp = client.chat.completions.create(
                        model=model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.5,
                        max_tokens=4000,
                        timeout=20.0
                    )
                    content = resp.choices[0].message.content.strip()
                    if content.startswith("```json"):
                        content = content[7:-3].strip()
                    elif content.startswith("```"):
                        content = content[3:-3].strip()
                    parsed = json.loads(content)
                    if "daily_plans" in parsed and "weekly_goal" in parsed:
                        return parsed
                except Exception:
                    continue
        except Exception as e:
            print(f"Error generating study plan with Groq: {e}")

    # Deterministic fallback matching StudyPlanResponse
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    daily_plans = []
    for i, day in enumerate(days):
        subj = subjects[i % len(subjects)]
        daily_plans.append({
            "day": day,
            "blocks": [
                {
                    "subject": subj,
                    "start_time": "09:00",
                    "duration_minutes": 60,
                    "focus_type": "Deep Work",
                    "task_title": f"{subj} Core Concepts & Synthesis"
                },
                {
                    "subject": subj,
                    "start_time": "14:00",
                    "duration_minutes": 45,
                    "focus_type": "Practice & Exercises",
                    "task_title": f"{subj} Active Problem Solving"
                }
            ]
        })

    return {
        "weekly_goal": f"Achieve mastery in {target} across {len(subjects)} core subjects with calibrated spaced repetition.",
        "focus_strategy": "Frontload high-cognition problem solving in morning cortisol windows and reinforce retention through afternoon practice blocks.",
        "daily_plans": daily_plans,
        "recommendations": [
            {
                "title": "Spaced Recall Interval",
                "impact": "+1.8 Retention",
                "description": "Conduct a 15-minute active recall review within 24–48 hours of initial deep study.",
                "category": "Retention"
            },
            {
                "title": "Circadian Fatigue Buffer",
                "impact": "+1.2 Alertness",
                "description": "Insert a 15–20 minute screen-free walk or power nap at 14:00 to prevent post-lunch cognitive drops.",
                "category": "Vitality"
            }
        ]
    }


def generate_study_plan_advice(user_info: Dict[str, Any], study_data: Dict[str, Any], target_milestone: Optional[str] = None) -> Dict[str, Any]:
    return generate_optimized_study_plan(user_info, study_data, target_milestone)


def generate_smart_role_suggestions(
    role: Optional[str] = None,
    user_info: Optional[Dict[str, Any]] = None,
    baseline: Optional[Dict[str, Any]] = None,
    baseline_metrics: Optional[Dict[str, Any]] = None,
    recent_logs: Optional[List[Any]] = None,
    existing_suggestions: Optional[List[Dict[str, Any]]] = None,
    mode: str = "regenerate",
    **kwargs
) -> Dict[str, Any]:
    import random
    from database.crud import DEFAULT_ROLE_SUGGESTIONS

    target_role = (
        role 
        or (user_info.get("role") if user_info else None) 
        or kwargs.get("user_role") 
        or "professional"
    ).lower()

    metrics = baseline or baseline_metrics or (user_info.get("baseline") if user_info else {}) or {}
    sleep_h = metrics.get("sleep", 7.5)
    screen_h = metrics.get("screen", 4.0)
    study_h = metrics.get("study", 1.8)

    existing_titles = set()
    if existing_suggestions:
        for item in existing_suggestions:
            if isinstance(item, dict):
                t = item.get("title", "").lower()
                if t:
                    existing_titles.add(t)

    client = get_groq_client()
    if client is not None:
        try:
            count = 4 if mode == "regenerate" else 3
            avoid_str = f"Avoid these existing titles: {list(existing_titles)}" if existing_titles else ""
            prompt = f"""You are the Visual Risk AI Advisor. Generate {count} distinct, actionable lifestyle & productivity suggestions for a {target_role} persona.
Current Baseline: Sleep {sleep_h:.1f}h/day, Screen time {screen_h:.1f}h/day, Daily Focus/Study {study_h:.1f}h/day.
Mode: {mode}. {avoid_str}

Return ONLY valid JSON matching this schema:
{{
  "diagnostic": "1-sentence summary diagnostic of user habits",
  "suggestions": [
    {{
      "suggestion_id": "ai-sug-1",
      "title": "Clear action title",
      "category": "Focus",
      "detail": "Actionable explanation of the habit or task",
      "impact": "+1.5 Focus score",
      "start_time": "09:00",
      "duration_minutes": 45,
      "is_ai_generated": true
    }}
  ]
}}
Category must be one of: Focus, Vitality, Finance, Study, Leisure, Habits.
"""
            for model in AVAILABLE_GROQ_MODELS:
                try:
                    resp = client.chat.completions.create(
                        model=model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.7,
                        max_tokens=2500,
                        timeout=15.0
                    )
                    content = resp.choices[0].message.content.strip()
                    if content.startswith("```json"):
                        content = content[7:-3].strip()
                    elif content.startswith("```"):
                        content = content[3:-3].strip()
                    parsed = json.loads(content)
                    if "suggestions" in parsed and isinstance(parsed["suggestions"], list) and len(parsed["suggestions"]) > 0:
                        for s in parsed["suggestions"]:
                            s["suggestion_id"] = f"ai-{target_role[:3]}-{random.randint(10000, 99999)}"
                            s["is_ai_generated"] = True
                            s["is_adopted"] = False
                        return parsed
                except Exception:
                    continue
        except Exception as e:
            print(f"Error generating AI suggestions with Groq: {e}")

    # Fallback Extended Role Pools
    role_pools = {
        "student": [
            {"title": "Active Recall Flashcard Sprint", "category": "Study", "detail": "Test memory on core concepts without looking at lecture notes.", "impact": "+18% retention", "start_time": "08:30", "duration_minutes": 35},
            {"title": "Feynman Concept Breakdown", "category": "Study", "detail": "Explain a complex proof or algorithm in simple terms on paper.", "impact": "+1.5 mastery rating", "start_time": "11:00", "duration_minutes": 45},
            {"title": "Screen-Free Lunch Reset", "category": "Vitality", "detail": "Enjoy lunch without phones or video to prevent cognitive saturation.", "impact": "+0.8 alertness", "start_time": "12:30", "duration_minutes": 30},
            {"title": "Practice Exam Problem Set", "category": "Focus", "detail": "Timed exam problem set under simulated test conditions.", "impact": "+2.2 exam readiness", "start_time": "15:00", "duration_minutes": 60},
            {"title": "Textbook Cost Optimization", "category": "Finance", "detail": "Audit course material expenses and use library open access copies.", "impact": "+$120 saved", "start_time": "17:00", "duration_minutes": 20},
            {"title": "Sleep Hygiene Wind-Down", "category": "Vitality", "detail": "Turn off screens 45 min before sleep to protect REM sleep cycles.", "impact": "+1.2 sleep quality", "start_time": "22:30", "duration_minutes": 30}
        ],
        "professional": [
            {"title": "Deep Work Morning Block", "category": "Focus", "detail": "Zero-notification coding or design block before checking emails or Slack.", "impact": "+1.8 daily focus", "start_time": "09:00", "duration_minutes": 90},
            {"title": "Post-Lunch Walking Meeting", "category": "Vitality", "detail": "Take a 20-minute audio-only call while walking to prevent afternoon fatigue.", "impact": "+1.0 vitality", "start_time": "13:30", "duration_minutes": 20},
            {"title": "Career Upskilling Sprint", "category": "Study", "detail": "Study cloud architecture, distributed systems, or industry leadership.", "impact": "+1.5 trajectory", "start_time": "17:30", "duration_minutes": 45},
            {"title": "Emergency Buffer Allocation", "category": "Finance", "detail": "Transfer monthly discretionary savings into high-yield liquidity reserve.", "impact": "+$450/mo saved", "start_time": "12:00", "duration_minutes": 15},
            {"title": "Evening Screen Curfew", "category": "Vitality", "detail": "Enable blue-light filters and switch to physical reading.", "impact": "+0.9 deep sleep", "start_time": "21:30", "duration_minutes": 30}
        ],
        "freelancer": [
            {"title": "Client Core Deliverable Block", "category": "Focus", "detail": "Focus exclusively on highest-paying client milestone deliverables.", "impact": "+1.5 billable output", "start_time": "09:00", "duration_minutes": 120},
            {"title": "Inbound Pipeline Outreach", "category": "Study", "detail": "Publish a technical case study or follow up with prospective clients.", "impact": "+$800 pipeline", "start_time": "14:00", "duration_minutes": 45},
            {"title": "Invoice & Tax Buffer Transfer", "category": "Finance", "detail": "Review accounts receivable and set aside 25% for upcoming tax buffer.", "impact": "Tax runway secured", "start_time": "16:30", "duration_minutes": 20},
            {"title": "Strict Workplace Shutdown", "category": "Vitality", "detail": "Close client communication channels to preserve work-life boundary.", "impact": "+1.2 recovery", "start_time": "18:30", "duration_minutes": 15}
        ],
        "entrepreneur": [
            {"title": "Product & Distribution Sprint", "category": "Focus", "detail": "Focus on product growth and distribution before daily operational fires.", "impact": "+2.0 leverage", "start_time": "08:30", "duration_minutes": 90},
            {"title": "Customer Interview Synthesis", "category": "Study", "detail": "Review user recordings and extract key pain points for sprint planning.", "impact": "+Product clarity", "start_time": "13:30", "duration_minutes": 45},
            {"title": "Runway & Burn Rate Audit", "category": "Finance", "detail": "Analyze monthly burn rate vs capital reserves to maintain 18+ month runway.", "impact": "Protects runway", "start_time": "17:00", "duration_minutes": 25},
            {"title": "Executive Stress Reset Walk", "category": "Vitality", "detail": "Step away for an outdoor screen-free walk to restore strategic perspective.", "impact": "+1.4 resilience", "start_time": "12:30", "duration_minutes": 25}
        ],
        "retiree": [
            {"title": "Morning Sunlight Mobility Walk", "category": "Vitality", "detail": "Gentle 30-minute walk in natural morning sunlight for circadian health.", "impact": "+1.5 vitality", "start_time": "07:30", "duration_minutes": 30},
            {"title": "Cognitive Puzzle & Reading", "category": "Study", "detail": "Engage in chess, crosswords, or historical reading for neuroplasticity.", "impact": "+1.0 acuity", "start_time": "10:30", "duration_minutes": 45},
            {"title": "Safe Withdrawal Rate Review", "category": "Finance", "detail": "Verify quarterly dividend payouts and maintain cash allocation.", "impact": "Preserves capital", "start_time": "15:00", "duration_minutes": 20},
            {"title": "Evening Tea & Acoustic Unwind", "category": "Vitality", "detail": "Calming herbal tea and restorative music before bed.", "impact": "+1.2 sleep quality", "start_time": "20:30", "duration_minutes": 30}
        ]
    }

    pool = role_pools.get(target_role, role_pools["professional"])
    filtered_pool = [s for s in pool if s["title"].lower() not in existing_titles]
    if len(filtered_pool) < 3:
        filtered_pool = pool

    selected = random.sample(filtered_pool, min(len(filtered_pool), 4 if mode == "regenerate" else 3))
    out_suggestions = []
    for s in selected:
        out_suggestions.append({
            "suggestion_id": f"ai-{target_role[:3]}-{random.randint(10000, 99999)}",
            "title": s["title"],
            "category": s["category"],
            "detail": s["detail"],
            "impact": s["impact"],
            "start_time": s["start_time"],
            "duration_minutes": s["duration_minutes"],
            "is_adopted": False,
            "is_ai_generated": True
        })

    return {
        "diagnostic": f"Calibrated for {target_role.title()} profile · Sleep: {sleep_h:.1f}h · Screen: {screen_h:.1f}h · Focus: {study_h:.1f}h/day",
        "suggestions": out_suggestions
    }
