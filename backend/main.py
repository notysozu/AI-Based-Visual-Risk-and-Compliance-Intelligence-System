from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.database import init_mongodb, get_database_status
from backend.api import auth, users, records, simulations, finance, habits, study, suggestions, chat, cache


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Async lifespan manager for MongoDB database initialization and startup seeding."""
    print("[FastAPI] Starting up Visual Risk AI backend...")
    await init_mongodb()
    try:
        await users.get_default_user()
        print("[FastAPI] Default persona seeded successfully.")
    except Exception as e:
        print(f"[FastAPI] Default persona startup seeding notice: {e}")
    yield
    print("[FastAPI] Shutting down Visual Risk AI backend...")


app = FastAPI(
    title="AI-Based Visual Risk and Compliance Intelligence System (Visual Risk AI)",
    description="Backend services for Visual Risk AI powered by MongoDB and Motor.",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(records.router)
app.include_router(simulations.router)
app.include_router(finance.router)
app.include_router(habits.router)
app.include_router(study.router)
app.include_router(suggestions.router)
app.include_router(chat.router)
app.include_router(cache.router)


@app.get("/")
async def read_root():
    return {
        "message": "Visual Risk AI API is running on MongoDB",
        "status": "online",
        "database": get_database_status()
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": get_database_status()
    }


@app.get("/api/v1/health")
async def health_check_v1():
    return {
        "status": "healthy",
        "database": get_database_status()
    }


@app.get("/api/health")
async def health_check_alias():
    return {
        "status": "healthy",
        "database": get_database_status()
    }
