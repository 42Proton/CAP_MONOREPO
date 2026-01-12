# Mono - Monorepo

A Turborepo-based monorepo for TypeScript (Express) and Python microservices with LangChain/LangGraph support.

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **TypeScript Services**: Express.js
- **Python Services**: FastAPI + uv
- **Database**: PostgreSQL + Drizzle ORM
- **AI/ML**: LangChain, LangGraph, OpenAI
- **Testing**: Jest (TypeScript), pytest (Python)
- **Containerization**: Docker + Docker Compose

## Project Structure

```
mono/
├── apps/
│   ├── api-gateway/          # TypeScript Express service
│   └── python-service/       # Python FastAPI service
├── packages/
│   ├── db/                   # Drizzle ORM shared package
│   ├── eslint-config/        # Shared ESLint configuration
│   ├── shared/               # Shared utilities & types
│   └── typescript-config/    # Shared TypeScript configuration
├── docker/
│   ├── docker-compose.dev.yml
│   ├── docker-compose.staging.yml
│   └── docker-compose.prod.yml
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.1.0
- Python >= 3.11
- uv (Python package manager)
- Docker & Docker Compose

## Getting Started

### 1. Install Dependencies

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install Node.js dependencies
pnpm install

# Install Python dependencies (for python-service)
cd apps/python-service
curl -LsSf https://astral.sh/uv/install.sh | sh
uv sync
```

### 2. Setup Environment

```bash
# Copy environment file
cp .env.example .env
# Edit .env with your values
```

### 3. Start Development (with Docker)

```bash
# Start all services with Docker Compose
docker compose -f docker/docker-compose.dev.yml up

# Or start individual services
docker compose -f docker/docker-compose.dev.yml up postgres api-gateway
```

### 3b. Start Development (without Docker)

```bash
# Start PostgreSQL (required)
docker compose -f docker/docker-compose.dev.yml up postgres

# In another terminal - start TypeScript services
pnpm dev

# In another terminal - start Python service
cd apps/python-service
uv run uvicorn app.main:app --reload --port 8000
```

## Available Commands

### Root Commands

```bash
pnpm dev          # Start all services in development mode
pnpm build        # Build all packages and apps
pnpm lint         # Lint all packages and apps
pnpm test         # Run all tests
pnpm typecheck    # Type check all TypeScript code
pnpm clean        # Clean all build outputs
```

### Database Commands

```bash
pnpm db:generate  # Generate Drizzle migrations
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema to database
pnpm db:studio    # Open Drizzle Studio
```

### Docker Commands

```bash
# Development
docker compose -f docker/docker-compose.dev.yml up
docker compose -f docker/docker-compose.dev.yml down

# Staging
docker compose -f docker/docker-compose.staging.yml up -d

# Production
docker compose -f docker/docker-compose.prod.yml up -d
```

## Adding New Services

### TypeScript Service

1. Create directory in `apps/`
2. Copy structure from `api-gateway`
3. Update `package.json` with service name
4. Add to `docker-compose.*.yml` files

### Python Service

1. Create directory in `apps/`
2. Copy structure from `python-service`
3. Update `pyproject.toml` with service name
4. Run `uv sync` to create virtual environment
5. Add to `docker-compose.*.yml` files

## Environment Variables

| Variable               | Description                  |
| ---------------------- | ---------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string |
| `OPENAI_API_KEY`       | OpenAI API key for LangChain |
| `LANGCHAIN_API_KEY`    | LangChain/LangSmith API key  |
| `LANGCHAIN_TRACING_V2` | Enable LangSmith tracing     |
| `LANGCHAIN_PROJECT`    | LangSmith project name       |

## Endpoints

- **API Gateway**: http://localhost:3000
- **Python Service**: http://localhost:8000
- **Drizzle Studio**: http://localhost:4983

## License

MIT
