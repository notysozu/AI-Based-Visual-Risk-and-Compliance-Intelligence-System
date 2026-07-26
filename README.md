# Digital Twin AI – Personal Life Simulation & Decision Assistant

## AI Assistant Context (For Codex/Copilot)
**Project Goal:** Build an intelligent decision-support system that creates a "digital twin" of a user to forecast future outcomes of their choices (finances, habits, studies) using predictive analytics, ML, and LLMs.
**Architecture Style:** Decoupled microservices/monorepo. 
**Primary Languages:** Python, SQL.

## Tech Stack
*   **Frontend / Visualization:** Streamlit (Python), Plotly
*   **Backend / API Routing:** FastAPI (Python)
*   **Database:** PostgreSQL (Core storage for user profiles and historical activity)
*   **AI & Machine Learning:** Scikit-learn, Pandas, Large Language Models (Gemini/OpenAI)

## 📂 Proposed Directory Structure
```text
digital-twin-ai/
│
├── frontend/                 # Streamlit dashboard and UI components
│   ├── app.py                # Main Streamlit entry point
│   └── components/           # Reusable UI widgets and charts
│
├── backend/                  # FastAPI server and route handlers
│   ├── main.py               # FastAPI application instance
│   ├── api/                  # API endpoints (routes)
│   └── services/             # Business logic and external API calls
│
├── database/                 # PostgreSQL schemas, models, and migrations
│   ├── models.py             # SQLAlchemy ORM models (Users, Finances, Habits)
│   ├── schemas.py            # Pydantic models for data validation
│   └── crud.py               # Database transaction functions
│
├── ai_engine/                # Machine learning and simulation logic
│   ├── forecasting/          # Financial and study predictive models
│   ├── simulation/           # Multi-scenario "what-if" simulation logic
│   └── llm_integration/      # Conversational AI prompt handling
│
├── requirements.txt          # Python dependencies
└── .env.example              # Environment variables template