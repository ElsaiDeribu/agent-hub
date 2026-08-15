"""Local / development settings."""

from pydantic_settings import SettingsConfigDict

from config.settings.base import Settings


class LocalSettings(Settings):
    model_config = SettingsConfigDict(
        extra="ignore",
        env_file_encoding="utf-8",
    )

    debug: bool = True
    db_echo: bool = False
    auth_cookie_secure: bool = False


settings = LocalSettings()  # type: ignore[call-arg]
