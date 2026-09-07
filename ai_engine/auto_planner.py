import re
import json
import time
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from ai_engine.llm_integration.client import get_groq_client, get_active_groq_models


# Role-tailored circadian template seeds for 100% deterministic fallback
ROLE_CIRCADIAN_TEMPLATES: Dict[str, List[Dict[str, Any]]] = {
    "student": [
        {
            "title": "Morning Academic Deep Study Sprint",
            "category": "Study",
            "start": "08:30",
            "minutes": 90,
            "impact": "+1.2 Focus",
            "detail": "High-alertness circadian window dedicated to primary coursework problem sets."
        },
        {
            "title": "Campus Lecture Review & Notes Consolidation",
            "category": "Exams",
            "start": "13:30",
            "minutes": 45,
            "impact": "+0.8 Retention",
            "detail": "Active recall synthesis of today's key academic lecture topics."
        },
        {
            "title": "Post-Study Cardiovascular Walk & Sunlight",
            "category": "Health",
            "start": "16:45",
            "minutes": 30,
            "impact": "+0.6 Mood",
            "detail": "Mental reset and dopamine rebalance between cognitive blocks."
        },
        {
            "title": "Evening Budget & Pocket Money Audit",
            "category": "Money",
            "start": "19:30",
            "minutes": 15,
            "impact": "+3% Savings",
            "detail": "Daily expense tracking to preserve student budget runway."
        },
        {
            "title": "Circadian Wind-Down & Blue Light Cutoff",
            "category": "Health",
            "start": "22:15",
            "minutes": 30,
            "impact": "+1.0 Sleep",
            "detail": "Screen cutoff and light stretching for optimal REM sleep architecture."
        }
    ],
    "professional": [
        {
            "title": "Core Analytical Deep Work Sprint",
            "category": "Work",
            "start": "09:00",
            "minutes": 90,
            "impact": "+1.4 Productivity",
            "detail": "Zero-interruption focus block during peak morning cortisol alertness."
        },
        {
            "title": "Strategic Deliverables & Architecture Review",
            "category": "Career",
            "start": "14:00",
            "minutes": 60,
            "impact": "+0.9 Leverage",
            "detail": "High-impact execution on key project milestones and team alignments."
        },
        {
            "title": "Dedicated Technical Upskilling Block",
            "category": "Upskilling",
            "start": "17:00",
            "minutes": 45,
            "impact": "+0.7 Career",
            "detail": "Focused practice on emerging engineering frameworks and architectures."
        },
        {
            "title": "Daily Cash Flow & Portfolio Milestone Check",
            "category": "Finance",
            "start": "18:45",
            "minutes": 15,
            "impact": "+Compounding",
            "detail": "Track daily savings rate against target retirement compounding curve."
        },
        {
            "title": "Recovery Movement & Decompression Walk",
            "category": "Health",
            "start": "19:30",
            "minutes": 30,
            "impact": "+0.8 Well-being",
            "detail": "Cardiovascular movement to clear metabolic fatigue."
        }
    ],
    "freelancer": [
        {
            "title": "Client Deliverable Deep Work Sprint",
            "category": "Client Work",
            "start": "09:00",
            "minutes": 90,
            "impact": "+1.5 Billable",
            "detail": "High-rate project execution before opening communications or email."
        },
        {
            "title": "Secondary Client Milestone & Revisions",
            "category": "Projects",
            "start": "13:30",
            "minutes": 60,
            "impact": "+1.0 Velocity",
            "detail": "Focused polishing of milestone deliverables and client reviews."
        },
        {
            "title": "Invoices, Proposals & Pipeline Admin",
            "category": "Admin",
            "start": "16:00",
            "minutes": 30,
            "impact": "+Cash Velocity",
            "detail": "Review receivables, send pending invoices, and update project pipeline."
        },
        {
            "title": "High-Rate Skill Mastery & Portfolio Building",
            "category": "Upskilling",
            "start": "17:15",
            "minutes": 45,
            "impact": "+Rate Power",
            "detail": "Sharpen specialized capabilities to increase effective hourly rate."
        },
        {
            "title": "Circadian Rest & Physical Reset",
            "category": "Health",
            "start": "19:00",
            "minutes": 30,
            "impact": "+0.7 Energy",
            "detail": "Physical exercise to mitigate screen fatigue."
        }
    ],
    "entrepreneur": [
        {
            "title": "Founder Leverage & Product Architecture Sprint",
            "category": "Product",
            "start": "08:30",
            "minutes": 90,
            "impact": "+2.0 Leverage",
            "detail": "Highest leverage product roadmap and technical architecture block."
        },
        {
            "title": "Growth Funnel & Customer Traction Sprint",
            "category": "Growth",
            "start": "13:30",
            "minutes": 60,
            "impact": "+Revenue Velocity",
            "detail": "Active user acquisition reviews, conversion experiments, and outreach."
        },
        {
            "title": "Operations & Financial Runway Audit",
            "category": "Operations",
            "start": "16:00",
            "minutes": 30,
            "impact": "+Runway Health",
            "detail": "Monitor capital burn rate, SaaS costs, and cash runway targets."
        },
        {
            "title": "Team Synchronization & Delegation Check",
            "category": "Team",
            "start": "17:00",
            "minutes": 30,
            "impact": "+Alignment",
            "detail": "Unblock team bottlenecks and align tomorrow's sprint targets."
        },
        {
            "title": "High-Intensity Physical Conditioning",
            "category": "Health",
            "start": "18:30",
            "minutes": 45,
            "impact": "+Longevity",
            "detail": "Physical training to maximize cognitive resilience and stress tolerance."
        }
    ],
    "retiree": [
        {
            "title": "Morning Sunshine & Mobility Walk",
            "category": "Health",
            "start": "08:00",
            "minutes": 40,
            "impact": "+1.0 Vitality",
            "detail": "Early morning light exposure to anchor circadian rhythm and joint mobility."
        },
        {
            "title": "Brain Agility, Reading & Puzzle Workshop",
            "category": "Hobbies",
            "start": "10:30",
            "minutes": 45,
            "impact": "+0.8 Neuro-health",
            "detail": "Dedicated cognitive stimulation through reading, languages, or logic puzzles."
        },
        {
            "title": "Monthly Pension & Healthcare Budget Audit",
            "category": "Finance",
            "start": "14:30",
            "minutes": 20,
            "impact": "+Peace of Mind",
            "detail": "Check utility expenses and investment dividends for quiet assurance."
        },
        {
            "title": "Family Connection & Creative Leisure",
            "category": "Family",
            "start": "16:30",
            "minutes": 45,
            "impact": "+Social Joy",
            "detail": "Community connection, family calls, and creative garden/craft projects."
        },
        {
            "title": "Evening Calming Tea & Restorative Stretch",
            "category": "Health",
            "start": "20:30",
            "minutes": 25,
            "impact": "+0.9 Sleep",
            "detail": "Gentle stretching and quiet reading to prepare for restorative sleep."
        }
    ]
}


