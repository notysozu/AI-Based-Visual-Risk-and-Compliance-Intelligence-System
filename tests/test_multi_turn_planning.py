import json
import pytest
from ai_engine.llm_integration.table_parser import (
    parse_schedule_tasks_from_text,
    parse_markdown_table_rows,
    parse_timestamp_lines,
    parse_duration_labeled_items,
    parse_bullet_tasks
)
from ai_engine.llm_integration.schedule_builder import (
    build_fitness_schedule,
    build_study_schedule,
    build_smart_role_schedule
)
from ai_engine.llm_integration.intents.routine_planning import handle_routine_planning_intent
from ai_engine.llm_integration.advisor import process_twin_copilot_turn


def test_table_parser_markdown_schedule():
    sample_table = """**Fitness Blueprint – 8 active days / week**

| Day | Focus | Session (min) | Core Move | Quick Recovery |
|-----|-------|---------------|-----------|----------------|
| Mon | Strength (Upper) | 45 | Bench press / Pull-ups | 5-min foam roll |
| Tue | Cardio + Core | 30 | HIIT (30 s sprint/90 s jog) x 8 | 5-min stretch |
| Wed | Strength (Lower) | 45 | Squats / Deadlifts | 5-min mobility |
| Thu | Active Recovery | 30 | Yoga flow (hips-shoulder) | 10-min breathing |
| Fri | Strength (Full-Body) | 45 | Kettlebell circuit | 5-min foam roll |
| Sat | Endurance | 45 | Long bike ride / Run | 10-min cool down |
| Sun | Rest & Reset | 20 | Light walk / Mobility | Hot bath & sleep prep |"""

    tasks = parse_schedule_tasks_from_text(sample_table)
    assert len(tasks) == 7
    for t in tasks:
        assert t["category"] == "Health"
        assert t["minutes"] in [20, 30, 45]
        assert len(t["start"]) == 5
        assert len(t["title"]) > 3


def test_table_parser_timestamp_schedule():
    sample_timestamp_text = """Here’s a high‑impact, “crazy‑day” schedule tailored to maximize focus, energy, and productivity:

06:30 – 07:00 – Cold-shower + 5-min breathwork (kick-starts dopamine & adrenaline)
07:00 – 08:30 – 90-min Deep-Work Sprint: tackle the single hardest task (e.g., core feature code, paper draft)
08:30 – 09:00 – High-protein breakfast + hydration + quick walk
09:00 – 11:30 – Second Deep-Work Sprint: finish critical deliverables before lunch
11:30 – 12:30 – Lunch + screen-free walk
12:30 – 14:00 – Third Focus Sprint: meetings, reviews, or smaller tasks
14:00 – 14:30 – 30-min Power Nap or Non-Sleep Deep Rest (NSDR)
14:30 – 16:30 – Creative / Problem-Solving Block: brainstorm, architect, or write
16:30 – 17:30 – Intense Physical Session: lift heavy or HIIT circuit
17:30 – 18:30 – Shower, dinner, wind-down
18:30 – 20:30 – Passion project or reading / skill acquisition
20:30 – 21:30 – Digital curfew + journal / plan tomorrow
21:30 – Bedtime prep for 8 hours of solid recovery"""

    tasks = parse_schedule_tasks_from_text(sample_timestamp_text)
    assert len(tasks) >= 10
    assert tasks[0]["start"] == "06:30"
    assert tasks[0]["minutes"] == 30
    assert tasks[0]["category"] == "Health"

    assert tasks[1]["start"] == "07:00"
    assert tasks[1]["minutes"] == 90
    assert tasks[1]["category"] == "Work"

    assert tasks[3]["start"] == "09:00"
    assert tasks[3]["minutes"] == 150
    assert tasks[3]["category"] == "Work"


def test_table_parser_duration_labeled_items():
    sample_items = """Here are three micro-sprints you can drop into your daily planner right now:

Micro-Workout Blitz (15 min) – 3 rounds: 20 push-ups, 30 air squats, 1-min plank. (Category: Health)
Lightning-Learning Sprint (30 min) – 1 Pomodoro on high-priority study/reading. (Category: Study)
Random-Outreach Burst (15 min) – Send 2 quick professional/networking check-in emails. (Category: Work)

Let me know which of these (or all three) you want added to your task list, or reply "1, 2, 3 add it" to plug them in immediately!"""

    tasks = parse_schedule_tasks_from_text(sample_items)
    assert len(tasks) == 3
    assert tasks[0]["minutes"] == 15
    assert tasks[0]["category"] == "Health"
    assert "Micro-Workout Blitz" in tasks[0]["title"]

    assert tasks[1]["minutes"] == 30
    assert tasks[1]["category"] == "Study"
    assert "Lightning-Learning" in tasks[1]["title"]

    assert tasks[2]["minutes"] == 15
    assert tasks[2]["category"] == "Work"
    assert "Random-Outreach" in tasks[2]["title"]


