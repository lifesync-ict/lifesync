from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    app_name: str = "lifesync-backend"
    app_version: str = "0.1.0"
    api_prefix: str = "/api/v1"
    ai_provider: str = "deterministic"
    ai_api_key: SecretStr = SecretStr("")
    ai_model: str = ""
    ai_timeout_seconds: float = 20.0
    app_env: str = "development"
    cors_origins: str = (
        "http://localhost:5173,http://localhost:5174,"
        "http://127.0.0.1:5173,http://127.0.0.1:5174"
    )
    model_config = SettingsConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    @field_validator("ai_provider", mode="before")
    @classmethod
    def normalize_ai_provider(cls, value: object) -> str:
        return str(value).strip().casefold()

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def normalized_ai_provider(self) -> str:
        return self.ai_provider

    @property
    def ai_provider_configured(self) -> bool:
        if self.normalized_ai_provider == "deterministic":
            return True
        if self.normalized_ai_provider == "gemini":
            return bool(self.ai_api_key.get_secret_value().strip() and self.ai_model.strip())
        return False


@lru_cache
def get_settings() -> Settings:
    return Settings()
