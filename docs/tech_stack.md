# Tech Stack & Engineering Architecture — Visual Risk AI

Visual Risk AI is constructed with a modern, type-safe stack designed for sub-50ms rendering performance, mathematical rigor, and responsive reactivity.

---

## Technology Architecture & Layer Breakdown

```mermaid
flowchart TD
  subgraph ClientLayer["Frontend Client Layer (React 19 + TypeScript + Vite)"]
    direction TB
    F1["React 19 & Concurrent Hooks"]
    F2["TanStack Router (Type-Safe Client Routing)"]
    F3["Tailwind CSS & Radix UI (Headless Primitives)"]
    F4["Recharts & D3 (Monte Carlo Bands, Gauges & Overlays)"]
    F5["ReactMarkdown & Remark-GFM (Copilot Card Rendering)"]
    F6["Web Speech API (Native Voice Dictation)"]
  end

  subgraph GatewayLayer["Backend API Gateway (FastAPI + Uvicorn)"]
    direction TB
    B1["FastAPI 0.115 (Asynchronous ASGI Core)"]
    B2["Pydantic v2.10 (Strict DTO Schemas & Type Coercion)"]
    B3["Motor 3.3+ & Beanie ODM (Async MongoDB Abstraction)"]
  end

  subgraph EngineLayer["AI & Computational Math Engine"]
    direction TB
    E1["Groq API Client (GPT-OSS 120B/20B & Qwen 3.6 Reasoning)"]
    E2["NumPy & SciPy (500-Run Geometric Brownian Motion & Distributions)"]
    E3["Pandas (30-Day Telemetry Aggregations & Correlation Matrices)"]
  end

  subgraph StorageLayer["Database & Intelligence Persistence"]
    direction TB
    D1[("MongoDB Atlas Cluster / Local Engine")]
    D2["Collections: users, habit_records, study_records, financial_records, app_cache, chat_sessions"]
  end

  ClientLayer -->|REST JSON Payloads / API Calls| GatewayLayer
  GatewayLayer -->|Inference Prompts & Math Tasks| EngineLayer
  GatewayLayer -->|Async Document Read/Write| StorageLayer
```

---

## Frontend Package Directory
- `@radix-ui/react-dropdown-menu`: Header conversation switcher and options menus.
- `@radix-ui/react-slider`: Multi-parameter tradeoff sandboxing sliders.
- `@radix-ui/react-tabs`: Telemetry panel switching in Settings and Overview.
- `lucide-react`: Official icon set (including `GaugeCircle`, `TrendingUp`, `Bot`, `Activity`).
- `sonner`: Floating real-time notification toasts for database sync events.

---

## Backend Architectural Highlights
- **Stateless Async Services**: Request handlers run asynchronously over Uvicorn workers with non-blocking I/O.
- **Asynchronous Document Persistence**: Powered by Motor and Beanie ODM for scalable NoSQL storage across users, telemetry records, chat sessions, and AI suggestion states.
- **Dynamic Context Building**: The AI engine dynamically aggregates 30-day baseline statistics into concise telemetry bundles before prompting Groq.
- **Fail-Safe Mathematical Fallbacks**: In the event of network timeouts, mathematical simulations seamlessly fallback to deterministic compound and heuristic models.

---

*Back to [README.md](../README.md)*
