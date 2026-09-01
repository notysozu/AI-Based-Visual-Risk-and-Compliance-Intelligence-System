# Running the Application — Visual Risk AI

This guide explains how to start the backend API server, launch the frontend client, and access the application.

---

## 1. Start the Backend API (FastAPI)

Open a terminal window and run:

```bash
# Activate your virtual environment
source .venv/bin/activate

# Launch FastAPI on port 8000 (or 8001) with hot-reloading
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### Backend Endpoints:
- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Documentation**: `http://127.0.0.1:8000/docs`
- **ReDoc API Documentation**: `http://127.0.0.1:8000/redoc`
- **Server Health Check**: `http://127.0.0.1:8000/health`

---

## 2. Start the Frontend Client (React 19 + Vite)

Open a second terminal window and run:

```bash
cd frontend
npm run dev
```

### Frontend Application Access:
- **Application URL**: `http://localhost:8080` (or `http://localhost:5173`)
- **Key Client Routes**:
  - `/` — Landing Experience
  - `/login` — Unified Authentication (Email or Username)
  - `/signup` — Registration & Setup
  - `/dashboard` — Unified Telemetry Overview
  - `/chat` — Fullscreen Visual Risk Copilot
  - `/simulator` — Decision Sandbox & What-If Comparison
  - `/wealth` — 500-Run Stochastic Monte Carlo Wealth Planner
  - `/analytics` — Universal Habit Correlation Analytics
  - `/planner` — Daily Task Sprints & Suggestion Adoption
  - `/settings` — Multi-Panel Telemetry Control Center

---

## 3. Production Build & Deployment

### Build Frontend
```bash
cd frontend
npm run build
```

### Preview Pre-built Frontend
```bash
cd frontend
npm run preview
```

---

*Back to [README.md](../README.md)*