def synthesize_fallback_schedule(
    user_info: Dict[str, Any],
    baseline: Dict[str, Any],
    plan_date: str
) -> Dict[str, Any]:
    """
    Generates a mathematically calibrated deterministic schedule and morning briefing
    tailored to the user's role and measured telemetry.
    """
    role = (user_info.get("role") or "professional").lower()
    if role not in ROLE_CIRCADIAN_TEMPLATES:
        role = "professional"

    templates = ROLE_CIRCADIAN_TEMPLATES[role]
    avg_sleep = float(baseline.get("sleep", 7.5))
    sleep_target = float(user_info.get("sleep_target_hours", 8.0) or 8.0)
    sleep_debt = max(0.0, sleep_target - avg_sleep)
    monthly_savings = float(baseline.get("monthly_savings", 2100.0))
    current_net_worth = float(baseline.get("current_net_worth", user_info.get("net_worth", 15000.0)))
    goal_name = user_info.get("goal_name") or "Emergency Fund"
    goal_target = float(user_info.get("goal_target", 50000.0) or 50000.0)
    goal_current = float(user_info.get("goal_current", 15000.0) or 15000.0)
    goal_pct = min(100, round((goal_current / goal_target) * 100)) if goal_target > 0 else 100

    # Build tasks with unique IDs
    ts = int(time.time())
    tasks = []
    for idx, t in enumerate(templates):
        task_id = f"autoplan-{plan_date}-{idx}-{ts}"
        tasks.append({
            "id": task_id,
            "title": t["title"],
            "category": t["category"],
            "start": t["start"],
            "minutes": t["minutes"],
            "impact": t["impact"],
            "detail": t["detail"],
            "done": False,
            "date": plan_date,
            "fromSuggestion": True,
            "is_auto_planned": True
        })

    # Compose structured morning intelligence briefing
    sleep_condition = f"Sleep deficit of {sleep_debt:.1f}h detected" if sleep_debt >= 1.0 else f"Optimal sleep alignment ({avg_sleep:.1f}h)"
    briefing = f"""### AI Autonomous Morning Intelligence Briefing

**Circadian State**: {sleep_condition} | **Active Persona**: {role.capitalize()}
**Financial Compounding**: +${monthly_savings:,.2f}/mo surplus | **{goal_name}**: {goal_pct}% completed

**Autonomous Schedule Synthesis**:
1. **08:30–10:30 (Peak Alertness Window)**: Locked into `{tasks[0]['title']}` ({tasks[0]['minutes']}m) to capitalize on highest morning cognitive acuity.
2. **13:30–15:00 (Tactical Execution Window)**: Dedicated to `{tasks[1]['title']}` for structured milestone progression.
3. **16:45–19:30 (Rebalance & Recovery)**: Scheduled physical movement (`{tasks[2]['title']}`) and financial monitoring to maintain life-balance metrics.

*These {len(tasks)} tasks have been automatically scheduled and committed to your daily task board.*"""

    return {
        "briefing": briefing,
        "tasks": tasks,
        "task_count": len(tasks),
        "auto_committed": True
    }


