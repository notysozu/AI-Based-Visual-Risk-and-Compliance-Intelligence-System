# Workflow Step 8: Visual Risk Copilot & Conversational Agent

This document details the architecture, 4-stage agentic reasoning pipeline, dynamic schedule table parser, multi-action proposal system, voice recognition, database persistence, and API specification for the **Visual Risk Copilot** (`/chat`).

---

## 1. Overview & Core Purpose

The Visual Risk Copilot is a conversational intelligence agent designed to simulate decisions, optimize daily circadian routines, evaluate financial tradeoffs, and forecast long-term life trajectory.

Unlike generic chatbots, the Copilot is deeply integrated with the user's live database state (biometrics, habit logs, study records, cash flow, and active milestone goals). Every response is backed by mathematical modeling and stochastic simulations, presenting clear `<think>` reasoning blocks and 1-click interactive action proposals.

---

## 2. 4-Stage Agentic Reasoning Pipeline

Whenever a user prompts the Copilot, the AI execution engine processes the turn through four distinct phases:

```mermaid
flowchart TD
  S1["Step 1: Goal Definition<br/>• Decomposes user inquiry into explicit optimization targets<br/>• Identifies domain: circadian productivity boost, purchase milestone friction, sleep shifts"]
  S2["Step 2: Telemetry Search & Data Gathering<br/>• Queries DB habit logs (average sleep, sleep debt, screen time, exercise)<br/>• Gathers study records, focus subjects, cash flow surplus & milestones"]
  S3["Step 3: Multi-Criteria Analysis & Optimization<br/>• Maps daily cortisol & alertness curves (08:30–11:30 peak cognitive sprint)<br/>• Models biological elasticity tradeoffs (Sleep vs Health Index vs Focus)<br/>• Runs deterministic compound growth & stochastic Monte Carlo forecasts"]
  S4["Step 4: Strategic Execution Plan & Action Proposal<br/>• Synthesizes executive summary and unbroken GitHub-Flavored Markdown table<br/>• Attaches interactive 1-click Action Proposal Card for direct DB commit"]

  S1 --> S2 --> S3 --> S4
```

---

## 3. Dynamic Schedule Table & List Parsing Engine

The system features a dedicated parsing engine (`ai_engine/llm_integration/table_parser.py`) that extracts structured tasks from any Markdown table or bulleted list generated in dialogue turns:

```mermaid
flowchart LR
  subgraph InputFormats["Dialogue Inputs"]
    T1["Markdown Schedule Table<br/>| Mon | Strength | 45 min |"]
    T2["Circadian Daily Table<br/>| 09:00 | Deep Work | 90m |"]
    T3["Bulleted Schedule List<br/>- 08:00 AM: Cardio (30m)"]
  end

  subgraph Parser["Table & Schedule Parser"]
    P1["Column Identification<br/>Time · Title · Duration · Category · Impact"]
    P2["Category Inference<br/>Health · Work · Study · Money · Routine"]
    P3["Normalization<br/>Standard HH:MM times & Integer minutes"]
  end

  subgraph Output["Action Payload"]
    O1["action_type: add_multiple_tasks<br/>action_payload: {tasks: [...]}"]
  end

  T1 & T2 & T3 --> P1 --> P2 --> P3 --> O1
```

---

## 4. Multi-Turn Planning Dialogue Flow

When users ask to plan a routine across multiple dialogue turns, the Copilot seamlessly tracks context, extracts history tables, and commits tasks to the Daily Planner:

```mermaid
sequenceDiagram
  autonumber
  actor User as User
  participant Copilot as Visual Risk Copilot
  participant Parser as Table Parser
  participant DB as MongoDB (UserDoc.tasks_json)

  User->>Copilot: "let's plan something"
  Copilot-->>User: "Hey! What would you like to plan — financial, fitness, or study routine?"

  User->>Copilot: "lets say fitness schedule"
  Copilot->>Parser: build_fitness_schedule()
  Copilot-->>User: Fitness Blueprint Table + action_type: "add_multiple_tasks"

  User->>Copilot: "yes plug it in my daily plannar"
  Copilot->>Parser: parse_schedule_tasks_from_text(history)
  Parser-->>Copilot: 7 Calibrated Fitness Tasks (Health, Start Times, Durations)
  Copilot->>DB: Append tasks to UserDoc.tasks_json & UserSuggestionDoc (status: executed)
  Copilot-->>User: "I have calibrated and plugged these 7 focus blocks directly into your Daily Planner."
```

---

## 5. Interactive Multi-Action Proposal System

Copilot responses can attach structured actionable payloads (`action_type`, `action_payload`, `action_status`) that execute directly or await 1-click user approval based on the active autonomy mode:

```mermaid
flowchart LR
  CopilotTurn["Copilot Reasoning Turn"] --> ActionRouter{"Action Type Proposal"}
  
  ActionRouter -->|add_multiple_tasks| Act1["add_multiple_tasks<br/>• Plans whole day with calibrated blocks<br/>• Injects into /planner"]
  ActionRouter -->|add_task| Act2["add_task<br/>• Creates single deep work block<br/>• Categorized with impact tag"]
  ActionRouter -->|purchase_impact| Act3["purchase_impact<br/>• Simulates capital friction<br/>• Computes 5-Yr CAGR loss"]
  ActionRouter -->|simulate_what_if| Act4["simulate_what_if<br/>• Sandboxes lifestyle tradeoffs<br/>• Updates slider presets"]
  ActionRouter -->|wealth_forecast| Act5["wealth_forecast<br/>• Runs 500 Monte Carlo paths<br/>• Computes percentile floor/ceiling"]
  ActionRouter -->|update_settings| Act6["update_settings<br/>• Modifies income/sleep targets<br/>• Persists to MongoDB UserDoc"]
```

