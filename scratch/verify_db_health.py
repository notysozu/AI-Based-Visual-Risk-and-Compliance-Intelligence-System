import os, sys
from database.database import SessionLocal
from database import crud

db = SessionLocal()
try:
    user = crud.get_user(db, 1)
    print("DB healthy, user 1:", user.username if user else "none")
finally:
    db.close()
