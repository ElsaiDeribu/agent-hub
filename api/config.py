"""App settings loaded from the environment / `.env` file."""

from __future__ import annotations

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Postgres ---
    postgres_host: str = "postgres"
    postgres_port: int = 5432
    postgres_db: str = "agenthub"
    postgres_user: str = "agenthub"
    # SecretStr only masks repr/logs; it is not encryption, and database_url still embeds the plaintext.
    postgres_password: SecretStr = SecretStr("agenthub")

    # --- Auth ---
    auth_base_url: str = "http://localhost:8000/api/auth"
    auth_frontend_callback: str = "http://localhost:3000"
    auth_session_expires_minutes: int = 60 * 24 * 7
    # False for local HTTP. Set AUTH_COOKIE_SECURE=true in production (HTTPS).
    auth_cookie_secure: bool = False 

    # --- Google OAuth ---
    google_client_id: str = ""
    google_client_secret: SecretStr = SecretStr("")
    google_authorization_url: str = "https://accounts.google.com/o/oauth2/v2/auth"
    google_token_url: str = "https://oauth2.googleapis.com/token"
    google_userinfo_url: str = "https://www.googleapis.com/oauth2/v2/userinfo"
    google_scopes: str = "openid email profile"

    # --- HTTP / CORS ---
    cors_origins: str = (
        "http://localhost:8081,http://127.0.0.1:8081,"
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:3000,http://127.0.0.1:3000"
    )
    host: str = "0.0.0.0"
    port: int = 8000

    # --- Sandbox / registry ---
    registry_dir: str = "/app/registry"
    msb_image: str = "node"
    session_idle_timeout: int = 1800
    session_max_duration: int = 3600
    session_base_port: int = 10000

    @property
    def database_url(self) -> str:
        password = self.postgres_password.get_secret_value()
        return (
            f"postgresql+psycopg://{self.postgres_user}:{password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def google_configured(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret.get_secret_value())


settings = Settings()  # type: ignore[call-arg]
