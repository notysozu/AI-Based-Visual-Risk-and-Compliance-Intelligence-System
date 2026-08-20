import os, sys
from database.database import SessionLocal
from database import crud

db = SessionLocal()
try:
    items = crud.get_user_suggestions(db, 1)
    print(f"Suggestions in DB for user 1: {len(items)}")
finally:
    db.close()
