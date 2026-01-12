# Python Service

Python microservice template using FastAPI with LangChain/LangGraph support.

## Setup

```bash
# Install uv if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment and install dependencies
uv sync

# Run development server
uv run uvicorn app.main:app --reload --port 8000

# Run tests
uv run pytest

# Run linting
uv run ruff check .

# Run type checking
uv run mypy app/
```

## Structure

```
python-service/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI application
│   ├── config.py         # Configuration
│   ├── routes/           # API routes
│   └── services/         # Business logic
├── tests/
│   └── test_health.py
├── pyproject.toml
└── Dockerfile
```
