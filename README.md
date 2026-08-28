# Digital Twin AI — Multi-Persona Life & Financial Simulation Engine

Digital Twin AI is an agentic, intelligent decision-support system that models, forecasts, and optimizes a user's life trajectory across finances, health, cognitive performance, and daily habits.

By combining stochastic Monte Carlo simulations, deterministic compound growth algorithms, biological circadian feedback models, and conversational agentic intelligence (Groq GPT-OSS 120B / 20B & Qwen 3.6), the platform creates a living digital twin tailored to the user's specific life stage.

---

## Core Capabilities

### 1. Digital Twin Copilot & Conversational Agent
- **Fullscreen Interface (`/chat`)**: Modern conversational interface with collapsible sidebar, session history, and instant draft initialization without URL pollution.
- **4-Stage Agentic Reasoning Pipeline**:
  - **Step 1 — Goal Definition**: Explicitly decomposes user intent into optimization objectives.
  - **Step 2 — Telemetry Search & Data Gathering**: Queries real database records (sleep duration, sleep debt, screen time, study subjects, cash surplus, milestone progress).
  - **Step 3 — Multi-Criteria Analysis & Optimization**: Evaluates circadian alertness peaks (08:30–11:30), task load balancing, and elasticity projections (+1.8 Focus, +1.0 Vitality).
  - **Step 4 — Formulated Strategic Execution Plan**: Renders unbroken Markdown tables and interactive action proposals.
- **Step-by-Step Thought Process (`<think>`)**: Real-time collapsible reasoning disclosure detailing mathematical models, boundary checks, and intermediate metrics.
- **Voice Input (Speech-to-Text)**: Native browser voice dictation powered by the Web Speech API.

### 2. Interactive Multi-Action Execution Engine
Every Copilot recommendation includes an interactive, 1-click execution card:
- **`add_multiple_tasks`**: Batch daily routine injection directly into the Daily Task Planner.
- **`add_task`**: Single time-block scheduling with custom duration, start time, and category.
- **`purchase_impact`**: Real-time capital friction analysis against active milestones, 5-year compounding opportunity cost (8% CAGR), and Monte Carlo retirement odds variance.
- **`simulate_what_if`**: Instant lifestyle tradeoff sandboxing with 1-click scenario adoption.
- **`wealth_forecast`**: 500-run stochastic projection with percentile bands (p10, median, p90) and retirement attainment probability.
- **`update_settings`**: In-chat profile parameter modification (income, expenses, sleep targets, retirement age) with 1-click database commit.

### 3. Interactive Settings & Telemetry Control Center (`/settings`)
5 Dedicated configuration panels with live state reactivity:
1. **Persona & Role**: 5 interactive cards (Student, Professional, Freelancer, Entrepreneur, Retiree) with live previews.
2. **Biometrics & Daily Routine**: Interactive sliders for sleep baseline, study hours, screen time caps, and 7-day exercise selector.
3. **Financial Telemetry**: Monthly surplus calculator, net worth, 5-year compounding preview, and milestone progress.
4. **AI Intelligence Engine**: `<think>` reasoning toggle, Monte Carlo trial depth (250/500/1000), and proactive scheduling sensitivity.
5. **System & Data**: Theme toggles (Light/Dark), one-click JSON telemetry export, onboarding wizard rerun, and factory reset.

### 4. Financial Twin & Monte Carlo Forecasting
- **500-Iteration Stochastic Wealth Simulations**: Log-normal market volatility simulations with percentile bounds (p10 Bear, p50 Median, p90 Bull).
- **Adaptive Multi-Scale Charts**: Dynamic Y-axis scaling handling values from student allowances in hundreds/thousands to venture founders and retirees in millions.
- **Intelligent Prediction Caching**: Automatic caching of computationally heavy forecasts for fast rendering.

### 5. Decision Sandbox ("What-If" Simulator)
- **Side-by-Side Comparison**: Real-time evaluation of competing lifestyle scenarios (Scenario A vs. Scenario B).
- **Multi-Variable Tradeoff Modeling**: Sleep hours vs. Health Index vs. Cognitive Focus vs. 5-Year Net Worth trajectory.
- **1-Click Adoption**: Seamlessly apply winning scenario parameters to your live profile.

