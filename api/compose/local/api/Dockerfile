# microsandbox boots real microVMs, so this must run on a glibc Linux base.
# The bundled msb binary requires glibc >= 2.38; Debian trixie ships 2.40.
# The container itself needs /dev/kvm at runtime -- see docker-compose.local.yml.
#
# Build from api/ (compose also injects the repo-root registry/ context):
#   docker compose -f docker-compose.local.yml up --build
FROM python:3.13-slim-trixie

ARG APP_HOME=/app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/app/.venv \
    PATH="/app/.venv/bin:$PATH" \
    SETTINGS_MODULE=config.settings.local \
    REGISTRY_DIR=/app/registry

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR ${APP_HOME}

RUN apt-get update && apt-get install --no-install-recommends -y \
  wait-for-it \
  && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
  && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --group local

COPY ./compose/local/api/entrypoint /entrypoint
RUN sed -i 's/\r$//g' /entrypoint
RUN chmod +x /entrypoint

COPY ./compose/local/api/start /start
RUN sed -i 's/\r$//g' /start
RUN chmod +x /start

COPY . ${APP_HOME}
COPY --from=registry . ${APP_HOME}/registry/

EXPOSE 8000

ENTRYPOINT ["/entrypoint"]
