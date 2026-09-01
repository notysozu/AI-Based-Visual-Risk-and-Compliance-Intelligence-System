# API Reference & Endpoints — Visual Risk AI

This document provides complete technical specifications, request models, query parameters, curl examples, and JSON response payloads for all 21 endpoints in the Visual Risk AI (VRCI) backend.

---

## Endpoint Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health and service connectivity check |
| `POST` | `/users/` | Create a new user profile with email and username uniqueness validation |
| `POST` | `/users/login` | Authenticate user by either email or username |
| `GET` | `/users/{user_id}` | Retrieve user profile, cached predictions, and role |
| `PUT` | `/users/{user_id}` | Update profile metrics, target age, net worth, and role settings |
| `GET` | `/chat/sessions/{user_id}` | List all chat sessions strictly belonging to the user |
| `POST` | `/chat/message/create_thread` | Create a new conversation thread with AI-summarized title |
| `POST` | `/chat/message/{session_id}` | Send message and execute 4-stage Copilot reasoning pipeline |
| `POST` | `/chat/action/execute/{message_id}` | Approve and commit proposed Copilot action to database |
| `POST` | `/chat/action/reject/{message_id}` | Dismiss proposed Copilot action |
| `DELETE` | `/chat/sessions/{session_id}` | Delete a chat session with ownership verification |
| `GET` | `/simulations/forecast/{user_id}` | Monte Carlo forecast with percentile curves and success odds |
| `GET` | `/simulations/wealth-advice/{user_id}` | AI wealth coach guidance with cache invalidation support |
| `POST` | `/simulations/compare/{user_id}` | Evaluate Scenario A vs. Scenario B tradeoff analysis |
| `POST` | `/simulations/analytics-summary/{user_id}` | AI daily habit analysis narrative (noon milestone cache) |
| `GET` | `/suggestions/{user_id}` | Retrieve persisted suggestions or initialize persona defaults |
| `POST` | `/suggestions/generate/{user_id}` | AI pre-analysis of habit logs to regenerate or expand suggestions |
| `POST` | `/suggestions/adopt/{user_id}` | Toggle suggestion adoption status and sync with database |
| `POST` | `/suggestions/reset/{user_id}` | Reset suggestions back to role default baseline |
| `GET` | `/records/habit/{user_id}` | Retrieve historical habit logs |
| `POST` | `/records/habit/{user_id}` | Record daily sleep, screen, study, and mood log |

---

## Detailed Endpoint Reference & Example Payloads

---

### 1. System Health Check — `GET /health`

Checks server runtime status, database connectivity, and active background services.

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X GET http://127.0.0.1:8000/health \
  -H "Accept: application/json"
```

**Example Response (200 OK):**
```json
{
  "status": "healthy",
  "environment": "production",
  "version": "2.4.0",
  "uptime_seconds": 86400
}
```

</details>

---

### 2. User Registration — `POST /users/`

Registers a new user profile, validating that both username and email are unique across the database.

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8000/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alex_developer",
    "email": "alex@example.com",
    "role": "professional",
    "age": 28,
    "retirement_goal_age": 60,
    "target_net_worth": 1200000.0,
    "monthly_income": 6500.0,
    "monthly_expenses": 3200.0,
    "net_worth": 45000.0,
    "sleep_target_hours": 8.0,
    "study_target_hours_week": 10.0,
    "is_onboarded": 0
  }'
```

**Example Response (200 OK):**
```json
{
  "id": 1,
  "username": "alex_developer",
  "email": "alex@example.com",
  "role": "professional",
  "age": 28,
  "retirement_goal_age": 60,
  "target_net_worth": 1200000.0,
  "monthly_income": 6500.0,
  "monthly_expenses": 3200.0,
  "net_worth": 45000.0,
  "sleep_target_hours": 8.0,
  "study_target_hours_week": 10.0,
  "is_onboarded": 0,
  "created_at": "2026-09-01T12:00:00"
}
```

</details>

---

### 3. User Authentication — `POST /users/login`

Authenticates a user via either their registered email address or username.

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "alex@example.com"
  }'
