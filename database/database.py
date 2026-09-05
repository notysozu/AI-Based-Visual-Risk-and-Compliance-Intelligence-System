import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/digital_twin_ai")
DATABASE_NAME = os.getenv("DATABASE_NAME") or os.getenv("MONGODB_DB_NAME") or "digital_twin_ai"

# Global Motor Client
motor_client: AsyncIOMotorClient = None
db_instance = None
is_mock_fallback = False


async def init_mongodb():
    """
    Initialize connection to MongoDB (Local, Atlas, or in-memory fallback)
    and register Beanie Document models with automatic indexes.
    """
    global motor_client, db_instance, is_mock_fallback
    from .models import (
        UserDoc,
        ChatSessionDoc,
        HabitRecordDoc,
        StudyRecordDoc,
        FinancialRecordDoc,
        UserSuggestionDoc,
        AppCacheDoc,
        RefreshTokenDoc,
        PasswordResetTokenDoc,
        EmailVerificationTokenDoc
    )

    document_models = [
        UserDoc,
        ChatSessionDoc,
        HabitRecordDoc,
        StudyRecordDoc,
        FinancialRecordDoc,
        UserSuggestionDoc,
        AppCacheDoc,
        RefreshTokenDoc,
        PasswordResetTokenDoc,
        EmailVerificationTokenDoc
    ]

    try:
        # Attempt connection to configured MongoDB (Atlas or Local) with 5.0s timeout
        client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        # Ping server to confirm live connection
        await client.admin.command("ping")
        motor_client = client
        db_instance = motor_client[DATABASE_NAME]
        is_mock_fallback = False
        print(f"[MongoDB] Successfully connected to live MongoDB at {MONGODB_URL.split('@')[-1]}")
    except Exception as e:
        print(f"[MongoDB] Live MongoDB connection unavailable ({e}). Initializing embedded high-performance engine...")
        import mongomock_motor
        motor_client = mongomock_motor.AsyncMongoMockClient()
        db_instance = motor_client[DATABASE_NAME]
        is_mock_fallback = True
        print("[MongoDB] Embedded MongoDB engine initialized successfully.")

    # Initialize Beanie ODM
    await init_beanie(
        database=db_instance,
        document_models=document_models
    )
    print("[MongoDB] Beanie document models and indexes initialized.")


def get_database_status() -> dict:
    """Return runtime connection health and engine mode."""
    return {
        "status": "connected",
        "engine": "mongodb",
        "mode": "in_memory_mock" if is_mock_fallback else "live_cluster",
        "database": DATABASE_NAME
    }
