import pytest
from ai_engine.auto_planner import (
    generate_autonomous_daily_schedule,
    synthesize_fallback_schedule,
    ROLE_CIRCADIAN_TEMPLATES
)


def test_role_circadian_templates_all_roles():
    expected_roles = ["student", "professional", "freelancer", "entrepreneur", "retiree"]
    for role in expected_roles:
        assert role in ROLE_CIRCADIAN_TEMPLATES
        templates = ROLE_CIRCADIAN_TEMPLATES[role]
        assert len(templates) >= 4
        for t in templates:
            assert "title" in t
            assert "category" in t
            assert "start" in t
            assert "minutes" in t
            assert t["minutes"] > 0


def test_synthesize_fallback_schedule():
    user_info = {
        "role": "student",
        "username": "Alex Student",
        "sleep_target_hours": 8.5,
        "study_target_hours_week": 20.0,
        "monthly_income": 800.0,
        "monthly_expenses": 500.0,
        "net_worth": 1500.0,
        "goal_name": "New Laptop",
        "goal_target": 1200.0,
        "goal_current": 600.0,
    }
    baseline = {
        "sleep": 6.5,
        "study_hours_week": 14.0,
        "monthly_savings": 300.0,
        "current_net_worth": 1500.0
    }
    plan_date = "2026-09-07"
    res = synthesize_fallback_schedule(user_info, baseline, plan_date)

    assert res["auto_committed"] is True
    assert res["task_count"] >= 4
    assert "briefing" in res
    assert "Sleep deficit of 2.0h detected" in res["briefing"]
    assert "New Laptop" in res["briefing"]

    for t in res["tasks"]:
        assert t["date"] == plan_date
        assert t["is_auto_planned"] is True
        assert t["done"] is False
        assert t["fromSuggestion"] is True
        assert len(t["title"]) > 3
        assert len(t["start"]) == 5  # "HH:MM"


def test_generate_autonomous_daily_schedule_all_roles():
    roles = ["student", "professional", "freelancer", "entrepreneur", "retiree"]
    for role in roles:
        user_info = {
            "role": role,
            "username": f"Test {role.capitalize()}",
            "sleep_target_hours": 8.0,
            "study_target_hours_week": 15.0,
            "monthly_income": 5000.0,
            "monthly_expenses": 2900.0,
            "net_worth": 25000.0,
            "goal_name": "Emergency Fund",
            "goal_target": 30000.0,
            "goal_current": 15000.0,
        }
        baseline = {
            "sleep": 7.8,
            "study_hours_week": 12.0,
            "monthly_savings": 2100.0,
            "current_net_worth": 25000.0
        }
        res = generate_autonomous_daily_schedule(user_info, baseline, plan_date="2026-09-07")
        assert res["auto_committed"] is True
        assert res["task_count"] >= 3
        assert len(res["briefing"]) > 20
        for task in res["tasks"]:
            assert "title" in task
            assert "category" in task
            assert "start" in task
            assert "minutes" in task
            assert "is_auto_planned" in task


def test_routine_config_fixed_anchors_and_hobbies():
    user_info = {
        "role": "student",
        "username": "Alex Student",
        "sleep_target_hours": 8.0,
        "study_target_hours_week": 20.0,
        "monthly_income": 800.0,
        "monthly_expenses": 500.0,
        "net_worth": 1500.0,
        "routine_config": {
            "fixed_commitments": [
                {
                    "id": "college-block",
                    "name": "College Lectures & Labs",
                    "category": "College",
                    "start": "09:00",
                    "end": "15:30",
                    "minutes": 390,
                    "days": ["Mon", "Tue", "Wed", "Thu", "Fri"]
                }
            ],
            "hobbies": [
                {
                    "id": "guitar-goal",
                    "name": "Guitar Practice",
                    "category": "Hobby",
                    "minutes": 30,
                    "preferred_time": "evening"
                }
            ],
            "custom_context": "Classes 9am-3:30pm. Prefer studying after 5pm."
        }
    }
    baseline = {
        "sleep": 7.0,
        "screen": 4.5,
        "study_hours_week": 14.0,
        "monthly_savings": 300.0,
        "current_net_worth": 1500.0
    }
    # 2026-09-07 is Monday
    res = synthesize_fallback_schedule(user_info, baseline, plan_date="2026-09-07")

    assert res["auto_committed"] is True

    # Verify fixed anchor task exists
    fixed_tasks = [t for t in res["tasks"] if t.get("is_fixed")]
    assert len(fixed_tasks) == 1
    fc = fixed_tasks[0]
    assert fc["title"] == "College Lectures & Labs"
    assert fc["start"] == "09:00"
    assert fc["minutes"] == 390
    assert fc["is_fixed"] is True
    assert fc["impact"] == "Locked Anchor"

    # Verify hobby task exists
    hobby_tasks = [t for t in res["tasks"] if t["title"] == "Guitar Practice"]
    assert len(hobby_tasks) == 1
    assert hobby_tasks[0]["minutes"] == 30

    # Verify ZERO tasks overlap with 09:00 - 15:30 (540 to 930 mins)
    fc_start_min = 9 * 60
    fc_end_min = 9 * 60 + 390
    for t in res["tasks"]:
        if t.get("is_fixed"):
            continue
        t_start = int(t["start"].split(":")[0]) * 60 + int(t["start"].split(":")[1])
        t_end = t_start + t["minutes"]
        assert not (max(t_start, fc_start_min) < min(t_end, fc_end_min)), (
            f"Task {t['title']} at {t['start']} ({t['minutes']}m) overlaps with locked commitment!"
        )

