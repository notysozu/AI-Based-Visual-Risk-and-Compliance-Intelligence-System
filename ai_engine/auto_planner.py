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


def time_to_minutes(t_str: str) -> int:
    try:
        parts = t_str.strip().split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return 540


def minutes_to_time(m: int) -> str:
    m = max(0, min(1439, m))
    hh = m // 60
    mm = m % 60
    return f"{hh:02d}:{mm:02d}"


def parse_routine_config(raw_config: Any) -> Dict[str, Any]:
    if not raw_config:
        return {"fixed_commitments": [], "hobbies": [], "custom_context": ""}
    if isinstance(raw_config, str):
        try:
            parsed = json.loads(raw_config)
            if isinstance(parsed, dict):
                return {
                    "fixed_commitments": parsed.get("fixed_commitments", []),
                    "hobbies": parsed.get("hobbies", []),
                    "custom_context": parsed.get("custom_context", "")
                }
        except Exception:
            return {"fixed_commitments": [], "hobbies": [], "custom_context": ""}
    elif isinstance(raw_config, dict):
        return {
            "fixed_commitments": raw_config.get("fixed_commitments", []),
            "hobbies": raw_config.get("hobbies", []),
            "custom_context": raw_config.get("custom_context", "")
        }
    return {"fixed_commitments": [], "hobbies": [], "custom_context": ""}


def get_active_fixed_commitments(routine_config: Dict[str, Any], plan_date: str) -> List[Dict[str, Any]]:
    try:
        dt = datetime.strptime(plan_date, "%Y-%m-%d")
        day_abbr = dt.strftime("%a")
    except Exception:
        day_abbr = "Mon"

    commitments = routine_config.get("fixed_commitments") or []
    active = []
    for c in commitments:
        days = c.get("days") or []
        if not days or day_abbr in days:
            active.append(c)
    return active


def build_fixed_anchor_tasks(active_commitments: List[Dict[str, Any]], plan_date: str) -> List[Dict[str, Any]]:
    tasks = []
    for idx, c in enumerate(active_commitments):
        cid = c.get("id") or f"fc-{idx}"
        tasks.append({
            "id": f"fixed-{plan_date}-{cid}",
            "title": c.get("name", "Fixed Commitment"),
            "category": c.get("category", "Fixed"),
            "start": c.get("start", "09:00"),
            "minutes": int(c.get("minutes", 60)),
            "impact": "Locked Anchor",
            "detail": f"Fixed non-negotiable block ({c.get('category', 'Fixed')}). Protected from rescheduling.",
            "done": False,
            "date": plan_date,
            "fromSuggestion": False,
            "is_auto_planned": False,
            "is_fixed": True
        })
    return tasks


def find_available_slot(candidate_start: str, duration_mins: int, occupied_intervals: List[tuple]) -> str:
    cur_start = time_to_minutes(candidate_start)
    max_day = 22 * 60 + 30
    min_day = 7 * 60

    cur_start = max(min_day, min(cur_start, max_day - duration_mins))

    collision = True
    iterations = 0
    while collision and cur_start + duration_mins <= max_day and iterations < 20:
        iterations += 1
        collision = False
        cur_end = cur_start + duration_mins
        for occ_s, occ_e in sorted(occupied_intervals):
            if max(cur_start, occ_s) < min(cur_end, occ_e):
                cur_start = occ_e + 15
                collision = True
                break

    if cur_start + duration_mins <= max_day:
        return minutes_to_time(cur_start)

    early_start = min_day
    iterations = 0
    while early_start + duration_mins <= max_day and iterations < 20:
        iterations += 1
        collision = False
        early_end = early_start + duration_mins
        for occ_s, occ_e in sorted(occupied_intervals):
            if max(early_start, occ_s) < min(early_end, occ_e):
                early_start = occ_e + 15
                collision = True
                break
        if not collision:
            return minutes_to_time(early_start)

    return candidate_start


