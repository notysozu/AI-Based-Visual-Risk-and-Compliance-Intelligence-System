# Visual Risk AI — Complete Project Presentation Deck

This document contains the complete structured slide deck and technical talking points for **Visual Risk AI (AI-Based Visual Risk & Compliance Intelligence System)**.

PowerPoint Presentation File: [`Visual_Risk_AI_Project_Presentation.pptx`](Visual_Risk_AI_Project_Presentation.pptx)

---

## Slide 1: Title & Executive Introduction
- **System**: Visual Risk AI
- **Subtitle**: AI-Based Visual Risk & Compliance Intelligence System
- **Core Value**: Predictive life modeling fusing biological feedback dynamics, Monte Carlo wealth forecasting, autonomous circadian task synthesis, and conversational intelligence.
- **Maintainer**: notysozu `<lifegamer2050@gmail.com>`
- **Core Stack**: React 19, FastAPI, Motor/Beanie ODM, MongoDB, NumPy, Groq LLMs

---

## Slide 2: Problem Statement & Value Proposition
- **The Problem**:
  - Fragmented Telemetry: Health logs, study sessions, and financial cashflows reside in disconnected apps.
  - Linear Assumptions: Traditional calculators ignore market volatility and non-linear biological elasticity.
  - Compounding Friction: Minor daily sleep loss or impulse spending cascades into multi-year milestone delays.
  - Manual Burden: Conventional calendars require tedious manual adjustment and ignore sleep debt.
- **The Solution**:
  - Unified digital twin state aggregating live biometrics, study sprints, cashflow, and goals.
  - 500-trial stochastic Monte Carlo engine computing realistic P10/P50/P90 percentile bounds.
  - Autonomous circadian planner aligning deep work with peak cortisol windows (08:30-11:30 AM).
  - 4-stage agentic copilot transforming natural dialogue into 1-click executable database actions.

---

## Slide 3: Multi-Tier System Architecture
- **Tier 1 — Presentation Layer (React 19 + Vite)**:
  - Interactive Dashboard, Copilot Chat with Voice STT, Decision Sandbox, Wealth Planner, Task Planner, and Habit Analytics.
- **Tier 2 — Backend API Gateway (FastAPI + Beanie ODM)**:
  - Asynchronous high-throughput REST endpoints with strict Pydantic v2 schemas.
  - Argon2id/Bcrypt password hashing, JWT access tokens, and rotating HttpOnly refresh cookies with theft detection.
- **Tier 3 — Intelligence & Simulation Engine (Groq + NumPy)**:
  - 4-stage agentic reasoning pipeline with collapsible thought trees (`<think>`).
  - 500-run Geometric Brownian Motion Monte Carlo simulation engine.
  - Dynamic Markdown table and timestamp schedule parser.
- **Tier 4 — Persistence Layer (MongoDB + Snapshot)**:
  - Beanie Document models with atomic embedded message retrieval.
  - Synchronous disk persistence snapshotting (`data/mongodb_persistence.json`) guaranteeing zero data loss.

---

## Slide 4: Target Personas & Adaptive Role Engine
- **College Student** (Age 20 | Coursework Mastery):
  - Focus: Study pomodoro sprints, exam readiness forecasting, pocket budget tracking, consistent sleep cutoff.
- **Working Professional** (Age 29 | Senior Promotion):
  - Focus: Deep-work focus blocks, career velocity, liquid savings growth, and burnout prevention.
- **Freelancer / Creator** (Age 26 | Revenue Smoothing):
  - Focus: Irregular income buffering, client milestone time-boxing, and vitality recovery.
- **Entrepreneur / Founder** (Age 32 | Venture Scaling):
  - Focus: Runway extension, investor pitch sprint scheduling, high-stress resilience, and seed milestone delivery.
- **Active Retiree** (Age 62 | Capital Preservation):
  - Focus: Stochastic longevity modeling, healthcare allocation, estate planning, and lifestyle vitality.

---

## Slide 5: Decision Sandbox & What-If Simulator
- **Dual-Scenario Stress-Testing**: Live baseline (Scenario A) vs simulated adjustments (Scenario B) across Sleep, Study, and Monthly Savings.
- **Biological Feedback Modeling**: Non-linear cognitive focus degradation when sleep drops below baseline.
- **Compound Opportunity Cost**: Evaluates 5-year capital trajectory at 8% CAGR for major purchases.
- **1-Click Preset Adoption**: Instantly commits validated scenario parameters to the user profile in MongoDB.

---

## Slide 6: Stochastic Wealth Planner & Monte Carlo Engine
- **Geometric Brownian Motion (GBM)**: Simulates portfolio drift and market volatility across 500 distinct trials.
- **Percentile Confidence Bounds**:
  - P10: Conservative downside floor.
  - P50: Median expected trajectory.
  - P90: Optimistic upside ceiling.
- **Retirement Attainment Odds**: Exact probability percentage of reaching target net worth by goal age.
- **Volatility Awareness**: Exposes the gap between static linear savings models and real-world market turbulence.

---

