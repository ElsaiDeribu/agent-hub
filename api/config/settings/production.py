"""Production settings. Secrets come from the environment — no insecure defaults."""

from pydantic_settings import SettingsConfigDict

from config.settings.base import Settings


class ProductionSettings(Settings):
    model_config = SettingsConfigDict(
        extra="ignore",
        env_file_encoding="utf-8",
    )

    debug: bool = False
    db_echo: bool = False
    auth_cookie_secure: bool = True

    cors_origins: str
    auth_base_url: str
    auth_frontend_callback: str


settings = ProductionSettings()  # type: ignore[call-arg]
