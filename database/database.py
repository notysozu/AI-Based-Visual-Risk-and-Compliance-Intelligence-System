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
    # SQLite engine configuration with thread check
engine = create_engine(DATABASE_URL, connect_args=connect_args)
    # Test connection
    with engine.connect() as conn:
        pass
except Exception as e:
    print(f"Database connection failed with URL: {DATABASE_URL}. Error: {e}")
    print("Falling back to SQLite...")
    DATABASE_URL = "sqlite:///./digital_twin.db"
    # SQLite engine configuration with thread check
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def run_migrations():
    """Safely adds missing columns to existing SQLite database tables."""
    if not DATABASE_URL.startswith("sqlite"):
        return
    with engine.connect() as conn:
        # Check users table
        try:
            res = conn.exec_driver_sql("PRAGMA table_info(users)")
            existing_user_cols = {row[1] for row in res.fetchall()}
            
            user_migrations = [
                ("monthly_expenses", "FLOAT DEFAULT 2900.0"),
                ("net_worth", "FLOAT DEFAULT 15000.0"),
                ("last_success_odds", "FLOAT"),
                ("last_wealth_prediction", "TEXT"),
                ("last_analytics_summary", "TEXT"),
                ("last_analytics_updated", "TEXT"),
                ("last_study_plan", "TEXT"),
                ("last_study_plan_updated", "TEXT"),
            ]
            for col_name, col_def in user_migrations:
                if col_name not in existing_user_cols:
                    conn.exec_driver_sql(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
                    conn.commit()
        except Exception as e:
            print(f"Error migrating users table: {e}")

        # Check study_records table
        try:
            res = conn.exec_driver_sql("PRAGMA table_info(study_records)")
            existing_study_cols = {row[1] for row in res.fetchall()}
            
            study_migrations = [
                ("notes", "TEXT"),
                ("session_type", "TEXT DEFAULT 'study'"),
            ]
            for col_name, col_def in study_migrations:
                if col_name not in existing_study_cols:
                    conn.exec_driver_sql(f"ALTER TABLE study_records ADD COLUMN {col_name} {col_def}")
                    conn.commit()
        except Exception as e:
            print(f"Error migrating study_records table: {e}")

run_migrations()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