def generate_autonomous_daily_schedule(
    user_info: Dict[str, Any],
    baseline: Dict[str, Any],
    telemetry: Optional[Dict[str, Any]] = None,
    plan_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Main entry point for autonomous daily routine planning.
    Uses Groq LLM to dynamically generate personalized schedule and briefing,
    with automatic fallback to deterministic circadian models.
    """
    target_date = plan_date or date.today().isoformat()
    role = (user_info.get("role") or "professional").lower()
    username = user_info.get("username", "Twin User")
    avg_sleep = float(baseline.get("sleep", 7.5))
    sleep_target = float(user_info.get("sleep_target_hours", 8.0) or 8.0)
    sleep_debt = max(0.0, sleep_target - avg_sleep)
    study_hours = float(baseline.get("study_hours_week", user_info.get("study_target_hours_week", 15.0)))
    monthly_savings = float(baseline.get("monthly_savings", 2100.0))
    current_net_worth = float(baseline.get("current_net_worth", user_info.get("net_worth", 15000.0)))
    goal_name = user_info.get("goal_name") or "Emergency Fund"
    goal_target = float(user_info.get("goal_target", 50000.0) or 50000.0)
    goal_current = float(user_info.get("goal_current", 15000.0) or 15000.0)
    goal_pct = min(100, round((goal_current / goal_target) * 100)) if goal_target > 0 else 100

    client = get_groq_client()
    if client is not None:
        prompt_text = f"""You are the Autonomous Daily Planner Intelligence for {username}, a {role.title()}.
Synthesize an optimal circadian daily schedule for today ({target_date}).

User Telemetry Baseline:
- Role: {role.title()}
- Sleep Baseline: {avg_sleep:.1f}h vs {sleep_target:.1f}h target (Sleep Debt: {sleep_debt:.1f}h)
- Weekly Study/Focus: {study_hours:.1f}h/wk
- Monthly Savings Surplus: +${monthly_savings:,.2f}/mo ({goal_pct}% of {goal_name} target)
- Net Worth: ${current_net_worth:,.2f}

Requirements:
1. Provide a concise Morning Intelligence Briefing in markdown (2-3 paragraphs max, zero emojis).
2. Generate exactly 4-5 calibrated tasks distributed across the circadian day:
   - Morning peak focus (between 08:00 and 11:30)
   - Afternoon execution (between 13:00 and 16:00)
   - Evening recovery/wellness/budget (between 16:30 and 21:00)
3. Return valid JSON matching this structure:
{{
  "briefing": "Markdown text summary explaining why this schedule was chosen based on sleep debt and milestone progress.",
  "tasks": [
    {{
      "title": "Task title",
      "category": "Work | Study | Health | Money | Career | Growth | Personal",
      "start": "09:00",
      "minutes": 90,
      "impact": "+1.2 Focus",
      "detail": "Description of the focus block"
    }}
  ]
}}"""

        for model in get_active_groq_models(client):
            try:
                resp = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are an autonomous decision intelligence engine that outputs strict JSON without emojis."},
                        {"role": "user", "content": prompt_text}
                    ],
                    temperature=0.4,
                    max_tokens=2048,
                    response_format={"type": "json_object"},
                    timeout=8.0
                )
                raw_json = resp.choices[0].message.content.strip()
                parsed = json.loads(raw_json)
                if "tasks" in parsed and isinstance(parsed["tasks"], list) and len(parsed["tasks"]) >= 3:
                    ts = int(time.time())
                    formatted_tasks = []
                    for idx, t in enumerate(parsed["tasks"]):
                        formatted_tasks.append({
                            "id": f"autoplan-{target_date}-{idx}-{ts}",
                            "title": str(t.get("title", f"Focus Session {idx+1}")),
                            "category": str(t.get("category", "Work")),
                            "start": str(t.get("start", "09:00")),
                            "minutes": int(t.get("minutes", 45)),
                            "impact": str(t.get("impact", "+1.0 Focus")),
                            "detail": str(t.get("detail", "")),
                            "done": False,
                            "date": target_date,
                            "fromSuggestion": True,
                            "is_auto_planned": True
                        })
                    
                    return {
                        "briefing": parsed.get("briefing", f"Autonomous daily routine formulated for {role.title()} persona."),
                        "tasks": formatted_tasks,
                        "task_count": len(formatted_tasks),
                        "auto_committed": True
                    }
            except Exception:
                continue

    # Fallback to deterministic model
    return synthesize_fallback_schedule(user_info, baseline, target_date)
