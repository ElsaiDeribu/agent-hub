"""Transactional email via SMTP."""

from __future__ import annotations

import logging
from email import encoders
from email.message import EmailMessage
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
from config import settings

logger = logging.getLogger(__name__)


def _build_message(
    *,
    to: str,
    subject: str,
    body: str,
    html_content: str | None,
    inline_images: dict[str, tuple[bytes, str]] | None,
) -> EmailMessage | MIMEMultipart:
    from_address = f"{settings.smtp_from_name} <{settings.smtp_from_address.strip()}>"

    if not inline_images:
        message = EmailMessage()
        message["From"] = from_address
        message["To"] = to
        message["Subject"] = subject
        message.set_content(body)
        if html_content:
            message.add_alternative(html_content, subtype="html")
        return message

    message = MIMEMultipart("mixed")
    message["From"] = from_address
    message["To"] = to
    message["Subject"] = subject

    related = MIMEMultipart("related")
    alternative = MIMEMultipart("alternative")
    alternative.attach(MIMEText(body, "plain", "utf-8"))
    if html_content:
        alternative.attach(MIMEText(html_content, "html", "utf-8"))
    related.attach(alternative)

    for content_id, (data, mime_type) in inline_images.items():
        maintype, subtype = mime_type.split("/", 1)
        part = MIMEBase(maintype, subtype)
        part.set_payload(data)
        encoders.encode_base64(part)
        part.add_header("Content-ID", f"<{content_id}>")
        part.add_header(
            "Content-Disposition",
            "inline",
            filename=f"{content_id}.{subtype.split('+')[0]}",
        )
        related.attach(part)

    message.attach(related)
    return message


async def send_email(
    to: str,
    subject: str,
    body: str,
    html_content: str | None = None,
    inline_images: dict[str, tuple[bytes, str]] | None = None,
) -> None:
    """Send a transactional email. Errors are logged."""

    message = _build_message(
        to=to,
        subject=subject,
        body=body,
        html_content=html_content,
        inline_images=inline_images,
    )

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
        logger.exception("Failed to send email to %r", to)
