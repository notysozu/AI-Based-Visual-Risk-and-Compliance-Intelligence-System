# System Architecture — Visual Risk AI

Visual Risk AI is engineered as a decoupled, multi-tier architecture combining a React frontend, FastAPI backend, AI inference pipeline, mathematical simulation engine, autonomous planner, and MongoDB persistence layer.

---

## 1. High-Level Architecture Flowchart

```mermaid
flowchart TB
    Client["Client Presentation Layer<br/>React 19 + TypeScript + Vite"]
    Gateway["Backend API Gateway<br/>FastAPI + Beanie + Motor"]
    AI["AI & Simulation Engine<br/>Groq + NumPy"]
    DB[("MongoDB<br/>Persistence Layer")]

    Client -->|REST / JSON| Gateway
    Gateway --> AI
    Gateway --> DB
    AI --> DB
```

### Main Components

```mermaid
flowchart LR
    Client["React Frontend"]
    API["FastAPI"]
    Intelligence["AI + Simulation"]
    Database[("MongoDB")]

    Client --> API --> Intelligence
    API --> Database
    Intelligence --> Database
```

---

## 2. Autonomous Daily Planning & Circadian Execution Flowchart

```mermaid
flowchart LR
    User["User Data"]
    API["Planner API"]
    Engine["Auto-Planner Engine"]
    LLM["Groq LLM"]
    DB[("MongoDB")]
    Schedule["Daily Schedule"]

    User --> API
    API --> Engine
    Engine --> LLM
    LLM --> Engine
    Engine --> Schedule
    Schedule --> DB
```

---

## 3. Multi-Turn Dialogue & Dynamic Table Extraction Flowchart

```mermaid
flowchart LR
    User["User"]
    Chat["Chat UI"]
    API["Chat API"]
    Parser["Intent & Table Parser"]
    Action["Action Executor"]
    DB[("MongoDB")]

    User --> Chat
    Chat --> API
    API --> Parser
    Parser --> Action
    Action --> DB
    API --> Chat
```

### 3.1 Direct Natural-Language Chat Mutation Sequence

```mermaid
sequenceDiagram
    actor User
    participant UI as Chat UI
    participant API as Chat API
    participant Router as Router Agent
    participant Agent as Domain Agent
    participant DB as MongoDB

    User->>UI: Natural-language instruction
    UI->>API: Send message
    API->>Router: Route request
    Router->>Agent: Handle domain action
    Agent-->>Router: Structured action
    Router->>DB: Execute update
    DB-->>API: Updated state
    API-->>UI: Confirmation
    UI-->>User: Updated result
```

---

## 4. 3-Tier Autonomy Governance State Machine

```mermaid
stateDiagram-v2
    [*] --> Supervised
    [*] --> SemiAutonomous
    [*] --> FullAutonomous

    state Supervised {
        Proposal --> Approval
        Approval --> Executed
    }

    state SemiAutonomous {
        Routine --> DirectCommit
        MajorAction --> Approval
        Approval --> Executed
    }

    state FullAutonomous {
        AutoPlan --> DirectCommit
        DirectCommit --> Executed
    }
```

### Autonomy Model

```mermaid
flowchart LR
    S["Supervised<br/>User approval"]
    SA["Semi-Autonomous<br/>Routine actions"]
    FA["Full Autonomous<br/>Automatic execution"]

    S --- SA --- FA
```

---

## 5. MongoDB Document Models

```mermaid
classDiagram
    class UserDoc {
        ObjectId id
        String username
        String email
        String role
        Float monthly_income
        Float monthly_expenses
        Float net_worth
        String tasks_json
        String autonomy_mode
    }

    class ChatSessionDoc {
        ObjectId id
        String user_id
        String title
        List messages
    }

    class UserSuggestionDoc {
        ObjectId id
        String user_id
        String title
        String category
        String detail
        Boolean is_adopted
    }

    class HabitRecordDoc {
        ObjectId id
        String user_id
        String habit_name
        Int duration_minutes
        Int impact_score
    }

    class StudyRecordDoc {
        ObjectId id
        String user_id
        String subject
        Int duration_minutes
        Int focus_score
    }

    class FinancialRecordDoc {
        ObjectId id
        String user_id
        Float amount
        String category
    }

    ChatSessionDoc *-- ChatMessageDoc
    UserDoc <.. ChatSessionDoc
    UserDoc <.. UserSuggestionDoc
    UserDoc <.. HabitRecordDoc
    UserDoc <.. StudyRecordDoc
    UserDoc <.. FinancialRecordDoc
```

---

## 6. Local Disk Persistence Engine & State Rehydration

```mermaid
flowchart LR
    Operations["Mutating Operations"]
    Mongo["MongoDB / Mongomock"]
    Snapshot["Persistence Snapshot"]
    Temp[".json.tmp"]
    Final["mongodb_persistence.json"]

    Operations --> Mongo
    Mongo --> Snapshot
    Snapshot --> Temp
    Temp -->|Atomic Replace| Final
```

### Startup Recovery

```mermaid
flowchart LR
    Start["Application Startup"]
    Load["Load Snapshot"]
    Restore["Rehydrate Collections"]
    Ready["API Ready"]

    Start --> Load --> Restore --> Ready
```

---

## Architecture Flow Summary

```mermaid
flowchart LR
    Frontend["React Frontend"]
    Backend["FastAPI Backend"]
    Agents["AI Agents"]
    Simulation["Simulation Engine"]
    Database[("MongoDB")]

    Frontend --> Backend
    Backend --> Agents
    Backend --> Simulation
    Backend --> Database
    Agents --> Database
    Simulation --> Database
```

### Key Architectural Capabilities

1. **Tutorial Thread Auto-Seeding**: Every new profile receives the standard Tutorial thread.
2. **Deterministic Startup Rehydration**: Persistence snapshots are loaded before network requests are served.
3. **Lossless Conversation State**: Chat messages, action payloads, execution statuses, and planner history persist across sessions.


*Back to [README.md](../README.md)*
