from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    openai_api_key: str = ""
    groq_api_key: str = ""
    llm_provider: str = "openai"
    llm_model: str = "gpt-3.5-turbo"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 1440
    database_url: str = "sqlite:///./data/campusai.db"
    upload_dir: str = "./data/uploads"
    vector_store_dir: str = "./data/vector_store"
    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
