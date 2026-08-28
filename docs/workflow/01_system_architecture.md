# Workflow Step 1: System Architecture & Data Flow

This document details the high-level architecture, module breakdown, database schema, and end-to-end data flow of the Visual Risk AI platform.

---

## 1. System Overview

Visual Risk AI is a decoupled, full-stack decision-support system designed to model, forecast, and optimize life trajectories across financial, health, productivity, and habit dimensions.

```
+-----------------------------------------------------------------------------+
|                               Client Browser                                |
|   React 19 + TypeScript + Vite + TanStack Router + Tailwind CSS             |
|   - Central Store (twin-store.tsx)                                          |
|   - Fullscreen Visual Risk Copilot (/chat)                                 |
|   - Interactive Settings & Telemetry Control Center (/settings)             |
|   - Role Persona Engine & Dynamic Vocabulary                                |
|   - Recharts Visualizations (Monte Carlo & Grouped Bar Charts)              |
+--------------------------------------^--------------------------------------+
                                       | REST / JSON
+--------------------------------------v--------------------------------------+
|                             FastAPI Backend API                             |
|   - Routers: /chat, /users, /records, /simulations, /suggestions, /study    |
|   - 4-Stage Agentic Reasoning Pipeline & Action Approval Engine             |
|   - Baseline Computation & Normalization Engine                             |
|   - Forecast & Scenario Simulation Controller                               |
+-----------------^-------------------------------------------^---------------+
                  |                                           |
+-----------------v---------------+       +-------------------v---------------+
|     SQLite / SQLAlchemy ORM     |       |             AI Engine             |
|   - Users (with Persona Role)   |       |  - 4-Stage Copilot Reasoning      |
|   - HabitLogs, StudyLogs, Txns  |       |  - Monte Carlo Simulator (500x)   |
|   - ChatSession, ChatMessage    |       |  - Compound Wealth Forecaster     |
|   - UserSuggestions (Persisted) |       |  - Groq API (GPT-OSS 120B / 20B)  |
|   - Local SQLite Cache (Noon)   |       |  - Rule-Based Mathematical Engine |
+---------------------------------+       +-----------------------------------+
```

---

## 2. Core Modules

### 1. Frontend Layer (`frontend/`)
- **Routing & State**: Powered by TanStack Router and TanStack Start. State is synchronized in `twin-store.tsx` between browser storage and the FastAPI REST layer.
- **Conversational Copilot**: Fullscreen chat interface (`/chat`) with collapsible sidebar, real-time thought disclosure (`<think>`), and 1-click interactive action proposals.
- **Interactive Control Center**: `/settings` page with 5 configuration panels (Persona, Biometrics, Finance, AI Intelligence, System).
- **Dynamic Vocabulary**: The active role persona (`student`, `professional`, `freelancer`, `entrepreneur`, `retiree`) transforms metric titles, field labels, suggestions, and chart annotations dynamically.
- **Charts & Gauges**: Interactive SVG gauges for health and focus indices; Recharts for Monte Carlo probability bands, line scenario overlays, and grouped habit bars.

### 2. Backend API Layer (`backend/`)
- **FastAPI Core**: High-performance asynchronous REST endpoints (`backend/main.py`).
- **Data Routers**:
  - `backend/api/chat.py`: Multi-turn conversational intelligence, thread management, and action execution/rejection.
  - `backend/api/users.py`: Unified login (`POST /users/login`), user creation with dual uniqueness checks, and profile telemetry updates.
  - `backend/api/suggestions.py`: AI habit pre-analysis, suggestion generation/expansion, and database persistence.
  - `backend/api/study.py`: Spaced repetition analytics, session logs, and 7-day optimized study plan caching.
  - `backend/api/records.py`: Habit logs, study blocks, and financial transaction recording.
  - `backend/api/simulations.py`: Baseline calculations, Monte Carlo forecasting, AI scenario generation, and advice retrieval.

### 3. Database Layer (`database/`)
- **SQLAlchemy ORM**: Models defined in `database/models.py` (`User`, `HabitRecord`, `StudyRecord`, `FinancialRecord`, `ChatSession`, `ChatMessage`, `UserSuggestion`).
- **Pydantic Validation**: Strict typing in `database/schemas.py` for API requests and responses.
- **CRUD Operations**: Centralized database interactions in `database/crud.py`.

### 4. AI & Simulation Engine (`ai_engine/`)
- **Agentic Copilot Advisor** (`ai_engine/llm_integration/advisor.py`): 4-stage reasoning pipeline with active Groq models (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.6-27b`, `groq/compound`) and rule-based mathematical fallbacks.
- **Forecasting Module** (`ai_engine/forecasting/`): Deterministic compound interest modeling and 500-iteration Monte Carlo stochastic simulations.
- **Simulation Module** (`ai_engine/simulation/`): Multi-scenario lifestyle modification engine computing biological tradeoffs (Sleep vs Health Index vs Focus Rating).

---

## 3. Database Indexing & Query Optimizations
- Indexed `habit_records.created_at`, `habit_records.user_id`, and `study_records.user_id` for fast 30-day baseline retrievals.
- Foreign key indexing on `chat_sessions.user_id` and `chat_messages.session_id` ensuring instantaneous conversational history loading.
- Optimized categorical lookups across financial transactions and user suggestions.

---

## 4. REST API Status Codes & Exception Standards
- Standard HTTP 200/201 for successful mutations and query evaluations.
- Standard HTTP 400 for input validation errors (e.g. duplicate email/username during signup).
- Standard HTTP 403 Forbidden for cross-user session access attempts.
- Standard HTTP 404 for missing entities with structured JSON details.
- Graceful fallback degradation when optional upstream LLMs are offline.