## Slide 7: Autonomous Circadian Daily Planner & Governance
- **Peak Cortisol Optimization**: Proactively places deep-work sprints during prime alertness (08:30-11:30 AM).
- **Sleep Deficit Dynamic Compensation**: Evaluates 7-day rolling sleep debt; lightens task density on sleep-deprived mornings.
- **3-Tier Autonomy Governance**:
  - Supervised Mode: Requires manual user approval for all schedule actions.
  - Semi-Autonomous Mode: Automatically schedules safe daily focus blocks, prompts for major shifts.
  - Full Autonomous Mode: Proactively optimizes and commits the calendar daily.
- **Morning Intelligence Briefing**: Synthesizes daily focus summaries and biometric readiness status.

---

## Slide 8: Visual Risk Copilot & 4-Stage Agentic Reasoning
- **4-Stage Pipeline**:
  1. Goal Definition & Target Decomposition.
  2. Telemetry Gathering from MongoDB live state.
  3. Multi-Criteria Analysis & Stochastic Modeling.
  4. Strategic Execution Plan & 1-Click Action Card Proposal.
- **Dynamic Table & List Parser**: Automatically extracts tasks from Markdown tables into executable `add_multiple_tasks` payloads.
- **Collapsible `<think>` Trees**: Transparent mathematical verification of model reasoning.
- **Web Speech API Voice Dictation**: Hands-free voice prompt capture with animated waveform feedback.
- **Persistent Tutorial Seed**: Standard onboarding guide initialized and persisted across all login cycles.

---

## Slide 9: Habit Analytics & Biometric Feedback
- **Multi-Dimensional Correlation Engine**: Cross-analyzes sleep duration, screen time, exercise minutes, and focus ratings.
- **Automated 12:00 PM Noon Reflection**: Daily background cron synthesizing 24-hour retrospective insights cached in `AppCacheDoc`.
- **Vitality Elasticity**: Quantifies cognitive focus gains per additional rest interval.
- **30-Day Historical Trends**: Visual time series with standard deviation variance bands.

---

## Slide 10: Academic Coursework Intelligence
- **7-Day Pomodoro Sprints**: Synthesizes balanced 45-min sprint / 15-min recovery revision schedules.
- **Spaced Repetition Engine**: Mitigates Ebbinghaus forgetting curve decay on core syllabus concepts.
- **Exam Grade Forecaster**: Predicts expected performance and grade variance based on cumulative study hours.

---

## Slide 11: Authentication & Cryptographic Security
- **Dual Identifier Auth**: Flexible login via username or verified email.
- **JWT + Rotating Refresh Tokens**: 15-minute access token paired with HttpOnly SameSite rotating refresh cookies (7-day validity).
- **Token Family Theft Detection**: Instant invalidation of the entire token family upon detection of replayed or revoked tokens.
- **Argon2id & Bcrypt Hashing**: Password hashing with cost factor 12 and salt isolation.
- **Enumeration-Safe Handlers**: Consistent generic error responses protect against account reconnaissance.

---

## Slide 12: MongoDB Document Architecture & Disk Persistence
- **Beanie Document Models**: `UserDoc`, `ChatSessionDoc`, `HabitRecordDoc`, `StudyRecordDoc`, `FinancialRecordDoc`, `UserSuggestionDoc`, `AppCacheDoc`, `RefreshTokenDoc`.
- **Synchronous JSON Disk Persistence**: Automatic serialization to `data/mongodb_persistence.json` on all create/update/delete operations.
- **Atomic File Swapping**: Temporary `.tmp` write followed by atomic OS file rename eliminates snapshot corruption.
- **Lossless Rehydration**: Full recovery of user profiles, custom conversations, and tutorial onboarding sessions across backend restarts.

---

## Slide 13: Quality Assurance, Testing & Automated Verification
- **Pytest Test Suite**: 21 of 21 tests passing (100% pass rate) covering mathematical simulations, Pydantic schemas, auto-planner rules, and multi-turn parsers.
- **Frontend Production Compilation**: Clean TypeScript and Vite build with 0 type warnings or bundler errors.
- **End-to-End Persistence Verification**: Automated script verifying user registration, message appending, snapshot serialization, memory purging, and rehydration.

---

## Slide 14: Innovation Highlights & Future Roadmap
- **Core Innovations**:
  - Deterministic biological feedback fused with 500-run stochastic Monte Carlo trials.
  - Autonomous circadian focus placement replacing static calendar grids.
  - Agentic copilot turning conversational thoughts directly into executable database mutations.
- **Future Roadmap**:
  - Wearable Biometric Sensor Sync (Apple HealthKit, Oura, Garmin).
  - Multi-Agent Collaborative Risk Modeling for teams and enterprises.
  - WebGPU-accelerated on-device SLM inference.
  - Open Banking / Plaid transaction auto-categorization.

---

## Slide 15: Conclusion & Links
- **Project**: Visual Risk AI
- **Repository**: `AI-Based-Visual-Risk-and-Compliance-Intelligence-System`
- **Author**: notysozu `<lifegamer2050@gmail.com>`
- **Presentation File**: `Visual_Risk_AI_Project_Presentation.pptx`
