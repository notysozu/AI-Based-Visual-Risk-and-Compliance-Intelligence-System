# Visual Risk AI — Milestone Feature & Engineering Deliverables Document

**System**: Visual Risk AI (AI-Based Visual Risk and Compliance Intelligence System / Digital Twin AI)  
**Project Team**: Team 05  
**Team Members**:
- Sonu Kumar Suman
- Hasini Pericharla
- Piyush Srivastava
- Krishna Prasad Kurmi

**Document Classification**: Engineering Architecture & Milestone Specification  
**Version**: 1.0.0 (Production Release)  

---

## Executive Summary

Visual Risk AI (VRCI) is an agentic, intelligent risk, compliance, and decision-support platform designed to model, forecast, and optimize human trajectories across operational compliance, financial health, cognitive vitality, and daily productivity. By synthesizing stochastic Monte Carlo modeling, deterministic biological feedback algorithms, asynchronous document persistence, and conversational multi-agent intelligence, Visual Risk AI provides users with a living digital twin.

This document presents the complete technical breakdown of the engineering lifecycle across all five project milestones, detailing the **Primary Goal**, **Key Features Implemented**, and **Core Technologies Used** for each milestone.

---

## Milestone Breakdown Index

1. [Milestone 1: Core Features, Layout, and Secure Authentication](#milestone-1-core-features-layout-and-secure-authentication)
2. [Milestone 2: Database Architecture & Data Pipelines](#milestone-2-database-architecture--data-pipelines)
3. [Milestone 3: Digital Twin Simulation Engine](#milestone-3-digital-twin-simulation-engine)
4. [Milestone 4: Conversational AI & Real-Time Predictive Dashboard](#milestone-4-conversational-ai--real-time-predictive-dashboard)
5. [Milestone 5: Full-Stack Integration, Testing, Deployment & Final Presentation](#milestone-5-full-stack-integration-testing-deployment--final-presentation)

---

## Milestone 1: Core Features, Layout, and Secure Authentication

### 1. Primary Goal
Establish the foundational full-stack client-server architecture, design a responsive claymorphic/tactile user interface system, implement an enterprise-grade cryptographic authentication subsystem, and construct a dynamic multi-persona onboarding engine with baseline biometric and financial telemetry.

### 2. Key Features Implemented

- **5 Demographic Life-Stage Personas**:
  - Implemented an initialization matrix supporting 5 distinct archetypes: **College Student** (Coursework Mastery), **Working Professional** (Career Acceleration), **Freelancer / Creator** (Revenue Smoothing), **Entrepreneur / Founder** (Venture Scaling), and **Active Retiree** (Capital Preservation).
  - Pre-calibrated deterministic baseline parameters for each persona, including baseline sleep hours, cognitive focus scores, income/expense distributions, and risk tolerances.
- **Cryptographic Authentication Subsystem**:
  - Dual-algorithm password hashing using **Argon2id** and **Bcrypt** (cost factor 12) with salt isolation.
  - Asymmetric token architecture utilizing short-lived 15-minute **JWT access tokens** paired with 7-day **rotating HttpOnly SameSite refresh tokens**.
  - **Token Family Reuse Detection**: Automatic revocation of the entire token family upon detection of replayed or revoked refresh tokens to mitigate token theft.
  - Enumeration-safe handlers returning consistent, generic error responses to prevent account reconnaissance.
- **Claymorphic Component Architecture & Layout**:
  - Built a comprehensive tactile design system with soft-shadow claymorphism, micro-interactions, and responsive side navigation.
  - Dark and Light theme toggle with client-side local storage synchronization.
  - Seamless route transitions and layout wrappers utilizing TanStack Router.
- **Multi-Port Dynamic Backend Auto-Discovery**:
  - Constructed an intelligent client-side discovery client that automatically probes backend ports (`8000` and `8001`) with automatic fallback to guarantee local development resilience.
- **1-Click Demo Persona Switcher**:
  - Onboarding gateway allowing instant testing of all 5 life-stage personas without manual form entry.

### 3. Core Technologies Used
- **Frontend Client**: React 19, TypeScript, Vite, TanStack Router, Tailwind CSS v4, Radix UI Primitives, Lucide React Icons.
- **Backend API Gateway**: FastAPI (Python ASGI), Pydantic v2 (Strict DTO Validation), Uvicorn.
- **Security & Cryptography**: Python `passlib` (Argon2id, Bcrypt), `python-jose` (Cryptographic JWT Signing), `cryptography`.

---

## Milestone 2: Database Architecture & Data Pipelines

### 1. Primary Goal
Architect a decoupled, high-throughput, document-oriented persistence tier with asynchronous I/O, strict validation schemas, automated startup rehydration, and a dual-layer fault-tolerant disk snapshot failover mechanism guaranteeing zero data loss.

### 2. Key Features Implemented

- **Asynchronous Document Modeling (Beanie ODM + Motor)**:
  - Engineered 8 core document schemas:
    1. `UserDoc`: User credentials, demographics, active persona, baseline metrics, and autonomy governance settings.
    2. `ChatSessionDoc`: Multi-turn conversational history with embedded action proposals and reasoning traces.
    3. `HabitRecordDoc`: Daily sleep duration, exercise minutes, screen time, and subjective focus ratings.
    4. `StudyRecordDoc`: Coursework pomodoro sprints, subject tracking, and retention ratings.
    5. `FinancialRecordDoc`: Discretionary cashflow logs, income streams, recurring expenses, and category tags.
    6. `UserSuggestionDoc`: AI-synthesized schedule suggestions, adoption states, and impact ratings.
    7. `AppCacheDoc`: Cached 24-hour retrospective summaries and telemetry aggregates.
    8. `RefreshTokenDoc`: Active refresh token hashes, expiration timestamps, and token family identifiers.
- **Dual-Layer Fault-Tolerant Persistence Engine**:
  - Dynamic connection manager connecting to live **MongoDB Atlas Replica Sets** with automatic fallback to embedded in-memory MongoDB (`mongomock_motor`).
  - Integrated a persistent JSON snapshot engine (`data/mongodb_persistence.json`) that synchronizes memory state to non-volatile disk storage.
- **Atomic Two-Phase Disk Snapshotting**:
  - Snapshot engine writes document state to a temporary `.tmp` file before executing an atomic OS rename, completely eliminating snapshot corruption during abrupt server terminations.
- **Lossless Document Rehydration**:
  - Automatic startup routine scanning disk snapshots to rehydrate user profiles, conversation threads, and telemetry logs into the operational database.
- **Telemetry Ingestion & Aggregation Pipelines**:
  - Asynchronous background pipelines calculating rolling 30-day telemetry baselines, sleep deficit trends, and cashflow surpluses.
- **Automated Noon Intelligence Caching**:
  - Daily 12:00 PM background cron evaluating the past 24 hours of biometrics to generate and cache retrospective insights in `AppCacheDoc`.

### 3. Core Technologies Used
- **Database**: MongoDB Atlas Cluster (Cloud Replica Set), Motor 3.3+ (AsyncIO MongoDB Driver), PyMongo.
- **ODM Layer**: Beanie ODM (Async Object Document Mapper), Pydantic v2.
- **Fault-Tolerance & Failover**: `mongomock_motor` (In-Memory Engine), Python `asyncio`, JSON Atomic File Serialization.

---

## Milestone 3: Digital Twin Simulation Engine

### 1. Primary Goal
Construct deterministic, stochastic, and biological mathematical simulation engines that model non-linear human trajectories across multi-year horizons, financial market volatility, circadian energy states, and academic mastery curves.

### 2. Key Features Implemented

- **Dual-Scenario Decision Sandbox (`/simulator`)**:
  - Interactive comparative modeling interface evaluating **Scenario A** (Current Baseline) versus **Scenario B** (Hypothetical Life Decision) across 5 to 40-year horizons.
  - Real-time parameter sliders for sleep adjustments, study sprint allocations, discretionary spending cuts, and savings rate modifications.
  - **1-Click Preset Commit**: Allows users to apply optimized simulated parameters directly back into their live database profile.
- **Stochastic Monte Carlo Wealth Engine (`/wealth`)**:
  - Built a 500-iteration **Geometric Brownian Motion (GBM)** simulation engine modeling portfolio growth under stochastic market volatility.
  - Outputs statistical percentile bands: **P10** (Downside Risk Floor), **P50** (Median Expected Trajectory), and **P90** (Optimistic Upside Ceiling).
  - Calculates probability of milestone attainment by target retirement age, adjusting for compound annual growth rate (CAGR) and annual inflation.
- **Biological Feedback & Circadian Elasticity Modeling**:
  - Non-linear mathematical formula quantifying the cognitive focus penalty resulting from cumulative sleep deficit.
  - Multi-variable Vitality and Health Index calculators coupling rest duration, physical activity, and screen exposure to daily focus capacity.
- **Ebbinghaus Spaced Repetition & Academic Forecaster (`/study`)**:
  - Mathematical decay curves modeling knowledge retention loss over time.
  - Probabilistic exam readiness score forecasting based on cumulative Pomodoro study volume and spaced revision adherence.
- **Compound Opportunity Cost Calculator**:
  - Financial engine evaluating the long-term compound cost of major one-time discretionary purchases against an 8% benchmark index investment.

### 3. Core Technologies Used
- **Mathematical Computation**: NumPy (Matrix Operations & GBM Vectorization), SciPy (Statistical Distributions & Percentile Calculations), Python `math`.
- **Data Analytics**: Pandas (Rolling Averages, Variance Calculations, Correlation Matrices).
- **Visualization**: Recharts, D3.js (Interpolated Curves, Percentile Area Bands, SVG Dials).
- **Client Caching**: TanStack Query (Reactive In-Memory Query & Simulation Caching).

---

## Milestone 4: Conversational AI & Real-Time Predictive Dashboard

### 1. Primary Goal
Deploy an agentic conversational copilot and a living telemetry command center that transforms natural language dialogue into transparent mathematical reasoning and 1-click executable database mutations.

### 2. Key Features Implemented

- **Multi-Agent Intent Router & 6 Domain Sub-Agents**:
  - Contextual router classifying user intent and dispatching prompts to 6 specialized domain agents:
    1. `GoalAgent`: Milestone decomposition, timeline planning, and feasibility scoring.
    2. `FinanceAgent`: Budget optimization, expense categorization, and wealth projections.
    3. `SettingsAgent`: Autonomy governance modifications, persona switching, and telemetry toggles.
    4. `PlannerAgent`: Circadian schedule synthesis, deep work placement, and task generation.
    5. `StudyAgent`: Academic revision planning, Pomodoro allocation, and exam prep.
    6. `HabitAgent`: Biometric logging, sleep debt recovery, and habit formation feedback.
- **4-Stage Transparent Reasoning Pipeline**:
  - Structured cognitive pipeline disclosing:
    1. *Goal Definition & Target Decomposition*
    2. *Telemetry Gathering from Live Database State*
    3. *Multi-Criteria Analysis & Stochastic Modeling*
    4. *Strategic Execution Plan & 1-Click Action Card Proposal*
  - Interactive collapsible `<think>` verification trees allowing users to inspect the underlying mathematical calculations.
- **Dynamic Markdown Table & Timestamp Parser**:
  - Natural Language Processing parser extracting structured schedules from LLM Markdown tables, duration-labeled items, and timestamp lists into executable `add_multiple_tasks` payloads.
- **Direct Database Mutation Pipeline (`auto_execute`)**:
  - Enables the copilot to propose action cards that immediately execute database mutations and trigger reactive frontend synchronization (`useTwin`) without page reloading.
- **Living Digital Twin Dashboard (`/dashboard`)**:
  - Centralized command center featuring animated SVG dials for Cognitive Vitality and Health Index, discretionary cashflow meters, today's circadian task sequence, and long-term goal progress bars.
- **Study Cockpit & Ambient Soundscapes (`/study`)**:
  - Integrated productivity environment with 7-day Pomodoro sprint calendars, exam target counters, spaced repetition checklists, and loop-locked ambient video soundscapes.
- **Native Voice Dictation**:
  - Integrated Web Speech API for real-time speech-to-text input with dynamic audio waveform feedback.

### 3. Core Technologies Used
- **Large Language Models**: Groq Cloud API (`openai/gpt-oss-120b`, `llama-3.3-70b-versatile`, `qwen/qwen3.6-27b`).
- **NLP & Parsing**: Python Regular Expressions, Structured Markdown AST Parsing, Pydantic DTO Serialization.
- **Voice Recognition**: Web Speech API (Native Browser Speech Recognition Engine).
- **Frontend UI & Formatting**: ReactMarkdown, Remark-GFM, Radix UI Primitives, Lucide React, Sonner Toast Notifications.

---

## Milestone 5: Full-Stack Integration, Testing, Deployment & Final Presentation

### 1. Primary Goal
Perform comprehensive end-to-end system integration, execute exhaustive automated verification suites, harden production security policies, configure production deployment scripts, and publish executive documentation and presentation materials.

### 2. Key Features Implemented

- **Automated 21-Test Pytest Suite (100% Pass Rate)**:
  - Full automated coverage spanning mathematical models, Pydantic schemas, auto-planner fallback rules, and multi-turn schedule parsers.
- **76-Check Live MongoDB Integration Suite (`test_live_mongodb_e2e.py`)**:
  - Validates full user registration, authentication headers, telemetry writes, snapshot persistence serialization, and live rehydration.
- **100-Test E2E Benchmark Suite (`run_exact_100_e2e_tests.py`)**:
  - Exhaustive end-to-end integration suite verifying all system endpoints, persona baselines, and database mutations.
- **3-Tier Autonomy Governance System (`/settings`)**:
  - Configurable operational governance tiers:
    1. *Supervised Mode*: Requires explicit user confirmation for every schedule or financial mutation.
    2. *Semi-Autonomous Mode*: Automatically commits routine focus blocks while prompting for major shifts, with an undo window.
    3. *Full Autonomous Mode*: Proactively optimizes daily schedules and habit suggestions.
- **Production Build Hardening**:
  - Zero TypeScript compilation errors and zero bundler warnings across all client routes.
  - Multi-threaded Uvicorn ASGI configuration with graceful lifecycle shutdown and signal traps.
- **Comprehensive Documentation Suite**:
  - Complete technical documentation published in `docs/`:
    - API Reference & Example Payloads (`docs/api_reference.md`)
    - 15-Principle Authentication & Security Architecture (`docs/authentication_architecture.md`)
    - System Architecture & Flowchart (`docs/system_architecture.md`)
    - Engineering Tech Stack (`docs/tech_stack.md`)
    - User Personas Specification (`docs/user_personas.md`)
    - Quality Assurance & Test Report (`docs/test_report.md`)
    - Step-by-Step Workflow Guides (`docs/workflow/`)
- **Executive Presentation Deck**:
  - Professional slide deck published in PowerPoint (`docs/presentation/Visual_Risk_AI_Project_Presentation.pptx`), PDF, and Markdown format (`docs/presentation/presentation_slides.md`).

### 3. Core Technologies Used
- **Testing & Verification**: Pytest, Playwright, Python Requests, Python AsyncIO.
- **Production Infrastructure**: Uvicorn ASGI Server, Node.js / Vite Production Bundler.
- **Document Generation**: Python-docx, Python-pptx, ReportLab, GitHub Flavored Markdown (GFM).
- **Version Control & Maintenance**: Git, GitHub Actions.

---

## Summary Matrix Across All 5 Milestones

| Milestone | Primary Goal | Key Deliverables | Core Technologies |
| :--- | :--- | :--- | :--- |
| **Milestone 1** | Core Features, Layout & Secure Auth | 5 Demographic Personas, Argon2id/Bcrypt Auth, JWT + Rotating Refresh Tokens, Claymorphic UI | React 19, TypeScript, Vite, Tailwind CSS v4, FastAPI, Passlib, Python-Jose |
| **Milestone 2** | Database Architecture & Data Pipelines | 8 Beanie ODM Schemas, In-Memory Mongo Failover, Atomic JSON Disk Snapshots, Noon Cache | MongoDB Atlas, Motor 3.3+, Beanie ODM, Mongomock, AsyncIO, Pydantic v2 |
| **Milestone 3** | Digital Twin Simulation Engine | 500-Run Monte Carlo Wealth Engine, Decision Sandbox, Circadian Elasticity, Spaced Repetition | NumPy, SciPy, Pandas, Recharts, D3.js, TanStack Query |
| **Milestone 4** | Conversational AI & Real-Time Dashboard | Multi-Agent Intent Router (6 Sub-Agents), 4-Stage Reasoning, Table Parser, Living Dashboard | Groq LLM API, Web Speech API, ReactMarkdown, Radix UI, Sonner |
| **Milestone 5** | Integration, Testing, Deployment & Presentation | 21 Pytest Suite, 76-Check Live Suite, 100-Benchmark Suite, 3-Tier Governance, PPTX Presentation | Pytest, Playwright, Python-pptx, Python-docx, Uvicorn, GFM |

---

## Project Team Attribution

Visual Risk AI (VRCI) was engineered and delivered by **Team 05**:
- **Sonu Kumar Suman**
- **Hasini Pericharla**
- **Piyush Srivastava**
- **Krishna Prasad Kurmi**

*Visual Risk AI — Intelligent Multi-Persona Trajectory Engine.*
