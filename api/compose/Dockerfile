# microsandbox boots real microVMs, so this must run on a glibc Linux base.
# The bundled msb binary requires glibc >= 2.38; Debian trixie ships 2.40.
# The container itself needs /dev/kvm at runtime -- see docker-compose.yml.
#
# Build from api/ (compose also injects the repo-root registry/ context):
#   docker compose -f api/docker-compose.yml up --build
FROM python:3.13-slim-trixie

ARG APP_HOME=/app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/app/.venv \
    PATH="/app/.venv/bin:$PATH" \
    REGISTRY_DIR=/app/registry

# uv provides fast, reproducible installs from the committed uv.lock.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR ${APP_HOME}

# wait-for-it is used by /entrypoint to block until Postgres is accepting connections.
RUN apt-get update && apt-get install --no-install-recommends -y \
  wait-for-it \
  && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies first (cached) using only the lockfiles.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

COPY compose/entrypoint /entrypoint
RUN sed -i 's/\r$//g' /entrypoint
RUN chmod +x /entrypoint

# Application code + canonical root registry (agents live under registry/*/preview).
COPY . ./
COPY --from=registry . ./registry/

RUN sed -i 's/\r$//g' compose/start && chmod +x compose/start

EXPOSE 8000

ENTRYPOINT ["/entrypoint"]