def synthesize_fallback_schedule(
    user_info: Dict[str, Any],
    baseline: Dict[str, Any],
    plan_date: str
) -> Dict[str, Any]:
    """
    Generates a mathematically calibrated deterministic schedule and morning briefing
    tailored to the user's role, measured telemetry, fixed anchors, and target hobbies.
    """
    role = (user_info.get("role") or "professional").lower()
    if role not in ROLE_CIRCADIAN_TEMPLATES:
        role = "professional"

    templates = ROLE_CIRCADIAN_TEMPLATES[role]
    avg_sleep = float(baseline.get("sleep", 7.5))
    sleep_target = float(user_info.get("sleep_target_hours", 8.0) or 8.0)
    sleep_debt = max(0.0, sleep_target - avg_sleep)
    avg_screen = float(baseline.get("screen", 3.5))
    monthly_savings = float(baseline.get("monthly_savings", 2100.0))
    goal_name = user_info.get("goal_name") or "Emergency Fund"
    goal_target = float(user_info.get("goal_target", 50000.0) or 50000.0)
    goal_current = float(user_info.get("goal_current", 15000.0) or 15000.0)
    goal_pct = min(100, round((goal_current / goal_target) * 100)) if goal_target > 0 else 100

    # Parse routine configuration
    routine_cfg = parse_routine_config(user_info.get("routine_config"))
    active_commitments = get_active_fixed_commitments(routine_cfg, plan_date)
    fixed_tasks = build_fixed_anchor_tasks(active_commitments, plan_date)

    # Track occupied time windows (start_min, end_min)
    occupied_intervals: List[tuple] = []
    for ft in fixed_tasks:
        s_min = time_to_minutes(ft["start"])
        e_min = s_min + ft["minutes"]
        occupied_intervals.append((s_min, e_min))

    ts = int(time.time())
    planned_tasks = []

    # Allocate calibrated role tasks into open windows
    for idx, t in enumerate(templates):
        # Adjust task duration slightly if heavy sleep debt
        task_minutes = t["minutes"]
        if sleep_debt >= 1.5 and idx == 0 and task_minutes > 60:
            task_minutes = 60

        slot = find_available_slot(t["start"], task_minutes, occupied_intervals)
        s_min = time_to_minutes(slot)
        occupied_intervals.append((s_min, s_min + task_minutes))

        task_id = f"autoplan-{plan_date}-{idx}-{ts}"
        planned_tasks.append({
            "id": task_id,
            "title": t["title"],
            "category": t["category"],
            "start": slot,
            "minutes": task_minutes,
            "impact": t["impact"],
            "detail": t["detail"],
            "done": False,
            "date": plan_date,
            "fromSuggestion": True,
            "is_auto_planned": True,
            "is_fixed": False
        })

    # Integrate user configured hobbies and target habits into open windows
    hobbies = routine_cfg.get("hobbies") or []
    for h_idx, h in enumerate(hobbies[:2]):
        pref = str(h.get("preferred_time", "evening")).lower()
        if pref == "morning":
            cand_start = "07:30"
        elif pref == "afternoon":
            cand_start = "16:15"
        else:
            cand_start = "19:15"

        h_mins = int(h.get("minutes", 30))
        h_slot = find_available_slot(cand_start, h_mins, occupied_intervals)
        s_min = time_to_minutes(h_slot)
        occupied_intervals.append((s_min, s_min + h_mins))

        task_id = f"autoplan-{plan_date}-hobby-{h_idx}-{ts}"
        planned_tasks.append({
            "id": task_id,
            "title": str(h.get("name", "Habit Practice")),
            "category": str(h.get("category", "Hobby")),
            "start": h_slot,
            "minutes": h_mins,
            "impact": "+Habit Consistency",
            "detail": f"Target habit block: {h.get('name')}. Auto-scheduled into your open circadian window.",
            "done": False,
            "date": plan_date,
            "fromSuggestion": True,
            "is_auto_planned": True,
            "is_fixed": False
        })

    # Merge and sort all tasks chronologically
    all_tasks = fixed_tasks + planned_tasks
    all_tasks.sort(key=lambda x: time_to_minutes(x["start"]))

    # Compose structured morning intelligence briefing
    sleep_condition = f"Sleep deficit of {sleep_debt:.1f}h detected" if sleep_debt >= 1.0 else f"Optimal sleep alignment ({avg_sleep:.1f}h)"
    screen_note = f"Screen load at {avg_screen:.1f}h/day - evening wind-down preserved." if avg_screen > 4.0 else "Healthy screen hygiene baseline."
    fixed_note = f"Protected {len(fixed_tasks)} fixed commitment block(s)." if fixed_tasks else "Flexible calendar without fixed commitments."
    hobbies_note = f"Accommodated {min(len(hobbies), 2)} target habit(s) in open slots." if hobbies else "Standard circadian allocation."

    briefing = f"""### AI Autonomous Morning Intelligence Briefing

**Circadian State**: {sleep_condition} | **Active Persona**: {role.capitalize()}
**Telemetry Diagnostic**: {screen_note} | **Calendar**: {fixed_note}
**Financial Compounding**: +${monthly_savings:,.2f}/mo surplus | **{goal_name}**: {goal_pct}% completed

**Autonomous Schedule Synthesis**:
- **Anchors & Non-Negotiables**: {fixed_note}
- **Habits & Routines**: {hobbies_note}
- **Cognitive Peak Allocation**: High-alertness focus sprint scheduled outside locked commitments.

*A total of {len(all_tasks)} tasks ({len(fixed_tasks)} fixed anchors, {len(planned_tasks)} AI-scheduled) have been committed to your daily task board.*"""

    return {
        "briefing": briefing,
        "tasks": all_tasks,
        "task_count": len(all_tasks),
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
    avg_screen = float(baseline.get("screen", 3.5))
    study_hours = float(baseline.get("study_hours_week", user_info.get("study_target_hours_week", 15.0)))
    monthly_savings = float(baseline.get("monthly_savings", 2100.0))
    current_net_worth = float(baseline.get("current_net_worth", user_info.get("net_worth", 15000.0)))
    goal_name = user_info.get("goal_name") or "Emergency Fund"
    goal_target = float(user_info.get("goal_target", 50000.0) or 50000.0)
    goal_current = float(user_info.get("goal_current", 15000.0) or 15000.0)
    goal_pct = min(100, round((goal_current / goal_target) * 100)) if goal_target > 0 else 100

    # Parse routine config and extract fixed anchors
    routine_cfg = parse_routine_config(user_info.get("routine_config"))
    active_commitments = get_active_fixed_commitments(routine_cfg, target_date)
    fixed_tasks = build_fixed_anchor_tasks(active_commitments, target_date)

    occupied_intervals: List[tuple] = []
    for ft in fixed_tasks:
        s_min = time_to_minutes(ft["start"])
        e_min = s_min + ft["minutes"]
        occupied_intervals.append((s_min, e_min))

    hobbies = routine_cfg.get("hobbies") or []
    custom_context = (routine_cfg.get("custom_context") or "").strip()

    fixed_summary_lines = [
        f"- {c.get('name', 'Fixed Block')} ({c.get('category', 'Fixed')}): {c.get('start', '09:00')} to {minutes_to_time(time_to_minutes(c.get('start', '09:00')) + int(c.get('minutes', 60)))} ({c.get('minutes', 60)}m)"
        for c in active_commitments
    ]
    fixed_summary_text = "\n".join(fixed_summary_lines) if fixed_summary_lines else "None (Entire day is open)."

    hobbies_summary_lines = [
        f"- {h.get('name', 'Habit')}: {h.get('minutes', 30)}m (Preferred time: {h.get('preferred_time', 'evening')})"
        for h in hobbies
    ]
    hobbies_summary_text = "\n".join(hobbies_summary_lines) if hobbies_summary_lines else "None specified."

    client = get_groq_client()
    if client is not None:
        prompt_text = f"""You are the Autonomous Daily Planner Intelligence for {username}, a {role.title()}.
Synthesize an optimal circadian daily schedule for today ({target_date}).

CRITICAL CONSTRAINTS - FIXED COMMITMENTS:
The user has the following LOCKED non-negotiable commitments today:
{fixed_summary_text}
RULE: You MUST NEVER schedule any tasks during these locked hours. All suggested tasks must fall strictly into open time windows.

TARGET HOBBIES & HABITS:
{hobbies_summary_text}
RULE: Allocate 1-2 of the user's hobbies in their preferred windows if open slots permit.

USER ROUTINE NOTES & CONTEXT:
"{custom_context if custom_context else 'Standard schedule.'}"

TELEMETRY & ANALYTICS BASELINE:
- Role: {role.title()}
- Sleep Baseline: {avg_sleep:.1f}h vs {sleep_target:.1f}h target (Sleep Debt: {sleep_debt:.1f}h)
- Screen Time Load: {avg_screen:.1f}h/day
- Weekly Study/Focus: {study_hours:.1f}h/wk
- Monthly Savings Surplus: +${monthly_savings:,.2f}/mo ({goal_pct}% of {goal_name} target)
- Net Worth: ${current_net_worth:,.2f}

Requirements:
1. Provide a concise Morning Intelligence Briefing in markdown (2-3 paragraphs max, zero emojis). Explicitly cite how fixed anchors and sleep telemetry shaped today's plan.
2. Generate 3-4 flexible calibrated focus/recovery/hobby tasks strictly inside the open non-overlapping hours:
   - Match peak alertness windows outside fixed commitments
   - Address sleep debt (e.g. adjust intensity if sleep debt >= 1.0h)
   - Preserve late evening recovery and screen hygiene
3. Return valid JSON matching this structure:
{{
  "briefing": "Markdown text summary explaining why this schedule was chosen based on fixed anchors, sleep debt, and milestone progress.",
  "tasks": [
    {{
      "title": "Task title",
      "category": "Work | Study | Health | Money | Career | Growth | Hobby",
      "start": "HH:MM",
      "minutes": 45,
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
                if "tasks" in parsed and isinstance(parsed["tasks"], list) and len(parsed["tasks"]) >= 2:
                    ts = int(time.time())
                    formatted_tasks = []
                    for idx, t in enumerate(parsed["tasks"]):
                        t_mins = int(t.get("minutes", 45))
                        req_start = str(t.get("start", "09:00"))
                        safe_start = find_available_slot(req_start, t_mins, occupied_intervals)
                        s_min = time_to_minutes(safe_start)
                        occupied_intervals.append((s_min, s_min + t_mins))

                        formatted_tasks.append({
                            "id": f"autoplan-{target_date}-{idx}-{ts}",
                            "title": str(t.get("title", f"Focus Session {idx+1}")),
                            "category": str(t.get("category", "Work")),
                            "start": safe_start,
                            "minutes": t_mins,
                            "impact": str(t.get("impact", "+1.0 Focus")),
                            "detail": str(t.get("detail", "")),
                            "done": False,
                            "date": target_date,
                            "fromSuggestion": True,
                            "is_auto_planned": True,
                            "is_fixed": False
                        })

                    all_tasks = fixed_tasks + formatted_tasks
                    all_tasks.sort(key=lambda x: time_to_minutes(x["start"]))

                    return {
                        "briefing": parsed.get("briefing", f"Autonomous daily routine formulated for {role.title()} persona."),
                        "tasks": all_tasks,
                        "task_count": len(all_tasks),
                        "auto_committed": True
                    }
            except Exception:
                continue

    # Fallback to deterministic model
    return synthesize_fallback_schedule(user_info, baseline, target_date)
