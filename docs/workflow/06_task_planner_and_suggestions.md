# Workflow Step 6: Task Planner & Smart Suggestions Engine

This document details the role-adapted daily task planner (`/planner`), the data-driven smart suggestions intelligence engine (`/suggestions`), the autonomous circadian auto-planner (`/planner/auto-plan`), and one-click database execution.

---

## 1. Role-Tailored Task Categories

The task planner dynamically filters and organizes categories based on the user's active persona:

```mermaid
flowchart LR
  subgraph Personas["5 Life-Stage Personas"]
    P1["Student"]
    P2["Working Professional"]
    P3["Freelancer / Creator"]
    P4["Founder / Entrepreneur"]
    P5["Retiree / Senior"]
  end

  subgraph Categories["Role-Adapted Focus Domains"]
    C1["Study · Exams · Campus · Money · Health · Social"]
    C2["Work · Career · Finance · Health · Upskilling · Personal"]
    C3["Client Work · Projects · Invoices · Admin · Health · Upskilling"]
    C4["Product · Growth · Fundraising · Operations · Team · Health"]
    C5["Health · Hobbies · Finance · Family · Home · Leisure"]
  end

  P1 --> C1
  P2 --> C2
  P3 --> C3
  P4 --> C4
  P5 --> C5
```

---

## 2. Smart AI Suggestion Engine (`/suggestions`)

The suggestions engine performs deep data pre-analysis before synthesizing personalized lifestyle, focus, and financial suggestions.

### Pre-Analysis Pipeline

```mermaid
flowchart TD
  A1["1. Active Persona Role Check<br/>• Adapts expectations (Student vs Founder vs Retiree)"] --> A2["2. 30-Day Measured Telemetry Baseline<br/>• Sleep debt (<7.0h) & Screen time load (>5.0h)<br/>• Study consistency & Exercise frequency"]
  A2 --> A3["3. Financial Milestone Targets<br/>• Current net worth vs retirement goal<br/>• Monthly cash flow surplus & savings rate"]
  A3 --> A4["4. Diagnostic Callouts Formulation<br/>• Generates diagnostic prompts for Groq LLM inference"]
```

---

## 3. Database Persistence (`UserSuggestionDoc` & `UserDoc.tasks_json`)

Suggestions and tasks are persisted in MongoDB through Beanie document models:

```mermaid
classDiagram
  class UserSuggestionDoc {
    +ObjectId id
    +String user_id
    +String suggestion_id
    +String title
    +String category
    +String detail
    +String impact
    +String start_time
    +Int duration_minutes
    +Int is_adopted
    +Int is_ai_generated
    +DateTime created_at
  }

  class UserDocTasks {
    +String id
    +String title
    +String category
    +String start
    +Int minutes
    +String impact
    +String detail
    +Boolean done
    +String date
    +Boolean fromSuggestion
    +Boolean is_auto_planned
  }
```

---

## 4. Autonomous AI Daily Planner & Self-Implementation Engine

The system features an autonomous, proactive circadian planning engine (`ai_engine/auto_planner.py`) and dedicated REST endpoints (`/planner/auto-plan/{user_id}`) that synthesize and commit daily focus routines directly into MongoDB without requiring manual prompts.

### Circadian Optimization Architecture

```mermaid
flowchart TD
  T1["Telemetry Baseline Analysis<br/>• Sleep Debt & Cortisol Window<br/>• Study Deficit & Savings Surplus"] --> S1["Circadian Slot Synthesizer"]
  S1 --> W1["07:00–08:30: Morning Activation & Vitality Recovery"]
  S1 --> W2["08:30–11:30: Peak Cognitive Focus Sprint"]
  S1 --> W3["13:30–15:30: Tactical Milestone Delivery"]
  S1 --> W4["17:00–18:30: Physical Vitality & Decompression"]
  S1 --> W5["21:00–22:00: Evening Synthesis & Sleep Debt Recovery"]
  
  W1 & W2 & W3 & W4 & W5 --> E1["Direct Database Implementation<br/>• UserSuggestionDoc is_adopted=1<br/>• UserDoc.tasks_json auto-synced"]
  E1 --> B1["Morning Intelligence Briefing Callout Banner"]
```

### 3-Tier Autonomy Governance

Users configure their desired autonomy level in `/settings`:

```mermaid
flowchart TB
  subgraph GovernanceModes["3-Tier Autonomy Governance Levels"]
    direction TB
    
    subgraph Mode1["1. Supervised Mode"]
      M1["Strict Human-in-the-Loop<br/>• Copilot generates proposal cards<br/>• Tasks await explicit 1-click approval<br/>• Zero automatic writes to MongoDB"]
    end

    subgraph Mode2["2. Semi-Autonomous Mode (Recommended Default)"]
      M2["Balanced Proactive Twin<br/>• Routine focus blocks, habit logs & study auto-commit directly<br/>• Major financial deductions & profile shifts require confirmation"]
    end

    subgraph Mode3["3. Full-Autonomous Mode"]
      M3["Self-Driving Digital Twin<br/>• Morning schedules auto-plan on app startup<br/>• All conversational planning turns write immediately to MongoDB"]
    end
  end
```

---

## 5. REST Endpoints for Planning & Suggestions

```mermaid
flowchart LR
  subgraph PlannerAPI["Daily Planner REST API (/planner)"]
    P1["POST /planner/auto-plan/{user_id}<br/>• Synthesizes circadian plan<br/>• Generates morning briefing<br/>• Commits to tasks_json"]
    P2["GET /planner/auto-plan/status/{user_id}<br/>• Returns today's planning status<br/>• Active briefing & task count"]
    P3["PUT /planner/autonomy-mode/{user_id}<br/>• Updates autonomy_mode<br/>• Toggles auto_planner_enabled"]
  end

  subgraph SuggestionAPI["Suggestions REST API (/suggestions)"]
    S1["GET /suggestions/{user_id}<br/>• Retrieves suggestions library"]
    S2["POST /suggestions/generate/{user_id}<br/>• Generates fresh suggestions"]
    S3["POST /suggestions/adopt/{user_id}<br/>• Adopts or dismisses suggestion"]
  end
```

---

*Back to [README.md](../../README.md)*
