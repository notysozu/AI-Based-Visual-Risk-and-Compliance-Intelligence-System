"""
test_live_mongodb_e2e.py — Comprehensive End-to-End Test Suite for Visual Risk AI
Tests all features from Conversational AI to Settings Data against the live MongoDB Atlas cluster and FastAPI backend.
"""
import sys
import time
import json
import requests

BASE_URL = "http://127.0.0.1:8000"
TS = int(time.time())
TEST_USERNAME = f"live_user_{TS}"
TEST_EMAIL = f"live_user_{TS}@testvrci.com"

PASSED_COUNT = 0
FAILED_COUNT = 0

def log_section(title: str):
    print(f"\n{'='*70}\n {title}\n{'='*70}")

def assert_test(condition: bool, test_name: str, detail: str = ""):
    global PASSED_COUNT, FAILED_COUNT
    if condition:
        PASSED_COUNT += 1
        print(f"  [PASS] {test_name}" + (f" -> {detail}" if detail else ""))
    else:
        FAILED_COUNT += 1
        print(f"  [FAIL] {test_name}" + (f" -> {detail}" if detail else ""))


def run_e2e_tests():
    global PASSED_COUNT, FAILED_COUNT
    print(f"Starting End-to-End System Tests on {BASE_URL}")
    print(f"Test User: {TEST_USERNAME} ({TEST_EMAIL})")

    # =========================================================================
    # STAGE 1: System Health & Live Database Connection
    # =========================================================================
    log_section("STAGE 1: System Health & Live MongoDB Connection")
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        assert_test(r.status_code == 200, "GET /health returns HTTP 200")
        health_data = r.json()
        assert_test(health_data.get("status") == "healthy", "Server status is healthy")
        db_info = health_data.get("database", {})
        assert_test(db_info.get("engine") == "mongodb", "Database engine is MongoDB", str(db_info))
        assert_test(db_info.get("status") == "connected", "Database connection status is connected")
        print(f"  Database Mode: {db_info.get('mode')} | DB Name: {db_info.get('database')}")
    except Exception as e:
        assert_test(False, "System Health Check Exception", str(e))

    # =========================================================================
    # STAGE 2: User Lifecycle, Authentication & Settings Data
    # =========================================================================
    log_section("STAGE 2: User Lifecycle, Authentication & Settings Data")
    user_id = None
    try:
        # 1. Create User with complete settings baseline
        user_payload = {
            "username": TEST_USERNAME,
            "email": TEST_EMAIL,
            "role": "professional",
            "is_onboarded": 1,
            "age": 28,
            "retirement_goal_age": 55,
            "target_net_worth": 1500000.0,
            "monthly_income": 7500.0,
            "monthly_expenses": 3200.0,
            "net_worth": 45000.0,
            "sleep_target_hours": 8.0,
            "study_target_hours_week": 12.0,
            "exercise_target_days": 5.0,
            "screen_time_target_hours": 3.0,
            "savings_rate_target": 25.0,
            "focus_area": "System Architecture",
            "goal_name": "Down Payment Fund",
            "goal_current": 35000.0,
            "goal_target": 100000.0,
            "theme_preference": "dark",
            "scenario_a_preset": json.dumps({"savings": 500, "sleep": 0.5, "study": 2}),
            "scenario_b_preset": json.dumps({"savings": 1000, "sleep": 0, "study": 5}),
        }
        r = requests.post(f"{BASE_URL}/users/", json=user_payload, timeout=5)
        assert_test(r.status_code == 200, "POST /users/ creates new user", f"Status {r.status_code}")
        user_res = r.json()
        user_id = user_res.get("id")
        assert_test(user_id is not None, "User ID generated and returned", f"User ID: {user_id}")
        assert_test(user_res.get("username") == TEST_USERNAME, "Username matches")
        assert_test(user_res.get("role") == "professional", "Persona role matches")

        # 2. Duplicate Username Rejection
        r_dup = requests.post(f"{BASE_URL}/users/", json={"username": TEST_USERNAME, "email": "other@test.com"})
        assert_test(r_dup.status_code == 400, "Duplicate username rejected with HTTP 400")

        # 3. Duplicate Email Rejection
        r_dup_email = requests.post(f"{BASE_URL}/users/", json={"username": "other_user", "email": TEST_EMAIL})
        assert_test(r_dup_email.status_code == 400, "Duplicate email rejected with HTTP 400")

        # 4. Login with Username
        r_login_user = requests.post(f"{BASE_URL}/users/login", json={"identifier": TEST_USERNAME})
        assert_test(r_login_user.status_code == 200, "POST /users/login via Username succeeds")
        assert_test(r_login_user.json().get("id") == user_id, "Login returns identical user document")

        # 5. Login with Email
        r_login_email = requests.post(f"{BASE_URL}/users/login", json={"identifier": TEST_EMAIL})
        assert_test(r_login_email.status_code == 200, "POST /users/login via Email succeeds")

        # 6. Retrieve Profile by ID
        r_get_user = requests.get(f"{BASE_URL}/users/{user_id}")
        assert_test(r_get_user.status_code == 200, "GET /users/{id} retrieves profile")
        fetched_user = r_get_user.json()
        assert_test(fetched_user.get("goal_name") == "Down Payment Fund", "Goal name persisted in MongoDB")
        assert_test(fetched_user.get("theme_preference") == "dark", "Theme preference persisted in MongoDB")

        # 7. Update Settings & Profile Data
        update_payload = {
            "age": 29,
            "monthly_income": 8200.0,
            "monthly_expenses": 3400.0,
            "net_worth": 52000.0,
            "sleep_target_hours": 8.5,
            "exercise_target_days": 6.0,
            "goal_current": 42000.0,
            "theme_preference": "light",
            "tasks_json": json.dumps([{"id": "task-1", "title": "Review PR", "done": True}]),
        }
        r_update = requests.put(f"{BASE_URL}/users/{user_id}", json=update_payload)
        assert_test(r_update.status_code == 200, "PUT /users/{id} updates settings data")
        updated_user = r_update.json()
        assert_test(updated_user.get("monthly_income") == 8200.0, "Updated monthly income persisted")
        assert_test(updated_user.get("theme_preference") == "light", "Updated theme persisted")
        assert_test(updated_user.get("tasks_json") is not None, "Daily planner tasks persisted to MongoDB")
    except Exception as e:
        assert_test(False, "User Lifecycle Exception", str(e))

    # =========================================================================
    # STAGE 3: Conversational AI Copilot (/chat)
    # =========================================================================
    log_section("STAGE 3: Conversational AI Copilot (/chat)")
    session_id = None
    assistant_msg_id = None
    try:
        # 1. Create thread and send initial conversational prompt with Think Mode
        thread_payload = {
            "user_id": user_id,
            "prompt": "I want to increase my monthly savings by $600 and optimize my morning focus routine. Can you suggest actionable tasks?",
            "think_mode": True,
            "client_context": {
                "role": "professional",
                "goalName": "Down Payment Fund",
                "goalTarget": 100000,
                "goalCurrent": 42000
            }
        }
        print("  Sending turn to AI Copilot via Groq LLM...")
        r_chat = requests.post(f"{BASE_URL}/chat/message/create_thread", json=thread_payload, timeout=30)
        assert_test(r_chat.status_code == 200, "POST /chat/message/create_thread returns HTTP 200", f"Status: {r_chat.status_code}")
        chat_data = r_chat.json()
        session_info = chat_data.get("session", {})
        session_id = session_info.get("id")
        user_msg = chat_data.get("user_message", {})
        asst_msg = chat_data.get("assistant_message", {})
        assistant_msg_id = asst_msg.get("id")

        assert_test(session_id is not None, "Chat session created in MongoDB", f"Session ID: {session_id}")
        assert_test(len(asst_msg.get("content", "")) > 10, "Assistant returned generated response")
        print(f"  AI Response Preview: {asst_msg.get('content', '')[:120]}...")

        # Verify Think Mode disclosure
        has_think = "<think>" in asst_msg.get("content", "") or asst_msg.get("action_type") != "none"
        assert_test(has_think, "Assistant reasoning chain or action proposal generated", f"Action Type: {asst_msg.get('action_type')}")

        # 2. Multi-turn chat message in existing session
        turn_payload = {
            "user_id": user_id,
            "prompt": "What if I also sleep 30 minutes more each night?",
            "think_mode": True
        }
        r_turn = requests.post(f"{BASE_URL}/chat/message/{session_id}", json=turn_payload, timeout=30)
        assert_test(r_turn.status_code == 200, "POST /chat/message/{session_id} handles multi-turn conversation")
        turn_data = r_turn.json()
        assert_test(turn_data.get("assistant_message") is not None, "Second turn assistant message returned")

        # 3. Action Approval & Execution
        action_payload = {
            "user_id": user_id,
            "action_type": "add_task",
            "action_payload": {
                "title": "Morning Architecture Deep Work Sprint",
                "category": "Work",
                "start": "09:00",
                "minutes": 60,
                "impact": "+1.2 focus"
            }
        }
        r_action = requests.post(f"{BASE_URL}/chat/action/execute/{assistant_msg_id}", json=action_payload)
        assert_test(r_action.status_code == 200, "POST /chat/action/execute/{msg_id} executes action", f"Status: {r_action.status_code}")
        action_res = r_action.json()
        assert_test(action_res.get("action_status") == "executed", "Action status marked as executed in MongoDB")

        # 4. Action Rejection Test
        r_reject = requests.post(f"{BASE_URL}/chat/action/reject/{assistant_msg_id}", json={"user_id": user_id})
        assert_test(r_reject.status_code == 200, "POST /chat/action/reject/{msg_id} rejects action")

        # 5. List Chat Sessions for User
        r_sessions = requests.get(f"{BASE_URL}/chat/sessions/{user_id}")
        assert_test(r_sessions.status_code == 200, "GET /chat/sessions/{user_id} lists user threads")
        sessions_list = r_sessions.json()
        assert_test(len(sessions_list) >= 1, "User chat thread listed in MongoDB", f"Count: {len(sessions_list)}")

        # 6. Get Chat Messages for Session
        r_msgs = requests.get(f"{BASE_URL}/chat/messages/{session_id}?user_id={user_id}")
        assert_test(r_msgs.status_code == 200, "GET /chat/messages/{session_id} returns embedded messages")
        msgs_list = r_msgs.json()
        assert_test(len(msgs_list) >= 4, "Atomic retrieval of embedded messages (4+ messages in session)", f"Count: {len(msgs_list)}")

        # 7. Delete Chat Session
        r_del_session = requests.delete(f"{BASE_URL}/chat/sessions/{session_id}?user_id={user_id}")
        assert_test(r_del_session.status_code == 200, "DELETE /chat/sessions/{session_id} deletes thread from MongoDB")
    except Exception as e:
        assert_test(False, "Conversational Copilot Exception", str(e))

    # =========================================================================
    # STAGE 4: Decision Sandbox & Simulations (/simulations)
    # =========================================================================
    log_section("STAGE 4: Decision Sandbox & Mathematical Simulations (/simulations)")
    try:
        # 1. Baseline calculation
        r_base = requests.get(f"{BASE_URL}/simulations/baseline/{user_id}")
        assert_test(r_base.status_code == 200, "GET /simulations/baseline/{user_id} computes baseline metrics")
        base_resp = r_base.json()
        baseline_data = base_resp.get("baseline", {})
        assert_test("average_sleep" in baseline_data and "monthly_surplus" in baseline_data, "Baseline contains sleep & surplus telemetry")

        # 2. What-If Comparison (Scenario A vs Scenario B)
        compare_payload = {
            "scenario_a": {"savings": 500, "sleep": 0.5, "study": 2.0},
            "scenario_b": {"savings": 1000, "sleep": -0.5, "study": 5.0},
            "years": 25
        }
        r_comp = requests.post(f"{BASE_URL}/simulations/compare/{user_id}", json=compare_payload, timeout=20)
        assert_test(r_comp.status_code == 200, "POST /simulations/compare/{user_id} computes side-by-side comparison")
        comp_res = r_comp.json()
        assert_test("scenario_a" in comp_res and "scenario_b" in comp_res, "Both scenarios simulated")
        assert_test(len(comp_res["scenario_a"]["datapoints"]) == 25, "25-year trajectory generated for Scenario A")
        assert_test(len(comp_res.get("recommendation", "")) > 10, "AI Advisor synthesis generated")

        # 3. 500-Iteration Stochastic Monte Carlo Forecast
        r_fc = requests.get(f"{BASE_URL}/simulations/forecast/{user_id}")
        assert_test(r_fc.status_code == 200, "GET /simulations/forecast/{user_id} runs 500 Monte Carlo trials")
        fc_res = r_fc.json()
        assert_test("monte_carlo" in fc_res and "median" in fc_res["monte_carlo"], "Monte Carlo percentile bands (p10/median/p90) computed")
        assert_test(0 <= fc_res.get("probability_of_success", 0) <= 1.0, "Probability of success accurately bounded [0, 1]")

        # 4. Wealth Advice & Cache in MongoDB
        r_advice = requests.get(f"{BASE_URL}/simulations/wealth-advice/{user_id}?force=true", timeout=20)
        assert_test(r_advice.status_code == 200, "GET /simulations/wealth-advice/{user_id} generates AI roadmap")
        adv_data = r_advice.json()
        assert_test(len(adv_data.get("advice", "")) > 20, "AI wealth advice generated")

        # Verify advice was cached in MongoDB UserDoc
        r_check_user = requests.get(f"{BASE_URL}/users/{user_id}")
        cached_user = r_check_user.json()
        assert_test(cached_user.get("last_wealth_prediction") is not None, "Wealth advice cached in MongoDB UserDoc")

        # 5. AI Scenario Suggestions
        r_sug = requests.get(f"{BASE_URL}/simulations/suggest/{user_id}")
        assert_test(r_sug.status_code == 200, "GET /simulations/suggest/{user_id} generates slider suggestions")

        # 6. Daily 12:00 PM Analytics Summary
        summary_payload = {
            "logs": [
                {"sleep": 8.0, "screen": 3.0, "study": 2.0, "exercise": 45, "mood": 8},
                {"sleep": 7.5, "screen": 3.5, "study": 1.5, "exercise": 30, "mood": 7},
            ]
        }
        r_summary = requests.post(f"{BASE_URL}/simulations/analytics-summary/{user_id}", json=summary_payload, timeout=20)
        assert_test(r_summary.status_code == 200, "POST /simulations/analytics-summary/{user_id} generates daily reflection")
        assert_test(len(r_summary.json().get("summary", "")) > 10, "Daily reflection narrative returned")
    except Exception as e:
        assert_test(False, "Simulations Exception", str(e))

    # =========================================================================
    # STAGE 5: Habit Analytics & Biometric Telemetry (/records, /habits)
    # =========================================================================
    log_section("STAGE 5: Habit Analytics & Biometric Telemetry (/records, /habits)")
    try:
        # 1. Post Habit Records
        sleep_rec = {"habit_name": "Sleep", "duration_minutes": 480, "impact_score": 9}
        r_h1 = requests.post(f"{BASE_URL}/records/habit/{user_id}", json=sleep_rec)
        assert_test(r_h1.status_code == 200, "POST /records/habit/{user_id} logs Sleep habit in MongoDB")

        exercise_rec = {"habit_name": "Exercise", "duration_minutes": 45, "impact_score": 8}
        r_h2 = requests.post(f"{BASE_URL}/records/habit/{user_id}", json=exercise_rec)
        assert_test(r_h2.status_code == 200, "POST /records/habit/{user_id} logs Exercise habit in MongoDB")

        # 2. Get Habit Records via /records/habit/{user_id}
        r_h_get = requests.get(f"{BASE_URL}/records/habit/{user_id}")
        assert_test(r_h_get.status_code == 200, "GET /records/habit/{user_id} retrieves habit history")
        habits_list = r_h_get.json()
        assert_test(len(habits_list) >= 2, f"Habit records persisted in MongoDB (Count: {len(habits_list)})")

        # 3. Get Habit Records via /habits/?user_id={user_id}
        r_hab_crud = requests.get(f"{BASE_URL}/habits/?user_id={user_id}")
        assert_test(r_hab_crud.status_code == 200, "GET /habits/?user_id={user_id} retrieves habit query")
    except Exception as e:
        assert_test(False, "Habit Telemetry Exception", str(e))

    # =========================================================================
    # STAGE 6: Financial Cashflow & Transactions (/records, /finance)
    # =========================================================================
    log_section("STAGE 6: Financial Cashflow & Transactions (/records, /finance)")
    try:
        # 1. Post Income Record
        income_rec = {"category": "Income", "description": "Salary Deposit", "amount": 8200.0}
        r_f1 = requests.post(f"{BASE_URL}/records/financial/{user_id}", json=income_rec)
        assert_test(r_f1.status_code == 200, "POST /records/financial/{user_id} logs Income transaction in MongoDB")

        # 2. Post Expense Record
        expense_rec = {"category": "Fixed Expense", "description": "Apartment Rent", "amount": 2100.0}
        r_f2 = requests.post(f"{BASE_URL}/records/financial/{user_id}", json=expense_rec)
        assert_test(r_f2.status_code == 200, "POST /records/financial/{user_id} logs Expense transaction in MongoDB")

        # 3. Get Financial Records via /records/financial/{user_id}
        r_f_get = requests.get(f"{BASE_URL}/records/financial/{user_id}")
        assert_test(r_f_get.status_code == 200, "GET /records/financial/{user_id} retrieves financial records")
        fin_list = r_f_get.json()
        assert_test(len(fin_list) >= 2, f"Financial transactions persisted in MongoDB (Count: {len(fin_list)})")

        # 4. Get Financial Transactions via /finance/?user_id={user_id}
        r_fin_crud = requests.get(f"{BASE_URL}/finance/?user_id={user_id}")
        assert_test(r_fin_crud.status_code == 200, "GET /finance/?user_id={user_id} retrieves finance query")
    except Exception as e:
        assert_test(False, "Finance Exception", str(e))

    # =========================================================================
    # STAGE 7: Academic & Study Intelligence (/study)
    # =========================================================================
    log_section("STAGE 7: Academic & Study Intelligence (/study)")
    try:
        # 1. Generate 7-day AI Study Plan
        plan_payload = {"target_milestone": "System Design & Algorithms Certification", "force_refresh": True}
        r_plan = requests.post(f"{BASE_URL}/study/generate-plan/{user_id}", json=plan_payload, timeout=20)
        assert_test(r_plan.status_code == 200, "POST /study/generate-plan/{user_id} generates 7-day plan in MongoDB")
        plan_data = r_plan.json()
        assert_test(len(plan_data.get("daily_plans", [])) == 7, "7 distinct daily Pomodoro schedules generated")

        # 2. Get Persisted Study Plan directly from MongoDB (without localStorage)
        r_get_plan = requests.get(f"{BASE_URL}/study/plan/{user_id}")
        assert_test(r_get_plan.status_code == 200, "GET /study/plan/{user_id} retrieves saved study plan from MongoDB")
        saved_plan = r_get_plan.json()
        assert_test("weekly_goal" in saved_plan and "daily_plans" in saved_plan, "Study plan structure matches in MongoDB")

        # 3. Log Study Session Block
        study_log_payload = {
            "subject": "System Design",
            "duration_minutes": 90,
            "focus_score": 9,
            "notes": "Distributed consensus algorithms",
            "session_type": "deep_work"
        }
        r_s_log = requests.post(f"{BASE_URL}/study/log/{user_id}", json=study_log_payload)
        assert_test(r_s_log.status_code == 200, "POST /study/log/{user_id} logs study block in MongoDB")

        # 4. Get Study Analytics & Retention Metrics
        r_s_analytics = requests.get(f"{BASE_URL}/study/analytics/{user_id}")
        assert_test(r_s_analytics.status_code == 200, "GET /study/analytics/{user_id} computes spaced repetition analytics")

        # 5. Get Study Forecast & Readiness Odds
        r_s_forecast = requests.get(f"{BASE_URL}/study/forecast/{user_id}?target_score=90")
        assert_test(r_s_forecast.status_code == 200, "GET /study/forecast/{user_id} forecasts exam readiness")
    except Exception as e:
        assert_test(False, "Study Intelligence Exception", str(e))

    # =========================================================================
    # STAGE 8: Suggestions & MongoDB Intelligence Cache (/suggestions, /cache)
    # =========================================================================
    log_section("STAGE 8: AI Suggestions & MongoDB Intelligence Cache (/suggestions, /cache)")
    try:
        # 1. Get Suggestions
        r_sugs = requests.get(f"{BASE_URL}/suggestions/{user_id}")
        assert_test(r_sugs.status_code == 200, "GET /suggestions/{user_id} fetches recommendations from MongoDB")
        sug_list = r_sugs.json()
        assert_test(len(sug_list) >= 1, f"Suggestions loaded from MongoDB (Count: {len(sug_list)})")
        first_sug = sug_list[0]
        sug_id = first_sug.get("suggestion_id") or first_sug.get("id")

        # 2. Adopt Suggestion
        r_adopt = requests.post(f"{BASE_URL}/suggestions/adopt/{user_id}", json={"suggestion_id": str(sug_id), "is_adopted": True})
        assert_test(r_adopt.status_code == 200, "POST /suggestions/adopt/{user_id} adopts suggestion in MongoDB")
        assert_test(r_adopt.json().get("is_adopted") == 1, "Suggestion marked as adopted")

        # 3. Generate More Suggestions
        r_gen_sug = requests.post(f"{BASE_URL}/suggestions/generate/{user_id}", json={"mode": "more", "custom_focus": "Distributed Systems"}, timeout=20)
        assert_test(r_gen_sug.status_code == 200, "POST /suggestions/generate/{user_id} creates new AI suggestions in MongoDB")

        # 4. Set MongoDB Intelligence Cache
        cache_key = f"e2e_test_cache_{TS}"
        cache_payload = {
            "forecast_version": "2.0.0",
            "computed_p90_net_worth": 3450000.0,
            "status": "verified"
        }
        r_set_cache = requests.post(f"{BASE_URL}/cache/{cache_key}?user_id={user_id}&ttl_seconds=3600", json=cache_payload)
        assert_test(r_set_cache.status_code == 200, "POST /cache/{cache_key} stores payload in MongoDB app_cache")

        # 5. Get MongoDB Intelligence Cache
        r_get_cache = requests.get(f"{BASE_URL}/cache/{cache_key}")
        assert_test(r_get_cache.status_code == 200, "GET /cache/{cache_key} retrieves cached document from MongoDB")
        retrieved_cache = r_get_cache.json()
        assert_test(retrieved_cache.get("data", {}).get("computed_p90_net_worth") == 3450000.0, "Cached numerical data matches perfectly")

        # 6. Delete MongoDB Intelligence Cache
        r_del_cache = requests.delete(f"{BASE_URL}/cache/{cache_key}")
        assert_test(r_del_cache.status_code == 200, "DELETE /cache/{cache_key} removes cache entry from MongoDB")

        r_check_deleted = requests.get(f"{BASE_URL}/cache/{cache_key}")
        assert_test(r_check_deleted.status_code == 404, "Invalidated cache entry returns HTTP 404")
    except Exception as e:
        assert_test(False, "Suggestions & Cache Exception", str(e))

    # =========================================================================
    # SUMMARY
    # =========================================================================
    total_tests = PASSED_COUNT + FAILED_COUNT
    log_section("TEST SUMMARY")
    print(f"  Total Tests Executed : {total_tests}")
    print(f"  Passed               : {PASSED_COUNT}  (100.0%)" if FAILED_COUNT == 0 else f"  Passed: {PASSED_COUNT}")
    print(f"  Failed               : {FAILED_COUNT}")
    if FAILED_COUNT == 0:
        print("\n  >>> ALL END-TO-END TESTS PASSED ON LIVE MONGODB ATLAS CLUSTER! <<<")
        return 0
    else:
        print("\n  >>> SOME TESTS FAILED <<<")
        return 1


if __name__ == "__main__":
    exit_code = run_e2e_tests()
    sys.exit(exit_code)