```

**Example Response (200 OK):**
```json
{
  "id": 1,
  "username": "alex_developer",
  "email": "alex@example.com",
  "role": "professional",
  "age": 28,
  "retirement_goal_age": 60,
  "target_net_worth": 1200000.0,
  "monthly_income": 6500.0,
  "monthly_expenses": 3200.0,
  "net_worth": 45000.0,
  "sleep_target_hours": 8.0,
  "study_target_hours_week": 10.0,
  "is_onboarded": 1
}
```

</details>

---

### 4. Retrieve User Profile — `GET /users/{user_id}`

Fetches full telemetry parameters, goal settings, role, and cached AI diagnostics for a given user.

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X GET http://127.0.0.1:8000/users/1 \
  -H "Accept: application/json"
```

**Example Response (200 OK):**
```json
{
  "id": 1,
  "username": "alex_developer",
  "email": "alex@example.com",
  "role": "professional",
  "age": 28,
  "retirement_goal_age": 60,
  "target_net_worth": 1200000.0,
  "monthly_income": 6500.0,
  "monthly_expenses": 3200.0,
  "net_worth": 45000.0,
  "sleep_target_hours": 8.0,
  "study_target_hours_week": 10.0,
  "is_onboarded": 1
}
```

</details>

---

### 5. Update User Profile — `PUT /users/{user_id}`

Updates profile settings, income, expenses, sleep targets, scenario slider presets, or onboarding status.

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X PUT http://127.0.0.1:8000/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "monthly_income": 7200.0,
    "monthly_expenses": 3400.0,
    "sleep_target_hours": 7.5,
    "is_onboarded": 1
  }'
```

**Example Response (200 OK):**
```json
{
  "id": 1,
  "username": "alex_developer",
  "email": "alex@example.com",
  "role": "professional",
  "monthly_income": 7200.0,
  "monthly_expenses": 3400.0,
  "sleep_target_hours": 7.5,
  "is_onboarded": 1
}
```

</details>

---

### 6. List Chat Sessions — `GET /chat/sessions/{user_id}`

Returns all conversational sessions belonging to the user. Automatically initializes a tutorial guide thread if none exist.

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X GET http://127.0.0.1:8000/chat/sessions/1 \
  -H "Accept: application/json"
```

**Example Response (200 OK):**
```json
[
  {
    "id": 101,
    "user_id": 1,
    "title": "Laptop Purchase Simulation",
    "created_at": "2026-09-01T10:15:00",
    "updated_at": "2026-09-01T10:16:30",
    "message_count": 4,
    "last_message_preview": "Recorded your $1,200 purchase tradeoff."
  },
  {
    "id": 100,
    "user_id": 1,
    "title": "Tutorial",
    "created_at": "2026-08-30T09:00:00",
    "updated_at": "2026-08-30T09:00:00",
    "message_count": 1,
    "last_message_preview": "Welcome to your Digital Twin AI Copilot."
  }
]
```

</details>

---

### 7. Create Thread & Send First Message — `POST /chat/message/create_thread`

Creates a new conversational thread with an auto-generated AI summary title and processes the user prompt through the 4-stage reasoning pipeline.

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8000/chat/message/create_thread \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "prompt": "If I buy a $1,200 laptop today, how does that affect my emergency fund goal?",
    "think_mode": true
  }'
