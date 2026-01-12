"""Application configuration."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    environment: str = "development"
    debug: bool = True

    # Database
    database_url: str = "postgresql://postgres:password@localhost:5432/mono_db"

    # LangChain
    openai_api_key: str | None = None
    langchain_api_key: str | None = None
    langchain_tracing_v2: bool = False
    langchain_project: str = "mono"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
