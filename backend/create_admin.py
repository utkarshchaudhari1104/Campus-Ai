"""Interactively create the initial global administrator account."""
from getpass import getpass

from sqlalchemy import func

import app.models
from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.user import User


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).filter(User.role == "admin").first():
            raise SystemExit("A global admin already exists; no account was created.")

        name = input("Admin name: ").strip()
        email = input("Admin email: ").strip().lower()
        if not name or "@" not in email:
            raise SystemExit("Enter a name and a valid email address.")
        if db.query(User).filter(func.lower(User.email) == email).first():
            raise SystemExit("That email is already registered.")

        password = getpass("Admin password (minimum 8 characters): ")
        if len(password) < 8:
            raise SystemExit("Password must be at least 8 characters.")
        if password != getpass("Confirm admin password: "):
            raise SystemExit("Passwords did not match; no account was created.")

        db.add(User(name=name, email=email, password_hash=hash_password(password), role="admin"))
        db.commit()
        print(f"Global admin account created for {email}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()