```

**Example Response (200 OK):**
```json
{
  "session": {
    "id": 102,
    "user_id": 1,
    "title": "Laptop Purchase Simulation",
    "created_at": "2026-09-01T14:30:00",
    "updated_at": "2026-09-01T14:30:00"
  },
  "user_message": {
    "id": 501,
    "session_id": 102,
    "role": "user",
    "content": "If I buy a $1,200 laptop today, how does that affect my emergency fund goal?",
    "action_type": "none",
    "action_payload": null,
    "action_status": "none"
  },
  "assistant_message": {
    "id": 502,
    "session_id": 102,
    "role": "assistant",
    "content": "<think>\nStep 1 — Goal Definition: Model capital friction of $1,200 purchase.\nStep 2 — Telemetry Search: Monthly savings surplus = $3,800/mo.\nStep 3 — Multi-Criteria Analysis: Emergency fund delayed by 0.3 months. 5-year opportunity cost at 8% CAGR is $1,763.\nStep 4 — Formulate Plan: Output decision matrix and 1-click execution proposal.\n</think>\n\n### Purchase Impact Analysis: Laptop ($1,200.00)\n\n| Financial Parameter | Current Baseline | Post-Purchase Trajectory | Variance |\n| :--- | :--- | :--- | :--- |\n| **Liquid Capital** | $45,000.00 | $43,800.00 | -$1,200.00 |\n| **Emergency Fund Target** | Month 4 | Month 4.3 | +9 Days |\n| **5-Yr Compounding Opportunity Cost** | 8% CAGR Baseline | -$1,763.19 Future Value | -$563.19 Interest Lost |\n| **Retirement Probability (Age 60)** | 84.2% | 83.9% | -0.3% |",
    "action_type": "purchase_impact",
    "action_payload": "{\"item_name\":\"Laptop\",\"cost\":1200.0,\"category\":\"Electronics\",\"delay_months\":0.3,\"opp_cost_5yr\":1763.19}",
    "action_status": "proposed"
  }
}
```

</details>

---

### 8. Send Message in Existing Session — `POST /chat/message/{session_id}`

Appends a user prompt to an existing thread, incorporates the conversation history, and returns the Copilot's reasoning and action proposal.

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8000/chat/message/102 \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "prompt": "Add a 45 min deep work sprint at 10:00 AM",
    "think_mode": true
  }'
```

**Example Response (200 OK):**
```json
{
  "user_message": {
    "id": 503,
    "session_id": 102,
    "role": "user",
    "content": "Add a 45 min deep work sprint at 10:00 AM"
  },
  "assistant_message": {
    "id": 504,
    "session_id": 102,
    "role": "assistant",
    "content": "### Focus Block Scheduled: Deep Work Sprint (45 mins)\n\nScheduled 45 minutes of Deep Work Sprint from 10:00 AM to 10:45 AM during your peak circadian cortisol window.",
    "action_type": "add_task",
    "action_payload": "{\"title\":\"Deep Work Sprint\",\"category\":\"focus\",\"start_time\":\"10:00\",\"duration_minutes\":45}",
    "action_status": "proposed"
  }
}
```

</details>

---

### 9. Execute Proposed Action — `POST /chat/action/execute/{message_id}`

Approves and commits a proposed Copilot action into the database.

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8000/chat/action/execute/504 \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1
  }'
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message_id": 504,
  "action_type": "add_task",
  "action_status": "executed",
  "result": {
    "task_id": "2026-09-01-1725192000",
    "title": "Deep Work Sprint",
    "category": "focus",
    "duration_minutes": 45,
    "status": "scheduled"
  }
}
```

</details>

---

### 10. Reject Proposed Action — `POST /chat/action/reject/{message_id}`

Dismisses a proposed Copilot action and marks its status as rejected in the message history.

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8000/chat/action/reject/504 \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1
  }'
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message_id": 504,
  "action_status": "rejected"
}
```

</details>

---

### 11. Delete Chat Session — `DELETE /chat/sessions/{session_id}`

Deletes a chat thread and all associated messages after verifying user ownership.

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X DELETE "http://127.0.0.1:8000/chat/sessions/102?user_id=1" \
  -H "Accept: application/json"
```

**Example Response (200 OK):**
```json
{
  "message": "Chat session deleted successfully",
  "session_id": 102
}
```

</details>

---

### 12. Monte Carlo Wealth Forecast — `GET /simulations/forecast/{user_id}`

Executes 500 stochastic trials combined with deterministic compound interest projections to retirement age.

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X GET http://127.0.0.1:8000/simulations/forecast/1 \
  -H "Accept: application/json"
```

