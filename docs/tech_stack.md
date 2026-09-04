# Tech Stack & Engineering Architecture — Visual Risk AI

Visual Risk AI is constructed with a modern, type-safe stack designed for sub-50ms rendering performance, mathematical rigor, and responsive reactivity.

---

## Technology Stack Breakdown

| Layer | Technologies | Version / Specifications | Role & Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | 19.0.0 | Component rendering, hooks, suspense, and concurrent mode |
| **Language & Tooling** | TypeScript & Vite | TypeScript 5.5, Vite 6.0 | End-to-end static type checking, instant HMR, and tree-shaken builds |
| **Routing & State** | TanStack Router | v1.95+ | Type-safe client-side routing, search parameter validation, and layouts |
| **Styling & Design System**| Tailwind CSS & Radix UI | Tailwind 3.4, Radix Primitives | Accessible headless UI components, animations, and dark/light modes |
| **Data Visualization** | Recharts & D3 | Recharts 2.15, D3 Scale/Shape | Stochastic Monte Carlo bands, correlation matrices, and gauges |
| **Markdown & Formatting** | ReactMarkdown & Remark-GFM | remark-gfm 4.0 | Seamless parsing of Copilot reasoning tables and markdown cards |
| **Voice Dictation** | Web Speech API | Browser Native | Real-time speech-to-text dictation in the Copilot Chat interface |
| **Backend API Engine** | FastAPI & Uvicorn | Python 3.10+, FastAPI 0.115, Uvicorn 0.34 | Asynchronous ASGI gateway, dependency injection, and REST endpoints |
| **Data Validation** | Pydantic | v2.10+ | Strict request/response DTO schemas and type coercion |
| **Database & ODM** | MongoDB, Motor & Beanie | MongoDB 7.0+, Motor 3.3+, Beanie 1.26+ | Asynchronous non-blocking document object mapper with fail-safe fallback |
| **Mathematical Simulation**| NumPy, SciPy & Pandas | NumPy 2.0, SciPy 1.14 | 500-run Geometric Brownian Motion, regressions, and correlation matrices |
| **AI Inference** | Groq API Client | Groq SDK Python | High-throughput LLM reasoning (`gpt-oss-120b`, `gpt-oss-20b`, `qwen3.6-27b`) |

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
