# Digital Twin AI — Multi-Persona Life & Financial Simulation Engine

Digital Twin AI is an intelligent decision-support system that models, forecasts, and optimizes a user's life trajectory across finances, health, cognitive performance, and daily habits.

By combining stochastic Monte Carlo simulations, deterministic compound growth algorithms, biological feedback models, and conversational AI (Groq LLaMA 3.1), the platform creates a living "digital twin" tailored to the user's specific life stage.

---

## Core Capabilities

- **5 Life-Stage Personas**: Dynamic UI and mathematical adaptation across **Student**, **Working Professional**, **Freelancer / Creator**, **Founder / Entrepreneur**, and **Retiree / Senior** profiles.
- **Demo Twin Dropdown & Random Generator**: One-click exploration of pre-calibrated standard personas or randomized stochastic profiles with 30 days of synthetic historical logs.
- **Financial Twin & Monte Carlo Forecasting**: 500-iteration stochastic wealth simulations with percentile bands ($p_{10}$, $p_{50}$, $p_{90}$), real-time probability of success calculations, and intelligent backend prediction caching.
- **Adaptive Multi-Scale Financial Charts**: Dynamic Y-axis scaling that gracefully handles values from student allowances in hundreds/thousands to venture founders and retirees in millions.
- **Interactive Decision Sandbox ("What-If" Simulator)**: Side-by-side comparison of two competing lifestyle scenarios. Features automated AI scenario generation, multi-variable biological tradeoff modeling (sleep vs health index vs cognitive focus), and 1-click scenario adoption.
- **Universal Habit Analytics**: Grouped correlation charts (Sleep vs Focus, Screen Time vs Mood) designed for all ages, paired with an automated 12:00 PM local noon AI reflection cache.
- **Daily Task Planner & Suggestion Adoption**: Role-filtered task categories and a curated habit suggestion engine with instant injection into today's schedule.

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

## Step-by-Step Workflow Documentation

Detailed technical design documents for every layer of the platform are located in [`docs/workflow/`](docs/workflow/):

1. [**01. System Architecture & Data Flow**](docs/workflow/01_system_architecture.md) — High-level architecture, module breakdown, and REST layer communication.
2. [**02. Onboarding & Persona Architecture**](docs/workflow/02_onboarding_and_personas.md) — The 5 life-stage personas, adaptive question progression, and baseline state initialization.
3. [**03. Financial Forecasting & Monte Carlo Simulation**](docs/workflow/03_forecasting_and_monte_carlo.md) — Mathematical models, 500-path stochastic modeling, and prediction caching.
4. [**04. Decision Sandbox & What-If Simulation**](docs/workflow/04_decision_sandbox_and_whatif.md) — Dual-scenario comparison, biological feedback calculations, and structured verdict reporting.
5. [**05. Habit Analytics & Daily Noon Cache**](docs/workflow/05_habit_analytics_and_feedback.md) — Metric tracking, grouped correlation charts, and automated 12:00 PM cache invalidation.
6. [**06. Task Planner & Suggestion Adoption Engine**](docs/workflow/06_task_planner_and_suggestions.md) — Role-specific task categories, suggestion libraries, and schedule injection.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, TanStack Router & Start, Tailwind CSS, Radix UI, Recharts, Lucide Icons |
| **Backend API** | FastAPI (Python 3.10+), Uvicorn, Pydantic v2 |
| **Database** | SQLite / PostgreSQL with SQLAlchemy ORM |
| **AI & Predictive** | Groq (LLaMA 3.1-8B-Instant), NumPy, Pandas, Scikit-learn |

---

## Quickstart Guide

### 1. Prerequisites
- Python 3.10 or higher
- Node.js 18.0 or higher
- npm or pnpm

### 2. Backend Environment Setup

```bash
# 1. Create and activate a Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install backend dependencies
pip install -r requirements.txt
```

### 3. Frontend Client Setup

```bash
# 1. Navigate to the frontend directory and install dependencies
cd frontend
npm install
cd ..
```

### 4. Environment Variables Configuration

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Set your configuration in `.env`:

```env
DATABASE_URL=sqlite:///./digital_twin.db
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note:** A valid `GROQ_API_KEY` enables conversational LLM predictions and scenario generation. If omitted, the platform runs using deterministic rule-based fallback engines.

---

## Running the Application

Run the backend and frontend in separate terminal sessions:

### Start Backend API (FastAPI)

```bash
source .venv/bin/activate
uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

- **Backend Base URL:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive OpenAPI Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check Endpoint:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### Start Frontend Client (React)

```bash
cd frontend
npm run dev
```

- **Frontend Application URL:** [http://localhost:8080](http://localhost:8080)

---

## Project Directory Layout

```text
digital-twin-ai/
|-- docs/
|   `-- workflow/                 # Step-by-step workflow and system design documents
|       |-- 01_system_architecture.md
|       |-- 02_onboarding_and_personas.md
|       |-- 03_forecasting_and_monte_carlo.md
|       |-- 04_decision_sandbox_and_whatif.md
|       |-- 05_habit_analytics_and_feedback.md
|       `-- 06_task_planner_and_suggestions.md
|
|-- frontend/                     # React 19 + TanStack Router + Tailwind CSS
|   |-- src/
|   |   |-- components/           # UI components, AppShell, SettingsDialog, Gauge
|   |   |-- routes/               # Page routes (Dashboard, Wealth, Planner, Simulator, etc.)
|   |   |-- lib/                  # Central state store (twin-store.tsx) & API client
|   |   `-- hooks/                # Responsive layout and state hooks
|   |-- package.json
|   `-- vite.config.ts
|
|-- backend/                      # FastAPI application
|   |-- main.py                   # FastAPI initialization & middleware
|   `-- api/                      # REST routers (users, records, simulations)
|
|-- database/                     # Database layer
|   |-- models.py                 # SQLAlchemy ORM schemas
|   |-- schemas.py                # Pydantic data validation schemas
|   |-- crud.py                   # CRUD transaction helpers
|   `-- database.py               # Engine session management
|
|-- ai_engine/                    # Intelligence & simulation layer
|   |-- forecasting/              # Deterministic & Monte Carlo financial models
|   |-- simulation/               # Multi-scenario lifestyle & biological tradeoff engine
|   `-- llm_integration/          # Groq LLaMA 3.1 prompt advisor & rule-based fallbacks
|
|-- requirements.txt              # Python package requirements
`-- README.md
```

---

## Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check |
| `POST` | `/users/` | Create a new user profile with selected persona role |
| `GET` | `/users/{user_id}` | Retrieve user profile, cached predictions, and role |
| `PUT` | `/users/{user_id}` | Update profile metrics, target age, net worth, and role |
| `GET` | `/records/habit/{user_id}` | Retrieve historical habit logs |
| `POST` | `/records/habit/{user_id}` | Record daily sleep, screen, study, and mood log |
| `GET` | `/simulations/forecast/{user_id}` | Execute 500-iteration Monte Carlo wealth forecast |
| `GET` | `/simulations/wealth-advice/{user_id}` | Fetch cache-checked AI wealth prediction |
| `POST` | `/simulations/compare/{user_id}` | Run comparative What-If simulation with AI verdict |
| `GET` | `/simulations/scenario-suggestions/{user_id}` | AI-generated Scenario A & B slider suggestions |
| `GET` | `/simulations/analytics-summary/{user_id}` | Daily 12:00 PM cached habit overview summary |