**Example Response (200 OK):**
```json
{
  "deterministic": [
    { "age": 28, "year": 2026, "net_worth": 45000.0 },
    { "age": 29, "year": 2027, "net_worth": 94200.0 },
    { "age": 60, "year": 2058, "net_worth": 1845200.0 }
  ],
  "monte_carlo": {
    "years": [2026, 2027, 2030, 2040, 2050, 2058],
    "ages": [28, 29, 32, 42, 52, 60],
    "median": [45000.0, 93100.0, 268400.0, 894000.0, 1420000.0, 1812000.0],
    "p10": [45000.0, 78400.0, 185000.0, 540000.0, 910000.0, 1140000.0],
    "p90": [45000.0, 112000.0, 360000.0, 1340000.0, 2210000.0, 2950000.0]
  },
  "probability_of_success": 0.842
}
```

</details>

---

### 13. AI Wealth Advisor Guidance — `GET /simulations/wealth-advice/{user_id}`

Generates persona-specific strategic wealth guidance with dynamic caching and forced recalculation support (`?force=true`).

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X GET "http://127.0.0.1:8000/simulations/wealth-advice/1?force=false" \
  -H "Accept: application/json"
```

**Example Response (200 OK):**
```json
{
  "advice": "### Strategic Wealth Roadmap for Working Professional\n\n- **Savings Optimization:** Your $3,800 monthly surplus represents a 52.8% savings rate.\n- **Asset Allocation:** Direct $1,500/month to tax-advantaged index funds to secure your $1.2M goal by age 60.\n- **Risk Buffer:** Maintain $19,200 (6 months expenses) in high-yield liquid cash."
}
```

</details>

---

### 14. Decision Sandbox Comparison — `POST /simulations/compare/{user_id}`

Evaluates two competing lifestyle scenarios (Scenario A vs. Scenario B), computing biological feedback, cognitive focus elasticity, and 5-year financial trajectory divergence.

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8000/simulations/compare/1 \
  -H "Content-Type: application/json" \
  -d '{
    "scenario_a": {
      "sleep_hours": 7.5,
      "study_hours_week": 10.0,
      "monthly_savings": 3800.0,
      "screen_time_hours": 3.0,
      "exercise_days_week": 4
    },
    "scenario_b": {
      "sleep_hours": 6.0,
      "study_hours_week": 20.0,
      "monthly_savings": 4200.0,
      "screen_time_hours": 4.5,
      "exercise_days_week": 2
    }
  }'
```

**Example Response (200 OK):**
```json
{
  "scenario_a": {
    "health_score": 8.8,
    "focus_score": 8.4,
    "5yr_net_worth": 312400.0,
    "burnout_risk": "Low"
  },
  "scenario_b": {
    "health_score": 6.2,
    "focus_score": 7.1,
    "5yr_net_worth": 341800.0,
    "burnout_risk": "High"
  },
  "analysis": "Scenario A preserves sustainable cognitive endurance (+1.3 Focus) with minimal financial divergence over a 5-year horizon.",
  "recommended_scenario": "A"
}
```

</details>

---

### 15. Daily Analytics Reflection Cache — `POST /simulations/analytics-summary/{user_id}`

Generates and caches a daily habit review narrative, automatically invalidating at 12:00 PM local time.

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8000/simulations/analytics-summary/1 \
  -H "Content-Type: application/json" \
  -d '{
    "logs": [
      { "date": "2026-08-31", "sleep": 7.5, "screen": 3.0, "study": 2.0, "exercise": 1, "mood": 8 },
      { "date": "2026-09-01", "sleep": 8.0, "screen": 2.5, "study": 3.0, "exercise": 1, "mood": 9 }
    ]
  }'
```

**Example Response (200 OK):**
```json
{
  "summary": "### Daily Habit Reflection\n\nYour 7-day average sleep of 7.8 hours correlates with a +18% increase in sustained afternoon focus. Screen time remained below your 3.5h cap."
}
```

</details>

---

### 16. Retrieve Suggestions — `GET /suggestions/{user_id}`

Retrieves active AI recommendations or initializes persona-specific baseline habits.

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X GET http://127.0.0.1:8000/suggestions/1 \
  -H "Accept: application/json"
```

