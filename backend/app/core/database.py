from sqlalchemy import create_engine, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False}  # SQLite only
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def migrate_schema():
    additions = {
        "users": {
            "university_id": "INTEGER REFERENCES universities(id)",
            "age": "INTEGER",
            "academic_year": "INTEGER",
        },
        "documents": {"university_id": "INTEGER REFERENCES universities(id)"},
        "notices": {"university_id": "INTEGER REFERENCES universities(id)"},
        "faqs": {"university_id": "INTEGER REFERENCES universities(id)"},
    }

    with engine.begin() as connection:
        schema = inspect(connection)
        for table, columns in additions.items():
            existing = {column["name"] for column in schema.get_columns(table)}
            for name, definition in columns.items():
                if name not in existing:
                    connection.exec_driver_sql(
                        f"ALTER TABLE {table} ADD COLUMN {name} {definition}"
                    )
        connection.exec_driver_sql(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_universities_name_ci "
            "ON universities (lower(name))"
        )
