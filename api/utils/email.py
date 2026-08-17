"""Transactional email via SMTP."""

from __future__ import annotations

import logging
from email.message import EmailMessage

import aiosmtplib
from config import settings

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, body: str, html_content: str | None = None) -> None:
    """Send a minimal welcome email. Errors are logged."""

    message = EmailMessage()
    message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_address.strip()}>"
    message["To"] = to
    message["Subject"] = subject
    
    message.set_content(body)
    if html_content:
        message.add_alternative(html_content, subtype="html")

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_username.get_secret_value() or None,
            password=settings.smtp_password.get_secret_value() or None,
            start_tls=settings.smtp_use_tls,
        )
    except Exception:
        logger.exception("Failed to send welcome email to %r", to)
