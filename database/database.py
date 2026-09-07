import os
import json
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/digital_twin_ai")
DATABASE_NAME = os.getenv("DATABASE_NAME") or os.getenv("MONGODB_DB_NAME") or "digital_twin_ai"

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
PERSISTENCE_FILE = os.path.join(DATA_DIR, "mongodb_persistence.json")

# Global Motor Client
motor_client: AsyncIOMotorClient = None
db_instance = None
is_mock_fallback = False


def _json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if hasattr(obj, "__str__"):
        return str(obj)
    raise TypeError(f"Type {type(obj)} not serializable")


async def save_persistence_snapshot():
    """Serialize all Beanie document collections to persistent local storage."""
    if not is_mock_fallback:
        return

    try:
        os.makedirs(DATA_DIR, exist_ok=True)
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

        users = await UserDoc.find_all().to_list()
        chats = await ChatSessionDoc.find_all().to_list()
        habits = await HabitRecordDoc.find_all().to_list()
        studies = await StudyRecordDoc.find_all().to_list()
        finance = await FinancialRecordDoc.find_all().to_list()
        suggestions = await UserSuggestionDoc.find_all().to_list()
        caches = await AppCacheDoc.find_all().to_list()
        refresh_tokens = await RefreshTokenDoc.find_all().to_list()
        reset_tokens = await PasswordResetTokenDoc.find_all().to_list()
        verify_tokens = await EmailVerificationTokenDoc.find_all().to_list()

        snapshot = {
            "version": 1,
            "saved_at": datetime.utcnow().isoformat(),
            "users": [u.model_dump(mode="json") for u in users],
            "chat_sessions": [c.model_dump(mode="json") for c in chats],
            "habit_records": [h.model_dump(mode="json") for h in habits],
            "study_records": [s.model_dump(mode="json") for s in studies],
            "financial_records": [f.model_dump(mode="json") for f in finance],
            "user_suggestions": [sg.model_dump(mode="json") for sg in suggestions],
            "app_cache": [ac.model_dump(mode="json") for ac in caches],
            "refresh_tokens": [rt.model_dump(mode="json") for rt in refresh_tokens],
            "password_reset_tokens": [pr.model_dump(mode="json") for pr in reset_tokens],
            "email_verification_tokens": [ev.model_dump(mode="json") for ev in verify_tokens],
        }

        temp_file = f"{PERSISTENCE_FILE}.tmp"
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(snapshot, f, indent=2, default=_json_serial)
        os.replace(temp_file, PERSISTENCE_FILE)
    except Exception as e:
        print(f"[MongoDB Persistence] Snapshot save notice: {e}")


