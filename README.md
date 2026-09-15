<p align="center">
  <img src="docs/images/logo.svg" alt="Visual Risk AI Logo" width="72" height="72" />
</p>

<h1 align="center">Visual Risk AI</h1>

<p align="center">
  <b>AI-Based Visual Risk and Compliance Intelligence System (VRCI)</b><br />
  <i>Agentic Decision Intelligence · Circadian Biological Twins · Stochastic Monte Carlo Modeling · Autonomous AI Planner</i>
</p>

<p align="center">
  <img src="docs/images/visual_risk_ai_banner.svg" alt="Visual Risk AI Banner" width="100%" />
</p>

<p align="center">
  Visual Risk AI (VRCI) is an agentic, intelligent risk, compliance, and decision-support system that models, forecasts, and optimizes trajectories across operational compliance, financial risk, health, cognitive performance, and daily habits. By combining stochastic Monte Carlo simulations, deterministic compound growth algorithms, biological circadian feedback models, and conversational agentic intelligence (Groq GPT-OSS 120B / 20B & Qwen 3.6), the platform creates a living digital twin tailored to the user's specific life stage.
</p>

---

## Visual Interface & Dashboard Showcase

Explore the core modules of Visual Risk AI. Click on any screenshot to inspect the full-resolution image in a new tab:

### 01. Landing & Persona Portal
The primary onboarding gateway introducing the 5 life-stage demographic personas (Student, Professional, Freelancer, Tech Lead, Custom) with immediate baseline telemetry configuration.

<p align="center">
  <a href="docs/images/01_landing.png" target="_blank">
    <img src="docs/images/01_landing.png" alt="Visual Risk AI - Landing Page" width="100%" />
  </a>
</p>

---

### 02. Living Digital Twin Dashboard (`/dashboard`)
The central telemetry command center displaying real-time cognitive Vitality & Health Index gauges, financial cashflow surplus, today's circadian schedule, and long-term milestone progress.

<p align="center">
  <a href="docs/images/02_dashboard.png" target="_blank">
    <img src="docs/images/02_dashboard.png" alt="Visual Risk AI - Living Digital Twin Dashboard" width="100%" />
  </a>
</p>

---

### 03. Visual Risk Copilot & Multi-Agent Chat (`/chat`)
Conversational agentic intelligence powered by a specialized Multi-Agent Router and 6 Domain Sub-Agents. Includes 4-stage transparent reasoning disclosure, speech-to-text voice input, and 1-click database mutation execution.

<p align="center">
  <a href="docs/images/03_copilot_chat.png" target="_blank">
    <img src="docs/images/03_copilot_chat.png" alt="Visual Risk AI - Visual Risk Copilot" width="100%" />
  </a>
</p>

---

### 04. Decision Sandbox & What-If Tradeoff Simulator (`/simulator`)
Side-by-side comparative simulation comparing Scenario A vs Scenario B over 5 to 40-year horizons. Models biological feedback loops, sleep deficit penalties, and net worth opportunity costs in real time.

<p align="center">
  <a href="docs/images/04_simulator.png" target="_blank">
    <img src="docs/images/04_simulator.png" alt="Visual Risk AI - Decision Sandbox Simulator" width="100%" />
  </a>
</p>

---

### 05. Wealth Engine & Stochastic Monte Carlo Simulation (`/wealth`)
500-run Geometric Brownian Motion simulations generating p10, p50 (median), and p90 confidence bands with real-time CAGR loss calculations and inflation-adjusted milestone probabilities.

<p align="center">
  <a href="docs/images/05_wealth_planner.png" target="_blank">
    <img src="docs/images/05_wealth_planner.png" alt="Visual Risk AI - Wealth Planner Monte Carlo" width="100%" />
  </a>
</p>

---

### 06. Habit Analytics & Circadian Health Index (`/analytics`)
Biometric and habit correlation telemetry mapping sleep duration, exercise, and study volume against cognitive focus scores. Automatically caches daily reflections and health recommendations at 12:00 PM.

<p align="center">
  <a href="docs/images/06_habit_analytics.png" target="_blank">
    <img src="docs/images/06_habit_analytics.png" alt="Visual Risk AI - Habit Analytics" width="100%" />
  </a>
</p>

---

### 07. Autonomous Daily Planner (`/planner`)
Circadian schedule synthesis aligning deep work focus sprints with peak cognitive cortisol windows. Supports Morning Intelligence briefings and 1-click AI suggestion adoption.

<p align="center">
  <a href="docs/images/07_task_planner.png" target="_blank">
    <img src="docs/images/07_task_planner.png" alt="Visual Risk AI - Autonomous Daily Planner" width="100%" />
  </a>
</p>

---

### 08. Study Cockpit & Academic Intelligence (`/study`)
Academic productivity cockpit featuring AI-synthesized 7-day Pomodoro sprint schedules, spaced repetition algorithms, exam target readiness curves, and loop-locked ambient video soundscapes.

