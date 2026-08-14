"""App settings loaded from the environment / `.env` file."""

from __future__ import annotations

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = ""
    auth_database_url: str = ""

    auth_secret: SecretStr = SecretStr("dev-secret-change-me")
    auth_base_url: str = "http://localhost:8000/api/auth"
    auth_frontend_callback: str = "http://localhost:3000"
    auth_session_expires_minutes: int = 60 * 24 * 7
    auth_cookie_secure: bool = False

    google_client_id: str = ""
    google_client_secret: SecretStr = SecretStr("")
    google_authorization_url: str = "https://accounts.google.com/o/oauth2/v2/auth"
    google_token_url: str = "https://oauth2.googleapis.com/token"
    google_userinfo_url: str = "https://www.googleapis.com/oauth2/v2/userinfo"
    google_scopes: str = "openid email profile"

    cors_origins: str = (
        "http://localhost:8081,http://127.0.0.1:8081,"
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:3000,http://127.0.0.1:3000"
    )

    host: str = "0.0.0.0"
    port: int = 8000

    @model_validator(mode="after")
    def resolve_database_url(self) -> Settings:
        url = self.database_url or self.auth_database_url
        if not url:
            raise ValueError(
                "DATABASE_URL is required. Example: "
                "postgresql+psycopg://agenthub:agenthub@localhost:5432/agenthub"
            )
        object.__setattr__(self, "database_url", url)
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def google_configured(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret.get_secret_value())


settings = Settings()  # type: ignore[call-arg]
