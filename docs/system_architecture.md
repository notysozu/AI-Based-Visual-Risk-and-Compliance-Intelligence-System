# System Architecture — Visual Risk AI

Visual Risk AI (VRCI) is engineered as a decoupled, multi-tier reactive architecture combining a high-performance React 19 frontend client, an asynchronous FastAPI backend gateway, a vectorized mathematical simulation engine, and an agentic LLM inference pipeline powered by MongoDB document persistence.

---

## High-Level Architecture Flowchart

```mermaid
flowchart TB
    %% Styling Classes
    classDef clientStyle fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef gatewayStyle fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
    classDef aiStyle fill:#311042,stroke:#c084fc,stroke-width:2px,color:#f8fafc;
    classDef dbStyle fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#f8fafc;

    subgraph Client["1. Client Presentation Layer (React 19 + TypeScript + Vite)"]
        Chat["Visual Risk Copilot (/chat)<br/>• Collapsible Threads Drawer<br/>• Multi-Action 1-Click Cards<br/>• Reasoning Chain & Voice STT"]:::clientStyle
        Simulator["Decision Sandbox (/simulator)<br/>• Scenario A vs B Comparison<br/>• Biological Feedback Modeling<br/>• 1-Click Scenario Adoption"]:::clientStyle
        Wealth["Wealth Planner (/wealth)<br/>• 500-Run Stochastic Monte Carlo<br/>• Percentile Bounds (p10/p50/p90)<br/>• Deterministic Compound Engine"]:::clientStyle
        Analytics["Habit Analytics (/analytics)<br/>• Grouped Correlation Visuals<br/>• Automated 12:00 PM Cache<br/>• Biometric Sleep/Exercise Logs"]:::clientStyle
        Planner["Daily Task Planner (/planner)<br/>• Daily Sprints & Time-Blocks<br/>• Direct Suggestion Injection"]:::clientStyle
        Settings["Settings Center (/settings)<br/>• 5 Telemetry Control Panels<br/>• Persona & Biometric Baseline"]:::clientStyle
    end

    subgraph Gateway["2. Backend API Gateway (FastAPI + Motor + Beanie ODM)"]
        UserRouter["Users Router (/users)<br/>• Unified Auth (Email/Username)<br/>• Onboarding & Telemetry CRUD"]:::gatewayStyle
        ChatRouter["Chat Router (/chat)<br/>• Session History & Ownership<br/>• 4-Stage Reasoning Dispatcher<br/>• Action Approval/Rejection"]:::gatewayStyle
        SimRouter["Simulation Router (/simulations)<br/>• Monte Carlo Wealth Projections<br/>• Dual Scenario Tradeoffs<br/>• AI Wealth Roadmap"]:::gatewayStyle
        SugRouter["Suggestions Router (/suggestions)<br/>• Habit Log Pre-Analysis<br/>• 1-Click Schedule Adoption"]:::gatewayStyle
        RecRouter["Records Router (/records)<br/>• Habit & Workout Telemetry<br/>• Study & Financial Records"]:::gatewayStyle
    end

    subgraph Intelligence["3. Simulation & AI Inference Engine (Groq + NumPy)"]
        subgraph Pipeline["4-Stage Agentic Reasoning Pipeline"]
            Step1["Step 1: Goal Definition"] --> Step2["Step 2: Telemetry Gathering"]
            Step2 --> Step3["Step 3: Multi-Criteria Analysis"]
            Step3 --> Step4["Step 4: Strategic Execution Plan"]
        end

        subgraph MathModels["Stochastic & Biological Feedback Models"]
            MonteCarlo["Stochastic Monte Carlo Engine<br/>• 500 Geometric Brownian Trials<br/>• Goal Attainment Probability"]
            BioFeedback["Biological Feedback Modeler<br/>• Circadian Cortisol Alerts<br/>• Sleep Debt & Vitality Elasticity"]
        end

        subgraph LLMProviders["AI Inference Providers (Groq API)"]
            Groq120B["openai/gpt-oss-120b (Primary)"]:::aiStyle
            Groq20B["openai/gpt-oss-20b (Secondary)"]:::aiStyle
            GroqQwen["qwen/qwen3.6-27b (Auxiliary)"]:::aiStyle
            OfflineRule["Heuristic Deterministic Fallback"]:::aiStyle
        end
    end

    subgraph Persistence["4. MongoDB Persistence Layer"]
        DB[(MongoDB Document Database: Local / Atlas<br/>• UserDoc Collection<br/>• HabitRecordDoc Collection<br/>• StudyRecordDoc Collection<br/>• FinancialRecordDoc Collection<br/>• ChatSessionDoc with Embedded Messages<br/>• UserSuggestionDoc Collection)]:::dbStyle
        Cache[(Intelligence Cache<br/>• 12:00 PM Noon AI Reflection<br/>• Monte Carlo Wealth Projections)]:::dbStyle
    end

    %% Client to Gateway REST Connections
    Chat -->|REST / JSON| ChatRouter
    Simulator -->|REST / JSON| SimRouter
    Wealth -->|REST / JSON| SimRouter
    Analytics -->|REST / JSON| RecRouter
    Planner -->|REST / JSON| SugRouter
    Settings -->|REST / JSON| UserRouter

    %% Gateway to Intelligence
    ChatRouter --> Pipeline
    Pipeline --> LLMProviders
    SimRouter --> MathModels
    SugRouter --> Pipeline
    SugRouter --> MathModels

    %% Gateway & Intelligence to Database
    UserRouter <--> DB
    ChatRouter <--> DB
    SimRouter <--> DB
    SugRouter <--> DB
    RecRouter <--> DB
    SimRouter <--> Cache
    Analytics <--> Cache
```

