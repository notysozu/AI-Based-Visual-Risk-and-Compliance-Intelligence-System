import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Provide an absolute fallback for SQLite to be created in the project root
if not DATABASE_URL or DATABASE_URL.startswith("postgresql://user:password"):
    # Default to sqlite relative to project directory
    DATABASE_URL = "sqlite:///./digital_twin.db"

# Handle SQLAlchemy dialect differences for SQLite (specifically connect_args)
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
    # Test connection
    with engine.connect() as conn:
        pass
except Exception as e:
    print(f"Database connection failed with URL: {DATABASE_URL}. Error: {e}")
    print("Falling back to SQLite...")
    DATABASE_URL = "sqlite:///./digital_twin.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