---

## 6. Collapsible Step-by-Step Reasoning (`<think>`)

When **Think Mode** is active, the model generates an explicit reasoning block wrapped in `<think>...</think>` tags:
- Formats step-by-step mathematical computations, baseline deltas, and probability variance.
- Displayed in the chat UI as a collapsible accordion badge (*"Thought Process"*) with a brain icon and monospace formatting.
- Can be toggled on/off on demand via the UI Think switch or in `/settings`.

---

## 7. Voice Input & Speech Recognition

- **Web Speech API Integration**: Built-in voice dictation allowing hands-free interaction with the Copilot.
- **Audio Waveform Feedback**: Visual listening indicator pulsing in real time while capturing speech.
- **Auto-Transcription**: Automatically populates the chat prompt input and enables instantaneous turn submission.

---

## 8. Database Models & Schema

Chat interactions are persisted in MongoDB through Beanie Document models with embedded messages:

```mermaid
classDiagram
  class ChatSessionDoc {
    +ObjectId id
    +String user_id
    +String title
    +DateTime created_at
    +DateTime updated_at
    +List~ChatMessageDoc~ messages
  }

  class ChatMessageDoc {
    +String id
    +String role
    +String content
    +String action_type
    +String action_payload
    +String action_status
    +DateTime created_at
  }

  ChatSessionDoc *-- ChatMessageDoc
```

---

## 9. Persistent Tutorial Guide Thread & User Lifecycle Recovery

Every user account in Visual Risk AI is initialized with a dedicated, persistent **Tutorial** conversational thread upon creation or login:

```mermaid
sequenceDiagram
  autonumber
  actor User as User
  participant FE as Frontend (/chat)
  participant API as FastAPI Gateway (/chat/sessions)
  participant DB as MongoDB (ChatSessionDoc)
  participant Disk as Local Snapshot Engine

  User->>FE: Mount /chat (or switch account / login)
  FE->>API: GET /chat/sessions/{user_id}
  API->>DB: Query ChatSessionDoc.find(user_id)
  alt No sessions exist
    API->>DB: Seed "Tutorial" ChatSessionDoc with Welcome Onboarding Guide
    API->>Disk: Trigger save_persistence_snapshot() to data/mongodb_persistence.json
  end
  DB-->>API: Return [TutorialSessionDoc, ...UserSessions]
  API-->>FE: Return JSON session array
  FE->>FE: Auto-select Tutorial session & fetch full message history
  FE-->>User: Render Welcome Guide and ready for user inquiries
```

### Key Lifecycle Guarantees:
1. **Eager Tutorial Seeding**: When `crud.create_user()` or `crud.get_or_create_demo_user()` is executed, the Tutorial thread is immediately written to MongoDB and persisted to disk.
2. **Account Switch / Logout Isolation**: When a user logs out and a different user logs in, the active session state and message history reset cleanly, loading the new user's threads without ghost state.
3. **Lossless Recovery**: If a user logs out and logs back in, all custom conversation threads and the Tutorial thread are restored with intact `<think>` reasoning trees and action statuses.

---

## 10. Embedded Database & Local Disk Persistence Engine

For standalone deployments and offline environments, Visual Risk AI features an embedded MongoDB document engine paired with an automatic JSON snapshot persistence layer (`data/mongodb_persistence.json`):

- **Automatic Snapshotting**: Every create, update, and delete operation on `UserDoc`, `ChatSessionDoc`, `HabitRecordDoc`, `StudyRecordDoc`, `FinancialRecordDoc`, and `UserSuggestionDoc` invokes `save_persistence_snapshot()`.
- **Atomic File Swapping**: Persistence snapshots write to a temporary file (`.tmp`) and atomically replace the destination file to prevent corruption.
- **Auto-Rehydration on Startup**: Upon backend boot, `load_persistence_snapshot()` restores all collections, users, and conversational histories into the active document store.

---

## 11. REST API Reference for Chat

```mermaid
flowchart TB
  subgraph ChatEndpoints["Chat Endpoints (/chat)"]
    direction TB
    C1["GET /chat/sessions/{user_id}<br/>• Lists chronological threads with preview and ensures Tutorial seed"]
    C2["POST /chat/sessions/{user_id}<br/>• Creates blank thread"]
    C3["DELETE /chat/sessions/{session_id}<br/>• Deletes thread with ownership verification"]
    C4["GET /chat/messages/{session_id}<br/>• Retrieves full message history"]
    C5["POST /chat/message/create_thread<br/>• Creates thread & processes turn 1"]
    C6["POST /chat/message/{session_id}<br/>• Processes follow-up turn in thread"]
    C7["POST /chat/action/execute/{msg_id}<br/>• Executes proposed action in MongoDB"]
    C8["POST /chat/action/reject/{msg_id}<br/>• Dismisses proposed action"]
  end
```

---

*Back to [README.md](../../README.md)*
