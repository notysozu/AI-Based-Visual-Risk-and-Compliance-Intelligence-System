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
            assert task["is_auto_planned"] is True