### 6. Universal Habit Analytics & Noon Reflection Cache
- **Grouped Correlation Visualizations**: Sleep vs. Focus, Screen Time vs. Mood, Exercise vs. Vitality.
- **Automated Noon AI Reflection Cache**: Automatically generates and caches fresh daily insights at 12:00 PM local time.

### 7. Robust Authentication & Security
- **Unified Login (`POST /users/login`)**: Supports seamless authentication by either email or username.
- **Dual Uniqueness Verification**: Prevents database collisions on user signup (`users.username` and `users.email`).
- **Auto-Recovery**: Seamlessly links existing accounts if a user attempts to re-register with an existing email.
- **Session Isolation**: Chat sessions and action approvals enforce strict `user_id` ownership verification (403 Forbidden on mismatch).

---

## The 5 User Personas

| Persona | Core Focus | Inflow Label | Baseline Net Worth | Target Horizon | Focus / Learning Metric |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Student** | Exams, coursework & allowance savings | Pocket Money / Allowance | Saved Allowance ($1.6k) | Career Launch Age ($12k–$30k) | Coursework & Study Blocks |
| **Working Professional** | Salaried career, 401(k) & retirement | Monthly Take-Home Salary | Current Net Worth ($48k) | Retirement Age ($1.2M) | Upskilling & Deep Work |
| **Freelancer / Creator** | Client contracts, invoices & runway | Average Invoiced Revenue | Cash Buffer & Portfolio ($35k) | Financial Freedom Age ($850k) | Skill Building & Inbound |
| **Founder / Entrepreneur**| Venture sprints, equity & runway | Founder Draw / Income | Capital Reserve ($90k) | Exit / Valuation Age ($3.0M) | Strategy & Product Sprints |
| **Retiree / Senior** | Longevity, health buffer & legacy | Monthly Pension / Passive | Nest Egg ($520k) | Longevity Target Age ($650k) | Reading & Daily Vitality |

---

## System Architecture

