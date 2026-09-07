import json
import pytest
from ai_engine.llm_integration.table_parser import parse_schedule_tasks_from_text, parse_markdown_table_rows, parse_bullet_tasks
from ai_engine.llm_integration.schedule_builder import build_fitness_schedule, build_study_schedule, build_smart_role_schedule
from ai_engine.llm_integration.intents.routine_planning import handle_routine_planning_intent


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


def test_table_parser_time_schedule():
    sample_time_table = """| Time | Task / Block | Duration | Category | Predicted Impact |
| :--- | :--- | :--- | :--- | :--- |
| `09:00` | **High-Priority Deep Work Sprint** | 90 mins | `Work` | +1.4 Focus & Output |
| `11:30` | **Cross-Functional Project Execution** | 60 mins | `Work` | +1.0 Velocity |
| `15:30` | **Technical Skill Upgrading** | 45 mins | `Study` | +0.8 Career Growth |
| `18:00` | **Physical Vitality & Decompression** | 45 mins | `Health` | +1.0 Vitality |"""

    tasks = parse_schedule_tasks_from_text(sample_time_table)
    assert len(tasks) == 4
    assert tasks[0]["start"] == "09:00"
    assert tasks[0]["minutes"] == 90
    assert tasks[0]["category"] == "Work"
    assert tasks[2]["category"] == "Study"
    assert tasks[3]["category"] == "Health"


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


def test_routine_planning_intent_history_confirmation():
    history = [
        {"role": "user", "content": "let's plan something"},
        {"role": "assistant", "content": """| Day | Focus | Session (min) | Core Move | Quick Recovery |
|-----|-------|---------------|-----------|----------------|
| Mon | Strength (Upper) | 45 | Bench press / Pull-ups | 5-min foam roll |
| Tue | Cardio + Core | 30 | HIIT (30 s sprint/90 s jog) x 8 | 5-min stretch |"""}
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

    res = handle_routine_planning_intent(
        prompt="yes plug it in my daily plannar",
        p_lower="yes plug it in my daily plannar",
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
    assert len(payload["tasks"]) == 2
    assert payload["tasks"][0]["category"] == "Health"
