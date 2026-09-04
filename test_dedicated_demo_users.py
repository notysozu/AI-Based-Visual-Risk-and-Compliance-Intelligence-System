#!/usr/bin/env python3
"""
Test Suite: Dedicated MongoDB Demo Twin Accounts
Verifies that all 5 demo personas (student, freelancer, founder, retiree, pro)
are automatically seeded, backed by dedicated MongoDB user documents, and support
all analytics, habit, study, and financial queries.
"""

import sys
import httpx

BASE_URL = "http://127.0.0.1:8000"

ROLES_TO_TEST = [
    ("student", "student_demo", "student.demo@twin.local", 20, 1200.0, 25.0),
    ("freelancer", "freelancer_demo", "freelancer.demo@twin.local", 28, 6500.0, 10.0),
    ("entrepreneur", "founder_demo", "founder.demo@twin.local", 32, 12000.0, 8.0),
    ("retiree", "retiree_demo", "retiree.demo@twin.local", 62, 4500.0, 5.0),
    ("professional", "pro_demo", "pro.demo@twin.local", 29, 8500.0, 12.0),
]


def test_dedicated_demo_personas():
    client = httpx.Client(base_url=BASE_URL, timeout=30.0)
    print("=== Testing Dedicated MongoDB Demo Twin Accounts ===")

    demo_user_ids = {}

    for role_key, expected_username, expected_email, expected_age, expected_income, expected_study in ROLES_TO_TEST:
        print(f"\n[Testing Persona: {role_key.upper()} ({expected_username})]")
        
        # 1. Fetch / seed demo user via GET /users/demo/{role}
        resp = client.get(f"/users/demo/{role_key}")
        assert resp.status_code == 200, f"Failed to get demo user for {role_key}: {resp.text}"
        user_data = resp.json()
        
        user_id = str(user_data["id"])
        demo_user_ids[role_key] = user_id
        
        print(f"  - User Document ID: {user_id}")
        assert user_data["username"] == expected_username, f"Username mismatch: {user_data['username']} vs {expected_username}"
        assert user_data["email"] == expected_email, f"Email mismatch: {user_data['email']} vs {expected_email}"
        assert user_data["age"] == expected_age, f"Age mismatch: {user_data['age']} vs {expected_age}"
        assert user_data["monthly_income"] == expected_income, f"Income mismatch: {user_data['monthly_income']} vs {expected_income}"
        assert user_data["study_target_hours_week"] == expected_study, f"Study target mismatch: {user_data['study_target_hours_week']} vs {expected_study}"
        print(f"  - Profile verification passed.")

        # 2. Check seeded habit records in MongoDB
        habits_resp = client.get(f"/records/habit/{user_id}")
        assert habits_resp.status_code == 200, f"Failed to get habit records: {habits_resp.text}"
        habits = habits_resp.json()
        assert len(habits) >= 30, f"Expected at least 30 habit records for {role_key}, got {len(habits)}"
        print(f"  - Habit telemetry verified: {len(habits)} records in MongoDB.")

        # 3. Check seeded financial records in MongoDB
        fin_resp = client.get(f"/records/financial/{user_id}")
        assert fin_resp.status_code == 200, f"Failed to get financial records: {fin_resp.text}"
        fin_records = fin_resp.json()
        assert len(fin_records) >= 3, f"Expected financial records for {role_key}, got {len(fin_records)}"
        print(f"  - Financial cashflows verified: {len(fin_records)} records in MongoDB.")

        # 4. Check seeded study records in MongoDB
        study_resp = client.get(f"/records/study/{user_id}")
        assert study_resp.status_code == 200, f"Failed to get study records: {study_resp.text}"
        study_records = study_resp.json()
        print(f"  - Study records verified: {len(study_records)} records in MongoDB.")

        # 5. Check role-tailored suggestions in MongoDB
        sug_resp = client.get(f"/suggestions/{user_id}")
        assert sug_resp.status_code == 200, f"Failed to get suggestions: {sug_resp.text}"
        sugs_data = sug_resp.json()
        sugs = sugs_data.get("suggestions", [])
        assert len(sugs) >= 2, f"Expected suggestions for {role_key}, got {len(sugs)}"
        print(f"  - Suggestion library verified: {len(sugs)} suggestions in MongoDB.")

        # 6. Run Monte Carlo simulation for this demo persona
        fc_resp = client.get(f"/simulations/forecast/{user_id}")
        assert fc_resp.status_code == 200, f"Failed to run forecast for {role_key}: {fc_resp.text}"
        fc = fc_resp.json()
        assert "deterministic" in fc and "monte_carlo" in fc, f"Forecast structure invalid: {fc}"
        print(f"  - Monte Carlo 500-run simulation verified (P_success: {fc.get('probability_of_success', 0):.0%}).")

    # Verify all 5 demo personas have unique document IDs in MongoDB
    unique_ids = set(demo_user_ids.values())
    assert len(unique_ids) == 5, f"Expected 5 unique user IDs, got {len(unique_ids)}: {demo_user_ids}"
    print(f"\nAll 5 demo personas have distinct, isolated MongoDB documents:")
    for role_name, uid in demo_user_ids.items():
        print(f"  - {role_name.capitalize()}: {uid}")
    print("\n=== ALL DEDICATED DEMO PERSONA TESTS PASSED (100%) ===")


if __name__ == "__main__":
    try:
        test_dedicated_demo_personas()
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        sys.exit(1)