```
+-----------------------------------------------------------------------------+
|                            FRONTEND CLIENT (React 19)                       |
|  * Fullscreen Copilot Chat (/chat)        * Decision Sandbox (/simulator)   |
|  * Wealth Forecast Engine (/wealth)       * Interactive Settings (/settings)|
|  * Habit Analytics (/analytics)           * Daily Task Planner (/tasks)     |
+--------------------------------------┬--------------------------------------+
                                       | REST / JSON
+--------------------------------------v--------------------------------------+
|                            BACKEND API (FastAPI)                            |
|  * /chat (Sessions, Messages, Actions)    * /simulations (Monte Carlo, What-If)
|  * /users (Auth, CRUD, Telemetry)         * /suggestions (AI Task Generator)|
|  * /records (Habits, Study Sessions)      * /study (Analytics, Forecasts)   |
+------------------┬-------------------------------------------┬--------------+
                   |                                           |
+------------------v---------------+       +-------------------v--------------+
|        AI INFERENCE ENGINE       |       |         DATABASE LAYER           |
|  * Groq: openai/gpt-oss-120b     |       |  * SQLite / PostgreSQL           |
|  * Groq: openai/gpt-oss-20b      |       |  * SQLAlchemy 2.0 ORM            |
|  * Groq: qwen/qwen3.6-27b        |       |  * User, Habit, Study, Finance,  |
|  * Groq: groq/compound           |       |    ChatSession, ChatMessage,     |
|  * Rule-Based Offline Fallback   |       |    UserSuggestion tables         |
+----------------------------------+       +----------------------------------+
```

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, TanStack Router, Tailwind CSS, Radix UI, Recharts, Lucide Icons, ReactMarkdown, remark-gfm |
| **Backend API** | FastAPI (Python 3.10+), Uvicorn, Pydantic v2, SQLAlchemy ORM |
| **Database** | SQLite / PostgreSQL |
| **AI Inference** | Groq API (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.6-27b`, `groq/compound`) |
| **Mathematical Modeling** | NumPy, Pandas, Scikit-learn, Stochastic Monte Carlo Algorithms |

---

## Quickstart Guide

### 1. Prerequisites
- Python 3.10 or higher
- Node.js 18.0 or higher
- npm or pnpm

### 2. Backend Setup

```bash
# 1. Create and activate a Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
# 1. Navigate to frontend directory and install packages
cd frontend
npm install
cd ..
```

### 4. Environment Variables Configuration

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Configure your `.env`:

```env
DATABASE_URL=sqlite:///./digital_twin.db
GROQ_API_KEY=your_groq_api_key_here
```

> **Note:** A valid `GROQ_API_KEY` enables live conversational intelligence, agentic multi-action planning, and scenario synthesis. The system dynamically reads `.env` on demand and includes robust mathematical/heuristic fallbacks if offline.

---

## Running the Application

### Start Backend API (FastAPI)

```bash
source .venv/bin/activate
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

- **API Base URL:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive OpenAPI Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check Endpoint:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### Start Frontend Client (React)

```bash
cd frontend
npm run dev
```

- **Frontend Application URL:** [http://localhost:8080](http://localhost:8080)

---

## Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check |
| `POST` | `/users/` | Create a new user profile with email/username validation |
| `POST` | `/users/login` | Log in user by either email or username |
| `GET` | `/users/{user_id}` | Retrieve user profile, cached predictions, and role |
| `PUT` | `/users/{user_id}` | Update profile metrics, target age, net worth, and role |
| `GET` | `/chat/sessions/{user_id}` | List all chat sessions for user |
| `POST` | `/chat/message/create_thread` | Create new conversation thread with AI summary title |
| `POST` | `/chat/message/{session_id}` | Send message and execute 4-stage Copilot reasoning |
| `POST` | `/chat/action/execute/{message_id}` | Approve and execute proposed Copilot action |
| `POST` | `/chat/action/reject/{message_id}` | Dismiss proposed Copilot action |
| `GET` | `/simulations/forecast/{user_id}` | Monte Carlo forecast with percentile curves and success odds |
| `GET` | `/simulations/wealth-advice/{user_id}` | AI wealth coach guidance with `force=true` recalculation |
| `POST` | `/simulations/compare/{user_id}` | Evaluate Scenario A vs. Scenario B tradeoff analysis |
| `POST` | `/simulations/analytics-summary/{user_id}` | AI daily habit analysis narrative (noon milestone cache) |
| `GET` | `/suggestions/{user_id}` | Retrieve persisted suggestions or initialize persona defaults |
| `POST` | `/suggestions/generate/{user_id}` | AI pre-analysis of habit logs + generate (`regenerate` or `more`) |
| `POST` | `/suggestions/adopt/{user_id}` | Toggle suggestion adoption status and sync with database |
| `POST` | `/suggestions/reset/{user_id}` | Reset suggestions back to role default baseline |
| `GET` | `/records/habit/{user_id}` | Retrieve historical habit logs |
| `POST` | `/records/habit/{user_id}` | Record daily sleep, screen, study, and mood log |

---

## Step-by-Step Workflow Documentation

Detailed technical architecture documents for every layer of the platform are available in [`docs/workflow/`](docs/workflow/):

1. [**01. System Architecture & Data Flow**](docs/workflow/01_system_architecture.md) — High-level architecture, module breakdown, and REST communication.
2. [**02. Onboarding & Persona Architecture**](docs/workflow/02_onboarding_and_personas.md) — The 5 life-stage personas, adaptive questions, and baseline initialization.
3. [**03. Financial Forecasting & Monte Carlo Simulation**](docs/workflow/03_forecasting_and_monte_carlo.md) — Mathematical models, 500-path stochastic modeling, and prediction caching.
4. [**04. Decision Sandbox & What-If Simulation**](docs/workflow/04_decision_sandbox_and_whatif.md) — Dual-scenario comparison, biological feedback calculations, and structured verdict reporting.
5. [**05. Habit Analytics & Daily Noon Cache**](docs/workflow/05_habit_analytics_and_feedback.md) — Metric tracking, grouped correlation charts, and automated 12:00 PM cache invalidation.
6. [**06. Task Planner & Suggestion Adoption Engine**](docs/workflow/06_task_planner_and_suggestions.md) — Data-analyzed suggestion engine, expansion pipelines, database persistence, and schedule injection.
7. [**07. Study & Productivity Intelligence**](docs/workflow/07_study_and_productivity_intelligence.md) — Spaced repetition analytics, 7-day optimized schedules, and exam readiness regression models.
8. [**08. Digital Twin Copilot & Conversational Agent**](docs/workflow/08_digital_twin_copilot_chat.md) — 4-stage agentic reasoning pipeline, multi-action proposal system, voice recognition, and chat API reference.

---

*Digital Twin AI — Comprehensive Multi-Persona Trajectory Engine.*