---

## Subsystem Component Interconnect Diagram

```mermaid
flowchart TB
  subgraph PresentationLayer["Presentation Layer (React 19 + TanStack Router)"]
    direction TB
    UI_Chat["Visual Risk Copilot (/chat)<br/>Fullscreen Chat, Voice Dictation & Action Cards"]
    UI_Sim["Decision Sandbox (/simulator)<br/>What-If Scenario A vs B Tradeoffs & Feedback"]
    UI_Wealth["Wealth Engine (/wealth)<br/>500-Path Monte Carlo Projections & Percentiles"]
    UI_Study["Study Intelligence (/study)<br/>7-Day Spaced Repetition Plan & Exam Readiness"]
    UI_Habits["Habit Analytics (/analytics)<br/>Circadian Correlations & Daily Reflections"]
    UI_Plan["Task Planner (/planner)<br/>Daily Focus Sprints & Suggestion Adoption"]
    UI_Set["Settings Center (/settings)<br/>5-Panel Control Hub & Persona Switcher"]
  end

  subgraph GatewayLayer["API Gateway Layer (FastAPI Asynchronous Routers)"]
    direction TB
    R_Auth["Auth & Users Router (/users)<br/>Dual Identifier Login & Dedicated Demo Twins"]
    R_Chat["Chat Router (/chat)<br/>Threads, Actions & 4-Stage Agentic Turns"]
    R_Sim["Simulation Router (/simulations)<br/>Baseline, Tradeoffs & Forecasts"]
    R_Study["Study Router (/study)<br/>Coursework Logs & 7-Day Plan Engine"]
    R_Sug["Suggestion Router (/suggestions)<br/>Habit Pre-Analysis & Suggestion Lifecycle"]
    R_Rec["Records Router (/records)<br/>Habits, Biometrics & Financial Flow"]
    R_Cache["Cache Router (/cache)<br/>High-Performance AppCache Gateway"]
  end

  subgraph IntelligenceLayer["Agentic Intelligence & Mathematical Engines"]
    direction TB
    AI_Agent["Groq Agentic Copilot<br/>4-Stage Reasoning (GPT-OSS 120B/20B & Qwen 3.6)"]
    AI_Math["Stochastic Simulation Engine<br/>500-Run Geometric Brownian Motion"]
    AI_Bio["Circadian & Biology Modeler<br/>Sleep Debt, Alertness Peaks & Focus Elasticity"]
  end

  subgraph PersistenceLayer["Persistence Layer (MongoDB Atlas / Local Engine)"]
    direction TB
    DB_Users[("users<br/>UserDoc")]
    DB_Habits[("habit_records<br/>HabitRecordDoc")]
    DB_Study[("study_records<br/>StudyRecordDoc")]
    DB_Fin[("financial_records<br/>FinancialRecordDoc")]
    DB_Chat[("chat_sessions<br/>ChatSessionDoc")]
    DB_Sug[("user_suggestions<br/>UserSuggestionDoc")]
    DB_Cache[("app_cache<br/>AppCacheDoc")]
  end

  PresentationLayer --> GatewayLayer
  GatewayLayer --> IntelligenceLayer
  GatewayLayer --> PersistenceLayer
```

---

*Back to [README.md](../README.md)*