**Example Response (200 OK):**
```json
{
  "user_id": 1,
  "role": "professional",
  "lifestyle_diagnostic": "Analyzed Professional profile · Sleep: 7.8h · Screen: 2.8h · Focus: 2.5h/day",
  "suggestions": [
    {
      "id": "sug-101",
      "category": "health",
      "title": "Circadian Sleep Lock",
      "description": "Maintain consistent 22:30 wind-down to protect REM sleep elasticity.",
      "estimated_impact": "+1.2 Vitality",
      "timeframe": "Daily",
      "is_adopted": 1,
      "difficulty": "medium"
    },
    {
      "id": "sug-102",
      "category": "finance",
      "title": "Automate Surplus Sweep",
      "description": "Transfer $1,500 on payday directly into retirement index allocations.",
      "estimated_impact": "+$48k 5-Yr Net Worth",
      "timeframe": "Monthly",
      "is_adopted": 0,
      "difficulty": "easy"
    }
  ]
}
```

</details>

---

### 17. Generate AI Suggestions — `POST /suggestions/generate/{user_id}`

Performs heuristic and LLM pre-analysis on user habit logs to generate fresh recommendations (`mode="regenerate"`) or append complementary actions (`mode="more"`).

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8000/suggestions/generate/1 \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "more"
  }'
```

**Example Response (200 OK):**
```json
{
  "user_id": 1,
  "role": "professional",
  "lifestyle_diagnostic": "Analyzed Professional profile · Sleep: 7.8h · Screen: 2.8h · Focus: 2.5h/day",
  "suggestions": [
    {
      "id": "sug-103",
      "category": "study",
      "title": "Mid-Morning Deep Sprint",
      "description": "Block 90 minutes of distraction-free architecture design at 09:30.",
      "estimated_impact": "+2.0 Cognitive Focus",
      "timeframe": "Daily",
      "is_adopted": 0,
      "difficulty": "hard"
    }
  ]
}
```

</details>

---

### 18. Toggle Suggestion Adoption — `POST /suggestions/adopt/{user_id}`

Toggles the adoption state of a recommendation and commits the status directly into the database.

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8000/suggestions/adopt/1 \
  -H "Content-Type: application/json" \
  -d '{
    "suggestion_id": "sug-102",
    "is_adopted": 1
  }'
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "suggestion_id": "sug-102",
  "is_adopted": 1
}
```

</details>

---

### 19. Reset Suggestions — `POST /suggestions/reset/{user_id}`

Resets all suggestions back to the default baseline for the user's role persona.

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8000/suggestions/reset/1 \
  -H "Content-Type: application/json"
```

**Example Response (200 OK):**
```json
{
  "status": "success",
  "message": "Suggestions reset to professional baseline defaults"
}
```

</details>

---

### 20. Retrieve Habit Records — `GET /records/habit/{user_id}`

Fetches historical habit logs (sleep, screen time, exercise, mood) from the database.

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X GET "http://127.0.0.1:8000/records/habit/1?limit=7" \
  -H "Accept: application/json"
```

**Example Response (200 OK):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "date": "2026-09-01",
    "habit_name": "Exercise",
    "duration_minutes": 60,
    "impact_score": 9,
    "notes": "Gym workout session"
  },
  {
    "id": 2,
    "user_id": 1,
    "date": "2026-09-01",
    "habit_name": "Sleep",
    "duration_minutes": 480,
    "impact_score": 8,
    "notes": "Restorative sleep"
  }
]
```

</details>

---

### 21. Log Habit Activity — `POST /records/habit/{user_id}`

Records a daily biometric habit (sleep duration, workout session, or screen time).

<details>
<summary><b>Show Example Request & Response</b></summary>

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8000/records/habit/1 \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-09-01",
    "habit_name": "Exercise",
    "duration_minutes": 60,
    "impact_score": 9,
    "notes": "1-hour strength training"
  }'
```

**Example Response (200 OK):**
```json
{
  "id": 3,
  "user_id": 1,
  "date": "2026-09-01",
  "habit_name": "Exercise",
  "duration_minutes": 60,
  "impact_score": 9,
  "notes": "1-hour strength training"
}
```

</details>

---

*Back to [README.md](../README.md)*