def test_table_parser_bullet_list():
    sample_bullets = """Here is your plan for today:
- 08:00 AM: Morning Mobility & Stretch (30 mins)
- 09:30 AM: Deep Architecture Sprint (90 mins)
- 02:00 PM: Client Strategy Sync (45 mins)
- 06:00 PM: Evening Cardio & Workout (45 mins)"""

    tasks = parse_schedule_tasks_from_text(sample_bullets)
    assert len(tasks) == 4
    assert tasks[0]["category"] == "Health"
    assert tasks[1]["minutes"] == 90
    assert tasks[1]["category"] == "Work"


def test_fitness_schedule_builder():
    tasks = build_fitness_schedule()
    assert len(tasks) >= 4
    for t in tasks:
        assert t["category"] == "Health"
        assert t["minutes"] > 0
        assert len(t["start"]) == 5


def test_study_schedule_builder():
    tasks = build_study_schedule(active_study_subject="Advanced Calculus")
    assert len(tasks) >= 4
    for t in tasks:
        assert t["category"] in ["Study", "Health"]
        assert "Advanced Calculus" in t["title"] or "Study" in t["title"] or "Health" in t["category"]


def test_routine_planning_intent_numerical_confirmation():
    history = [
        {"role": "user", "content": "can you plan some crazy tasks to me for today?"},
        {"role": "assistant", "content": """Here are three micro-sprints you can drop into your daily planner right now:

Micro-Workout Blitz (15 min) – 3 rounds: 20 push-ups, 30 air squats, 1-min plank. (Category: Health)
Lightning-Learning Sprint (30 min) – 1 Pomodoro on high-priority study/reading. (Category: Study)
Random-Outreach Burst (15 min) – Send 2 quick professional/networking check-in emails. (Category: Work)"""}
    ]

    user_info = {"role": "professional", "username": "John"}
    t_data = {
        "avg_sleep": 7.5,
        "sleep_target": 8.0,
        "sleep_debt": 0.5,
        "monthly_savings": 1500.0,
        "savings_rate": 30,
        "net_worth": 50000.0,
        "target_retirement_age": 60,
        "avg_screen": 4.0,
        "exercise_days_count": 4,
    }

    # Case 1: "1,2,3 add it"
    res = handle_routine_planning_intent(
        prompt="1,2,3 add it",
        p_lower="1,2,3 add it",
        user_info=user_info,
        t_data=t_data,
        goal_name="Emergency Fund",
        goal_pct=50,
        goal_gap=10000.0,
        history=history
    )

    assert res is not None
    assert res["action_type"] == "add_multiple_tasks"
    payload = json.loads(res["action_payload"])
    assert len(payload["tasks"]) == 3
    assert payload["tasks"][0]["category"] == "Health"
    assert payload["tasks"][1]["category"] == "Study"
    assert payload["tasks"][2]["category"] == "Work"

    # Case 2: "1 and 2 add it"
    res_partial = handle_routine_planning_intent(
        prompt="1 and 2 add it",
        p_lower="1 and 2 add it",
        user_info=user_info,
        t_data=t_data,
        goal_name="Emergency Fund",
        goal_pct=50,
        goal_gap=10000.0,
        history=history
    )
    assert res_partial is not None
    payload_partial = json.loads(res_partial["action_payload"])
    assert len(payload_partial["tasks"]) == 2
    assert payload_partial["tasks"][0]["category"] == "Health"
    assert payload_partial["tasks"][1]["category"] == "Study"


def test_copilot_turn_full_multi_turn_flow():
    user_info = {"role": "software engineer", "username": "Alex"}
    baseline = {"sleep_hours": 7.0, "study_hours_week": 12.0}

    # Turn 1: "can you plan some crazy tasks to me for today?"
    t1_res = process_twin_copilot_turn(
        user_id="user-123",
        prompt="can you plan some crazy tasks to me for today?",
        history=[],
        user_info=user_info,
        baseline=baseline
    )
    assert t1_res["action_type"] == "add_multiple_tasks"
    t1_payload = json.loads(t1_res["action_payload"])
    assert len(t1_payload["tasks"]) >= 3

    # Turn 2: "can you add these in my tasks"
    history_after_t1 = [
        {"role": "user", "content": "can you plan some crazy tasks to me for today?"},
        {"role": "assistant", "content": t1_res["content"]}
    ]
    t2_res = process_twin_copilot_turn(
        user_id="user-123",
        prompt="can you add these in my tasks",
        history=history_after_t1,
        user_info=user_info,
        baseline=baseline
    )
    assert t2_res["action_type"] == "add_multiple_tasks"
    t2_payload = json.loads(t2_res["action_payload"])
    assert len(t2_payload["tasks"]) >= 3