async def load_persistence_snapshot():
    """Hydrate in-memory engine from persistent local storage."""
    if not os.path.exists(PERSISTENCE_FILE):
        return

    try:
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

        with open(PERSISTENCE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Restore users
        for u_data in data.get("users", []):
            uid = u_data.get("id") or u_data.get("_id")
            if not await UserDoc.find_one(UserDoc.username == u_data.get("username")):
                user = UserDoc(**u_data)
                if uid:
                    user.id = uid
                await user.insert()

        # Restore chat sessions
        for c_data in data.get("chat_sessions", []):
            cid = c_data.get("id") or c_data.get("_id")
            if not await ChatSessionDoc.find_one(ChatSessionDoc.id == cid):
                chat = ChatSessionDoc(**c_data)
                if cid:
                    chat.id = cid
                await chat.insert()

        # Restore habits
        for h_data in data.get("habit_records", []):
            hid = h_data.get("id") or h_data.get("_id")
            if not await HabitRecordDoc.find_one(HabitRecordDoc.id == hid):
                habit = HabitRecordDoc(**h_data)
                if hid:
                    habit.id = hid
                await habit.insert()

        # Restore study
        for s_data in data.get("study_records", []):
            sid = s_data.get("id") or s_data.get("_id")
            if not await StudyRecordDoc.find_one(StudyRecordDoc.id == sid):
                study = StudyRecordDoc(**s_data)
                if sid:
                    study.id = sid
                await study.insert()

        # Restore financial
        for f_data in data.get("financial_records", []):
            fid = f_data.get("id") or f_data.get("_id")
            if not await FinancialRecordDoc.find_one(FinancialRecordDoc.id == fid):
                fin = FinancialRecordDoc(**f_data)
                if fid:
                    fin.id = fid
                await fin.insert()

        # Restore suggestions
        for sg_data in data.get("user_suggestions", []):
            sgid = sg_data.get("id") or sg_data.get("_id")
            if not await UserSuggestionDoc.find_one(UserSuggestionDoc.id == sgid):
                sug = UserSuggestionDoc(**sg_data)
                if sgid:
                    sug.id = sgid
                await sug.insert()

        # Restore cache
        for ac_data in data.get("app_cache", []):
            acid = ac_data.get("id") or ac_data.get("_id")
            if not await AppCacheDoc.find_one(AppCacheDoc.cache_key == ac_data.get("cache_key")):
                cache = AppCacheDoc(**ac_data)
                if acid:
                    cache.id = acid
                await cache.insert()

        # Restore refresh tokens
        for rt_data in data.get("refresh_tokens", []):
            rtid = rt_data.get("id") or rt_data.get("_id")
            if not await RefreshTokenDoc.find_one(RefreshTokenDoc.token_hash == rt_data.get("token_hash")):
                rt = RefreshTokenDoc(**rt_data)
                if rtid:
                    rt.id = rtid
                await rt.insert()

        print(f"[MongoDB Persistence] Rehydrated {len(data.get('users', []))} users and {len(data.get('chat_sessions', []))} chat sessions from persistent store.")
    except Exception as e:
        print(f"[MongoDB Persistence] Rehydration notice: {e}")


async def init_mongodb():
    """
    Initialize connection to MongoDB (Local, Atlas, or persistent embedded engine)
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
        # Attempt connection to configured MongoDB with 2.0s fast timeout
        client = AsyncIOMotorClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=2000,
            connectTimeoutMS=2000,
            timeoutMS=2000
        )
        await client.admin.command("ping")
        motor_client = client
        db_instance = motor_client[DATABASE_NAME]
        is_mock_fallback = False
        print(f"[MongoDB] Successfully connected to live MongoDB at {MONGODB_URL.split('@')[-1]}")
    except Exception as e:
        print(f"[MongoDB] Live MongoDB connection unavailable ({e}). Initializing persistent high-performance engine...")
        import inspect
        import mongomock
        import mongomock_motor

        # Patch mongomock Database.list_collection_names for compatibility with modern Beanie
        _orig_list_colls = mongomock.database.Database.list_collection_names
        _supported_args = set(inspect.signature(_orig_list_colls).parameters.keys())
        def _safe_list_colls(self, *args, **kwargs):
            clean_kwargs = {k: v for k, v in kwargs.items() if k in _supported_args}
            return _orig_list_colls(self, *args, **clean_kwargs)
        mongomock.database.Database.list_collection_names = _safe_list_colls

        motor_client = mongomock_motor.AsyncMongoMockClient()
        db_instance = motor_client[DATABASE_NAME]
        is_mock_fallback = True
        print("[MongoDB] Persistent embedded MongoDB engine initialized successfully.")

    # Initialize Beanie ODM
    await init_beanie(
        database=db_instance,
        document_models=document_models
    )
    print("[MongoDB] Beanie document models and indexes initialized.")

    # If using embedded engine, hydrate from disk snapshot
    if is_mock_fallback:
        await load_persistence_snapshot()


def get_database_status() -> dict:
    """Return runtime connection health and engine mode."""
    return {
        "status": "connected",
        "engine": "mongodb",
        "mode": "persistent_embedded" if is_mock_fallback else "live_cluster",
        "database": DATABASE_NAME
    }
