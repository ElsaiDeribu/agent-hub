"""Render transactional email content from template files."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from html import escape
from pathlib import Path

from config import settings

_TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"
_ASSETS_DIR = _TEMPLATES_DIR / "assets"
_LOGO_CID = "agenthub-logo"
_LOGO_FILENAME = "agent-hub-logo-full-dark.svg"


_COLORS = {
    "background": "#ffffff",
    "foreground": "#252525",
    "muted": "#737373",
    "primary": "#333333",
    "primary_foreground": "#fafafa",
    "border": "#ebebeb",
    "card": "#ffffff",
}
_FONT_STACK = (
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
)


@dataclass(frozen=True)
class RenderedEmail:
    body: str
    html: str
    inline_images: dict[str, tuple[bytes, str]]


@lru_cache(maxsize=1)
def _logo_bytes() -> bytes:
    return (_ASSETS_DIR / _LOGO_FILENAME).read_bytes()


@lru_cache(maxsize=8)
def _load_template(name: str) -> str:
    return (_TEMPLATES_DIR / name).read_text(encoding="utf-8")


def render_verification_email(*, verify_url: str, ttl_minutes: int) -> RenderedEmail:
    """Build branded verification email content with an embedded logo."""
    safe_url = escape(verify_url, quote=True)
    app_name = escape(settings.smtp_from_name or "AgentHub")
    product_name = settings.smtp_from_name or "AgentHub"

    html = _load_template("verification_email.html").format(
        app_name=app_name,
        safe_url=safe_url,
        ttl_minutes=ttl_minutes,
        logo_cid=_LOGO_CID,
        font_stack=_FONT_STACK,
        color_background=_COLORS["background"],
        color_foreground=_COLORS["foreground"],
        color_muted=_COLORS["muted"],
        color_primary=_COLORS["primary"],
        color_primary_foreground=_COLORS["primary_foreground"],
        color_border=_COLORS["border"],
        color_card=_COLORS["card"],
    )
    body = (
        f"Verify your {product_name} email\n\n"
        "To complete your account setup, please click the verification link below:\n\n"
        f"{verify_url}\n\n"
        f"This link expires in {ttl_minutes} minutes. "
        "If you did not create an account, you can ignore this email."
    )

    return RenderedEmail(
        body=body,
        html=html,
        inline_images={_LOGO_CID: (_logo_bytes(), "image/svg+xml")},
    )
