# Workflow Step 1: System Architecture & Data Flow

This document details the high-level architecture, module breakdown, and end-to-end data flow of the Digital Twin AI platform.

---

## 1. System Overview

Digital Twin AI is a decoupled, full-stack decision-support system designed to model, forecast, and optimize life trajectories across financial, health, productivity, and habit dimensions.

```
+-----------------------------------------------------------------------+
|                           Client Browser                              |
|   React 19 + TypeScript + Vite + TanStack Router + Tailwind CSS       |
|   - Central Store (twin-store.tsx)                                    |
|   - Role Persona Engine & Dynamic Vocabulary                          |
|   - Recharts Visualizations (Monte Carlo & Grouped Bar Charts)        |
+-----------------------------------^-----------------------------------+
                                    | REST / JSON
+-----------------------------------v-----------------------------------+
|                        FastAPI Backend API                            |
|   - Routers: /users, /records, /simulations                           |
|   - Baseline Computation & Normalization Engine                       |
|   - Forecast & Scenario Simulation Controller                         |
+-----------------^---------------------------------^-------------------+
                  |                                 |
+-----------------v---------------+ +---------------v-------------------+
|     SQLite / SQLAlchemy ORM     | |           AI Engine               |
|   - Users (with Persona Role)   | |  - Monte Carlo Simulator (500x)   |
|   - HabitLogs, StudyLogs, Txns  | |  - Compound Wealth Forecaster     |
|   - Local SQLite Cache (Noon)   | |  - Groq LLM (Llama 3.1-8b)        |
+---------------------------------+ +-----------------------------------+
```

---

## 2. Core Modules

### 1. Frontend Layer (`frontend/`)
- **Routing & State**: Powered by TanStack Router and TanStack Start. State is synchronized in `twin-store.tsx` between browser LocalStorage and the FastAPI REST layer.
- **Dynamic Vocabulary**: The active role persona (`student`, `professional`, `freelancer`, `entrepreneur`, `retiree`) transforms metric titles, field labels, suggestions, and chart annotations on the fly.
- **Charts & Gauges**: Interactive SVG gauges for health and focus indices; Recharts for Monte Carlo probability bands, line scenario overlays, and grouped habit bars.

### 2. Backend API Layer (`backend/`)
- **FastAPI Core**: High-performance asynchronous REST endpoints (`backend/main.py`).
- **Data Routers**:
  - `backend/api/users.py`: Profile initialization, role updates, and settings persistence.
  - `backend/api/records.py`: Habit logs, study blocks, and financial transaction recording.
  - `backend/api/simulations.py`: Baseline calculations, Monte Carlo forecasting, AI scenario generation, and advice retrieval.

### 3. Database Layer (`database/`)
- **SQLAlchemy ORM**: Models defined in `database/models.py` (`User`, `HabitLog`, `StudyLog`, `FinancialRecord`).
- **Pydantic Validation**: Strict typing in `database/schemas.py` for API requests and responses.
- **CRUD Operations**: Centralized database interactions in `database/crud.py`.

### 4. AI & Simulation Engine (`ai_engine/`)
- **Forecasting Module** (`ai_engine/forecasting/`): Deterministic compound interest modeling and 500-iteration Monte Carlo stochastic simulations.
- **Simulation Module** (`ai_engine/simulation/`): Multi-scenario lifestyle modification engine computing biological tradeoffs (Sleep vs Health Index vs Focus Rating).
- **LLM Advisor** (`ai_engine/llm_integration/advisor.py`): Groq-integrated LLaMA 3.1 inference engine with fallback rule-based decision trees.


## 5. Database Indexing & Query Optimizations
- Indexed `habit_records.created_at` and `study_records.user_id` for fast 30-day baseline retrievals.
- Optimized categorical lookups across financial transactions and user suggestions.
