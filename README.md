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

## Interactive Visual Interface Tour

```mermaid
flowchart TD
  subgraph PublicAndAuth["Onboarding & Security Interface"]
    P1["1. Landing Page<br/>• Value Proposition & 5 Life-Stage Personas"]
    P2["2. Sign Up Page<br/>• Argon2id/Bcrypt & Unique Token Dispatch"]
    P3["3. Login Page<br/>• Dual Identifier (Username/Email) & Refresh Token Cookie"]
  end

  subgraph CoreTwinIntelligence["Core Twin Intelligence Modules"]
    P4["4. Telemetry Dashboard (/dashboard)<br/>• Real-Time Health Index, Financial Surplus & Milestones"]
    P5["5. Visual Risk Copilot (/chat)<br/>• 4-Stage Reasoning Chain, Voice STT & 1-Click Action Proposals"]
    P6["6. Decision Sandbox (/simulator)<br/>• Dual Scenario A vs B Modeling & Biological Elasticity"]
  end

  subgraph PlanningAndAnalytics["Autonomous Planning & Predictive Analytics"]
    P7["7. Wealth Planner (/wealth)<br/>• 500-Run Stochastic Monte Carlo & Confidence Bands"]
    P8["8. Habit Analytics (/analytics)<br/>• Biometric Correlations & Automated 12:00 PM AI Reflections"]
    P9["9. Autonomous Daily Planner (/planner)<br/>• Circadian Schedule Optimization & Morning Briefings"]
    P10["10. Settings & Autonomy Center (/settings)<br/>• 3-Tier Governance, Think Mode & Persona Switcher"]
  end

  P1 --> P2 --> P3 --> P4
  P4 --> P5
  P4 --> P6
  P4 --> P7
  P4 --> P8
  P4 --> P9
  P4 --> P10
```

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
    Autonomous Daily Planner
      Circadian Schedule Synthesis
      Morning Intelligence Briefings
      3-Tier Autonomy Governance
      Direct MongoDB Synchronization
    Conversational Copilot
      4-Stage Agentic Reasoning
      Collapsible Think Disclosure
      Voice Speech-to-Text Input
      Dynamic Table & Schedule Parser
      1-Click Action Proposals
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
# Run pytest unit tests (19/19 passing)
PYTHONPATH=. .venv/bin/pytest tests/

# Run complete 100 E2E tests (100/100 passing)
PYTHONPATH=. .venv/bin/python run_exact_100_e2e_tests.py

# Run live autonomous planner tests (8/8 passing)
PYTHONPATH=. .venv/bin/python test_live_autonomous_planner_e2e.py
```

---

*Visual Risk AI — Intelligent Multi-Persona Trajectory Engine.*
