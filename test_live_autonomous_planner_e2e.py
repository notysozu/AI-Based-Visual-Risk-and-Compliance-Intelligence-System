import json
import time
import requests

BASE_URL = "http://127.0.0.1:8000"

def run_e2e():
    print("\n=======================================================")
    print("  AUTONOMOUS AI PLANNER & DIRECT DB IMPLEMENTATION E2E")
    print("=======================================================\n")

    # 1. Create a dedicated test user
    username = f"autouser_{int(time.time())}"
    email = f"{username}@example.com"
    r = requests.post(f"{BASE_URL}/users/", json={
        "username": username,
        "email": email,
        "role": "entrepreneur",
        "age": 29,
        "monthly_income": 8000.0,
        "monthly_expenses": 3500.0,
        "net_worth": 45000.0,
        "goal_name": "Series A Runway",
        "goal_target": 100000.0,
        "goal_current": 45000.0,
        "autonomy_mode": "full_autonomous",
        "auto_planner_enabled": True
    })
    assert r.status_code == 200, f"User creation failed: {r.text}"
    user_data = r.json()
    user_id = str(user_data["id"])
    print(f"[Pass] 1. Created test user: {username} (ID: {user_id}, Role: entrepreneur)")

    # 2. Test POST /planner/auto-plan/{user_id}
    r = requests.post(f"{BASE_URL}/planner/auto-plan/{user_id}", json={"force": True})
    assert r.status_code == 200, f"Auto plan failed: {r.text}"
    plan_data = r.json()
    assert plan_data["status"] == "success"
    assert plan_data["auto_committed"] is True
    assert len(plan_data["tasks"]) >= 3
    assert len(plan_data["briefing"]) > 20
    print(f"[Pass] 2. Autonomous Daily Plan Generated: {len(plan_data['tasks'])} tasks synthesized.")
    for idx, t in enumerate(plan_data["tasks"]):
        print(f"       - Task {idx+1}: [{t['start']}] {t['title']} ({t['category']}, {t['minutes']}m)")

    # 3. Verify Direct MongoDB Persistence in User Profile (tasks_json)
    r = requests.get(f"{BASE_URL}/users/{user_id}")
    assert r.status_code == 200
    u_fresh = r.json()
    assert u_fresh.get("tasks_json") is not None
    stored_tasks = json.loads(u_fresh["tasks_json"])
    assert len(stored_tasks) == len(plan_data["tasks"])
    assert u_fresh.get("last_auto_planned_date") is not None
    assert u_fresh.get("last_auto_plan_briefing") is not None
    print(f"[Pass] 3. Direct DB Implementation verified in UserDoc (tasks_json holds {len(stored_tasks)} tasks).")

    # 4. Verify Direct MongoDB Persistence in User Suggestions
    r = requests.get(f"{BASE_URL}/suggestions/{user_id}")
    assert r.status_code == 200
    sug_data = r.json()
    auto_suggs = [s for s in sug_data.get("suggestions", []) if s.get("is_adopted")]
    assert len(auto_suggs) >= 3
    print(f"[Pass] 4. UserSuggestionDoc synchronized with is_adopted=1 ({len(auto_suggs)} adopted suggestions).")

    # 5. Test GET /planner/auto-plan/status/{user_id}
    r = requests.get(f"{BASE_URL}/planner/auto-plan/status/{user_id}")
    assert r.status_code == 200
    stat = r.json()
    assert stat["is_planned_today"] is True
    assert stat["today_task_count"] >= 3
    assert stat["autonomy_mode"] == "full_autonomous"
    print(f"[Pass] 5. Status endpoint verified: {stat['today_task_count']} tasks active for today.")

    # 6. Test Chat Auto-Execution in Full Autonomy Mode
    r = requests.post(f"{BASE_URL}/chat/message/create_thread", json={
        "user_id": user_id,
        "prompt": "Suggest tasks for my day to boost my startup growth",
        "think_mode": False
    })
    assert r.status_code == 200
    chat_data = r.json()
    asst_msg = chat_data["assistant_message"]
    assert asst_msg["action_type"] in ["add_multiple_tasks", "add_task"]
    assert asst_msg["action_status"] == "executed"
    print(f"[Pass] 6. Chat Turn in Full Autonomy: action '{asst_msg['action_type']}' auto-executed (status: {asst_msg['action_status']}).")

    # 7. Test Autonomy Mode Toggle to Supervised
    r = requests.put(f"{BASE_URL}/planner/autonomy-mode/{user_id}", json={
        "autonomy_mode": "supervised",
        "auto_planner_enabled": False
    })
    assert r.status_code == 200
    mode_data = r.json()
    assert mode_data["autonomy_mode"] == "supervised"
    assert mode_data["auto_planner_enabled"] is False
    print("[Pass] 7. Autonomy Mode switched to 'supervised' (HITL confirmation required).")

    # 8. Test Chat in Supervised Mode requires approval
    r = requests.post(f"{BASE_URL}/chat/message/create_thread", json={
        "user_id": user_id,
        "prompt": "Plan 90 minutes of founder leverage deep work at 10am",
        "think_mode": False
    })
    assert r.status_code == 200
    chat_sup = r.json()
    asst_sup = chat_sup["assistant_message"]
    assert asst_sup["action_status"] == "proposed"
    print(f"[Pass] 8. Chat Turn in Supervised Mode: proposal generated with action_status '{asst_sup['action_status']}' awaiting approval.")

    print("\n=======================================================")
    print("  ALL 8 AUTONOMOUS PLANNING & EXECUTION TESTS PASSED!")
    print("=======================================================\n")

if __name__ == "__main__":
    run_e2e()
