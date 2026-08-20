from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, default="professional")
    
    # Profile details for forecasting
    age = Column(Integer, default=25)
    retirement_goal_age = Column(Integer, default=60)
    target_net_worth = Column(Float, default=1000000.0)
    monthly_income = Column(Float, default=5000.0)
    
    # Habit targets
    sleep_target_hours = Column(Float, default=8.0)
    study_target_hours_week = Column(Float, default=15.0)

    # Decision Sandbox scenario slider presets (JSON: {"savings": 0, "sleep": 0, "study": 0})
    scenario_a_preset = Column(String, nullable=True)
    scenario_b_preset = Column(String, nullable=True)
    
    # Financial profile settings sync
    monthly_expenses = Column(Float, default=2900.0)
    net_worth = Column(Float, default=15000.0)

    # AI prediction cache
    last_success_odds = Column(Float, nullable=True)
    last_wealth_prediction = Column(String, nullable=True)
    last_analytics_summary = Column(String, nullable=True)
    last_analytics_updated = Column(String, nullable=True)
    last_study_plan = Column(String, nullable=True)
    last_study_plan_updated = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    financial_records = relationship("FinancialRecord", back_populates="user", cascade="all, delete-orphan")
    habit_records = relationship("HabitRecord", back_populates="user", cascade="all, delete-orphan")
    study_records = relationship("StudyRecord", back_populates="user", cascade="all, delete-orphan")
    suggestions = relationship("UserSuggestion", back_populates="user", cascade="all, delete-orphan")

class FinancialRecord(Base):
    __tablename__ = "financial_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String, index=True, nullable=False)  # Income, Investment, Fixed Expense, Discretionary Expense
    description = Column(String, nullable=True)
    amount = Column(Float, nullable=False)
    record_date = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="financial_records")

class HabitRecord(Base):
    __tablename__ = "habit_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    habit_name = Column(String, nullable=False)  # Sleep, Exercise, Screen Time, Diet, Socializing
    duration_minutes = Column(Integer, default=0)
    impact_score = Column(Integer, default=5)  # Subjective rating 1-10 of how they feel
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="habit_records")

class StudyRecord(Base):
    __tablename__ = "study_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    subject = Column(String, nullable=False, index=True)
    duration_minutes = Column(Integer, default=0)
    focus_score = Column(Integer, default=7)  # 1-10 focus level
    exam_score = Column(Float, nullable=True)  # Optional exam score result (0-100)
    notes = Column(String, nullable=True)
    session_type = Column(String, default="study")  # study, revision, exam, deep_work
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="study_records")


class UserSuggestion(Base):
    __tablename__ = "user_suggestions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    suggestion_id = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    category = Column(String, default="Focus")  # Focus, Vitality, Finance, Study, Leisure, Habits
    detail = Column(String, nullable=False)
    impact = Column(String, default="+1.0 focus")
    start_time = Column(String, default="09:00")
    duration_minutes = Column(Integer, default=30)
    is_adopted = Column(Integer, default=0)  # 0: false, 1: true (compatible with all SQLite/PostgreSQL setups)
    is_ai_generated = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="suggestions")
