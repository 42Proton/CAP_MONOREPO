#!/usr/bin/env bash
set -euo pipefail

# ─── Create a new Python microservice (FastAPI + LangChain) ───
# Usage: ./scripts/create-python-service.sh <service-name>
# Example: ./scripts/create-python-service.sh analysis-service

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVICE_NAME="${1:-}"

if [ -z "$SERVICE_NAME" ]; then
  echo "Usage: $0 <service-name>"
  echo "Example: $0 analysis-service"
  exit 1
fi

SERVICE_DIR="$REPO_ROOT/apps/$SERVICE_NAME"

if [ -d "$SERVICE_DIR" ]; then
  echo "Error: Directory apps/$SERVICE_NAME already exists."
  exit 1
fi

# Convert kebab-case to snake_case for Python module name
MODULE_NAME="${SERVICE_NAME//-/_}"

# Prompt for port
read -rp "Port number (default 8001): " PORT
PORT="${PORT:-8001}"

echo "Creating Python service: $SERVICE_NAME (port $PORT)"
echo "───────────────────────────────────────────────────"

# Create directory structure
mkdir -p "$SERVICE_DIR/app/routes"
mkdir -p "$SERVICE_DIR/app/services"
mkdir -p "$SERVICE_DIR/tests"

# ─── pyproject.toml ───
cat > "$SERVICE_DIR/pyproject.toml" <<EOF
[project]
name = "$SERVICE_NAME"
version = "0.1.0"
description = "Python microservice with LangChain/LangGraph"
readme = "README.md"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.110.0",
    "uvicorn[standard]>=0.28.0",
    "langchain>=0.1.0",
    "langchain-openai>=0.1.0",
    "langgraph>=0.0.28",
    "psycopg2-binary>=2.9.9",
    "sqlalchemy>=2.0.0",
    "python-dotenv>=1.0.0",
    "pydantic>=2.6.0",
    "pydantic-settings>=2.2.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "pytest-cov>=4.1.0",
    "httpx>=0.27.0",
    "ruff>=0.3.0",
    "mypy>=1.8.0",
]

[tool.uv]
dev-dependencies = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "pytest-cov>=4.1.0",
    "httpx>=0.27.0",
    "ruff>=0.3.0",
    "mypy>=1.8.0",
]

[tool.ruff]
target-version = "py311"
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "B", "Q"]
ignore = ["E501"]

[tool.ruff.lint.isort]
known-first-party = ["app"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]

[tool.mypy]
python_version = "3.11"
strict = true
ignore_missing_imports = true
EOF

# ─── Dockerfile ───
cat > "$SERVICE_DIR/Dockerfile" <<EOF
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
EXPOSE $PORT
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$PORT", "--reload"]

# Production stage
FROM python:3.11-slim AS production
WORKDIR /app

# Create non-root user
RUN groupadd --system --gid 1001 python && \\
    useradd --system --uid 1001 --gid python pythonuser

COPY --from=deps /app/.venv /app/.venv
COPY --chown=pythonuser:python app ./app

ENV PATH="/app/.venv/bin:\$PATH"
USER pythonuser
EXPOSE $PORT
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$PORT"]
EOF

# ─── app/__init__.py ───
cat > "$SERVICE_DIR/app/__init__.py" <<EOF
"""$SERVICE_NAME microservice package."""
EOF

# ─── app/main.py ───
cat > "$SERVICE_DIR/app/main.py" <<EOF
"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import health

app = FastAPI(
    title="$SERVICE_NAME",
    description="Python microservice with LangChain/LangGraph",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["Health"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "$SERVICE_NAME",
        "version": "0.1.0",
        "environment": settings.environment,
    }
EOF

# ─── app/config.py ───
cat > "$SERVICE_DIR/app/config.py" <<EOF
"""Application configuration."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    environment: str = "development"
    debug: bool = True

    # Database
    database_url: str = "postgresql://postgres:password@localhost:5432/mono_db"

    # LangChain
    openai_api_key: str | None = None
    langchain_api_key: str | None = None
    langchain_tracing_v2: bool = False
    langchain_project: str = "mono"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
EOF

# ─── app/routes/__init__.py ───
cat > "$SERVICE_DIR/app/routes/__init__.py" <<'EOF'
"""Routes package."""
EOF

# ─── app/routes/health.py ───
cat > "$SERVICE_DIR/app/routes/health.py" <<EOF
"""Health check routes."""

from datetime import datetime

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def health_check():
    """Basic health check endpoint."""
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "$SERVICE_NAME",
        },
    }


@router.get("/ready")
async def readiness_check():
    """Readiness check endpoint."""
    # Add database connectivity check here
    return {
        "success": True,
        "data": {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat(),
        },
    }
EOF

# ─── app/services/__init__.py ───
cat > "$SERVICE_DIR/app/services/__init__.py" <<'EOF'
"""Services package."""
EOF

# ─── tests/__init__.py ───
cat > "$SERVICE_DIR/tests/__init__.py" <<'EOF'
"""Tests package."""
EOF

# ─── tests/test_health.py ───
cat > "$SERVICE_DIR/tests/test_health.py" <<EOF
"""Tests for health endpoints."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    """Create async test client."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test health check endpoint."""
    response = await client.get("/health/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "healthy"
    assert data["data"]["service"] == "$SERVICE_NAME"


@pytest.mark.asyncio
async def test_readiness_check(client: AsyncClient):
    """Test readiness check endpoint."""
    response = await client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "ready"


@pytest.mark.asyncio
async def test_root(client: AsyncClient):
    """Test root endpoint."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "$SERVICE_NAME"
EOF

echo ""
echo "Python service '$SERVICE_NAME' created at apps/$SERVICE_NAME/"
echo ""
echo "Next steps:"
echo "  1. cd apps/$SERVICE_NAME"
echo "  2. uv sync        # Install dependencies"
echo "  3. uv run uvicorn app.main:app --reload --port $PORT"
echo ""
