# Python service Dockerfile
FROM python:3.11-slim AS base

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY pyproject.toml uv.lock* ./
RUN uv sync --frozen --no-dev

# Development stage
FROM base AS development
COPY pyproject.toml uv.lock* ./
RUN uv sync --frozen
COPY . .
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production stage
FROM python:3.11-slim AS production
WORKDIR /app

# Create non-root user
RUN groupadd --system --gid 1001 python && \
    useradd --system --uid 1001 --gid python pythonuser

COPY --from=deps /app/.venv /app/.venv
COPY --chown=pythonuser:python app ./app

ENV PATH="/app/.venv/bin:$PATH"
USER pythonuser
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