<p align="center">
  <a href="docs/images/11_study_cockpit.png" target="_blank">
    <img src="docs/images/11_study_cockpit.png" alt="Visual Risk AI - Study Cockpit" width="100%" />
  </a>
</p>

---

### 09. Settings & 3-Tier Autonomy Governance (`/settings`)
Governance center providing 3-tier autonomy controls (Manual Review, Semi-Autonomous with Undo Window, Fully Autonomous), Think Mode telemetry toggles, and instant persona switching.

<p align="center">
  <a href="docs/images/08_settings.png" target="_blank">
    <img src="docs/images/08_settings.png" alt="Visual Risk AI - Settings & Autonomy Center" width="100%" />
  </a>
</p>

---

### 10. Secure Authentication & Onboarding (`/login` & `/signup`)
Cryptographically secure authentication with Argon2id and Bcrypt password hashing, short-lived 15-minute access tokens, rotating 7-day refresh token cookies, and 1-click demo persona access.

<p align="center">
  <a href="docs/images/10_login.png" target="_blank">
    <img src="docs/images/10_login.png" alt="Visual Risk AI - Login & Authentication" width="100%" />
  </a>
</p>

---

## System Architecture Overview

```mermaid
flowchart TB
  %% Styling
  classDef clientStyle fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
  classDef gatewayStyle fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
  classDef aiStyle fill:#311042,stroke:#c084fc,stroke-width:2px,color:#f8fafc;
  classDef dbStyle fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#f8fafc;

  subgraph Client["Client Presentation Layer (React 19 + TypeScript + Vite)"]
    direction TB
    C_Chat["Visual Risk Copilot (/chat)<br/>Voice STT · Multi-Action Cards · Think Accordion"]:::clientStyle
    C_Plan["Autonomous Planner (/planner)<br/>Circadian Sprints · Morning Intelligence Briefing"]:::clientStyle
    C_Sim["Decision Sandbox (/simulator)<br/>Scenario A/B Tradeoffs · Biological Feedback"]:::clientStyle
    C_Wealth["Wealth Engine (/wealth)<br/>500 Monte Carlo Paths · Dynamic Recharts"]:::clientStyle
    C_Habits["Habit Analytics (/analytics)<br/>Circadian Correlations · Automated Noon Cache"]:::clientStyle
    C_Set["Settings Center (/settings)<br/>3-Tier Governance · Persona Switcher"]:::clientStyle
  end

  subgraph Gateway["Backend API Gateway (FastAPI + Async Motor)"]
    direction TB
    R_Auth["/auth (JWT, Argon2id, Refresh Rotation)"]:::gatewayStyle
    R_Users["/users (Personas, Baselines, Telemetry)"]:::gatewayStyle
    R_Chat["/chat (4-Stage Reasoning, Session Isolation)"]:::gatewayStyle
    R_Plan["/planner (Auto-Plan, Autonomy Governance)"]:::gatewayStyle
    R_Sim["/simulations (Monte Carlo, Scenario B Presets)"]:::gatewayStyle
    R_Rec["/records (Habit, Study & Financial Data)"]:::gatewayStyle
  end

  subgraph AI["Simulation & AI Intelligence (Groq + NumPy)"]
    direction TB
    AI_Agents["Multi-Agent Orchestrator (Router + 6 Sub-Agents)<br/>Goal · Finance · Settings · Planner · Study · Habit"]:::aiStyle
    AI_Reasoner["4-Stage Reasoning Pipeline<br/>Goal -> Telemetry -> Analysis -> Plan"]:::aiStyle
    AI_Parser["Dynamic Schedule Table Parser<br/>Markdown & Dialogue History Task Extractor"]:::aiStyle
    AI_AutoPlan["Circadian Auto-Planner Engine<br/>Sleep Deficit Alignment & Alertness Window"]:::aiStyle
    AI_MC["Stochastic Monte Carlo Engine<br/>500 Geometric Brownian Motion Trials"]:::aiStyle
  end

  subgraph DB["Persistence Layer (MongoDB + Beanie ODM)"]
    direction TB
    M_User["UserDoc (Telemetry, tasks_json, autonomy_mode)"]:::dbStyle
    M_Chat["ChatSessionDoc (Atomic Embedded Messages)"]:::dbStyle
    M_Sug["UserSuggestionDoc (Adopted Action Tasks)"]:::dbStyle
    M_Records["HabitRecordDoc / StudyRecordDoc / FinancialRecordDoc"]:::dbStyle
  end

  Client -->|REST API / JSON| Gateway
  Gateway --> AI
  Gateway <--> DB
  AI <--> DB
```

---

## Core Capabilities & Feature Highlights

