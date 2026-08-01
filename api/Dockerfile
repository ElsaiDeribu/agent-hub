# microsandbox boots real microVMs, so this must run on a glibc Linux base.
# The bundled msb binary requires glibc >= 2.38; Debian trixie ships 2.40.
# The container itself needs /dev/kvm at runtime -- see docker-compose.yml.
#
# Build from the repo root:
#   docker compose -f backend/docker-compose.yml up --build
FROM python:3.13-slim-trixie

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/app/.venv \
    PATH="/app/.venv/bin:$PATH" \
    REGISTRY_DIR=/app/registry

# uv provides fast, reproducible installs from the committed uv.lock.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Install dependencies first (cached) using only the lockfiles.
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# Application code + canonical root registry (agents live under registry/*/preview).
COPY backend/main.py backend/services.py backend/README.md ./
COPY registry/ ./registry/

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