```mermaid
mindmap
  root((Visual Risk AI))
    Multi-Agent Conversational Copilot
      Multi-Agent Router & 6 Sub-Agents
      Instant Chat Mutations auto_execute
      4-Stage Agentic Reasoning
      Collapsible Think Disclosure
      Voice Speech-to-Text Input
      Dynamic Table & Schedule Parser
      1-Click Action Proposals
    Study Cockpit & Academics
      Zero-Friction Pomodoro Auto-Save
      Loop-Locked Video Wallpapers
      Precision Motion & Blur Control
      Exam Readiness & Trend Modeling
    Autonomous Daily Planner
      Circadian Schedule Synthesis
      Morning Intelligence Briefings
      3-Tier Autonomy Governance
      Direct MongoDB Synchronization
    Stochastic Wealth Engine
      500 Geometric Brownian Paths
      p10 p50 p90 Percentile Bounds
      Inflation Indexing & CAGR Loss
      Sub-50ms Cached Projections
    Decision Sandbox
      Scenario A vs B What-If
      Biological Feedback & Sleep Elasticity
      Cognitive Focus & Burnout Index
      1-Click Scenario Adoption
    Security & Cryptography
      Argon2id & Bcrypt Password Hashing
      Short-Lived Access Tokens 15m
      Rotating Refresh Tokens 7d
      Token Family Theft Detection
      Enumeration-Safe Account Recovery
```

---

## Complete Documentation Directory

- [**01. Core Capabilities**](docs/core_capabilities.md) — Comprehensive feature matrix, reasoning pipeline, and autonomy governance.
- [**02. The 5 User Personas**](docs/user_personas.md) — Detailed baseline metrics, circadian parameters, and goals for all 5 roles.
- [**03. System Architecture & Flowchart**](docs/system_architecture.md) — Detailed component interconnects, Mermaid diagrams, and data flow.
- [**04. Tech Stack & Engineering Architecture**](docs/tech_stack.md) — Frontend, backend, AI engine, and database stack specifications.
- [**05. Quickstart & Installation Guide**](docs/quickstart_guide.md) — Step-by-step installation, environment setup, and startup commands.
- [**06. Running the Application & Deployment**](docs/running_the_application.md) — Production build, docker deployment, and daemon process management.
- [**07. Complete API Reference & Example Payloads**](docs/api_reference.md) — Complete REST endpoint specifications, request schemas, and curl examples.
- [**08. Authentication & Security Architecture (15 Principles)**](docs/authentication_architecture.md) — Threat models, token lifecycles, and cryptographic standards.

---

## Step-by-Step Workflow Guides

1. [**01. System Architecture & Data Flow**](docs/workflow/01_system_architecture.md)
2. [**02. Onboarding & Persona Architecture**](docs/workflow/02_onboarding_and_personas.md)
3. [**03. Financial Forecasting & Monte Carlo Simulation**](docs/workflow/03_forecasting_and_monte_carlo.md)
4. [**04. Decision Sandbox & What-If Simulation**](docs/workflow/04_decision_sandbox_and_whatif.md)
5. [**05. Habit Analytics & Daily Noon Cache**](docs/workflow/05_habit_analytics_and_feedback.md)
6. [**06. Task Planner & Suggestion Adoption Engine**](docs/workflow/06_task_planner_and_suggestions.md)
7. [**07. Study & Productivity Intelligence**](docs/workflow/07_study_and_productivity_intelligence.md)
8. [**08. Visual Risk Copilot & Conversational Agent**](docs/workflow/08_digital_twin_copilot_chat.md)

---

## Exhaustive Verification & Test Coverage

The platform is backed by an automated 100-test end-to-end verification suite and complete pytest unit tests:

```mermaid
flowchart LR
  subgraph TestSuite["Automated Verification Pipeline (100% Green)"]
    T1["Stage 1: Production Infrastructure (Tests 1-10)"]
    T2["Stage 2: Modern Auth & Token Family (Tests 11-25)"]
    T3["Stage 3: Account Recovery & Sessions (Tests 26-35)"]
    T4["Stage 4: User Profile & Telemetry (Tests 36-45)"]
    T5["Stage 5: 5 Dedicated Demo Personas (Tests 46-55)"]
    T6["Stage 6: Copilot AI & Action Execution (Tests 56-65)"]
    T7["Stage 7: Monte Carlo & Decision Sandbox (Tests 66-75)"]
    T8["Stage 8: Biometrics & Transactions (Tests 76-85)"]
    T9["Stage 9: Academic Plan & App Cache (Tests 86-95)"]
    T10["Stage 10: Security Boundaries & Teardown (Tests 96-100)"]
  end

  T1 --> T2 --> T3 --> T4 --> T5 --> T6 --> T7 --> T8 --> T9 --> T10
```

To execute the test suite:
```bash
# Run automated pytest unit & integration tests (21/21 passing)
PYTHONPATH=. .venv/bin/pytest tests/ -v

# Run comprehensive live MongoDB end-to-end suite (76/76 passing)
PYTHONPATH=. .venv/bin/python test_live_mongodb_e2e.py

# Run complete 100 E2E benchmark tests (100/100 passing)
PYTHONPATH=. .venv/bin/python run_exact_100_e2e_tests.py
```

---

*Visual Risk AI — Intelligent Multi-Persona Trajectory Engine.*
