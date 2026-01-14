# CAP - Coding Agent Platform

## Project Overview

CAP is a backend platform for code review automation using AI-powered agents. Users can upload codespaces or connect GitHub repositories to run step-by-step agentic workflows that check for best practices and perform comprehensive code reviews.

---

## 🎯 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Frontend (Future)                          │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API Gateway (Express)                         │
│                    Auth, Rate Limiting, Request Routing                 │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
┌─────────────────┐       ┌─────────────────────┐      ┌─────────────────┐
│   Auth Service  │       │  GitHub Integration │      │ Project Service │
│   (TypeScript)  │       │     (TypeScript)    │      │   (TypeScript)  │
└─────────────────┘       └─────────────────────┘      └─────────────────┘
                                      │
                                      ▼
                          ┌─────────────────────┐
                          │   Code Ingestion    │
                          │      (Python)       │
                          │  Clone/Parse/Store  │
                          └─────────────────────┘
                                      │
                                      ▼
                          ┌─────────────────────┐
                          │  Agent Orchestrator │
                          │      (Python)       │
                          │ LangGraph Workflows │
                          └─────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
┌─────────────────┐       ┌─────────────────────┐      ┌─────────────────┐
│  Code Analyzer  │       │   Best Practices    │      │  Report Builder │
│    (Python)     │       │      (Python)       │      │    (Python)     │
│  AST, Metrics   │       │  Rules, Patterns    │      │  PDF, Markdown  │
└─────────────────┘       └─────────────────────┘      └─────────────────┘
                                      │
                                      ▼
                          ┌─────────────────────┐
                          │  Queue / Workers    │
                          │   Redis + BullMQ    │
                          └─────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Storage & Notifications                          │
│              PostgreSQL │ Redis │ S3/MinIO │ WebSockets                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Microservices Breakdown

| Service                | Language   | Purpose                                         | Priority |
| ---------------------- | ---------- | ----------------------------------------------- | -------- |
| `api-gateway`          | TypeScript | Request routing, auth middleware, rate limiting | P0       |
| `auth-service`         | TypeScript | User auth, JWT, GitHub OAuth                    | P0       |
| `github-service`       | TypeScript | GitHub API, repo cloning, webhooks              | P0       |
| `project-service`      | TypeScript | Project/workspace CRUD, user projects           | P0       |
| `code-ingestion`       | Python     | Clone repos, parse files, extract structure     | P1       |
| `agent-orchestrator`   | Python     | **Core** - LangGraph multi-step workflows       | P1       |
| `code-analyzer`        | Python     | AST analysis, metrics, static analysis          | P1       |
| `best-practices`       | Python     | Rules engine, pattern matching                  | P2       |
| `report-service`       | Python     | Generate review reports                         | P2       |
| `queue-worker`         | Python     | Background job processing                       | P2       |
| `notification-service` | TypeScript | WebSocket, real-time updates                    | P2       |

---

## 🔄 Core User Journey

```
1. User signs up/logs in (GitHub OAuth)
                    │
                    ▼
2. User connects GitHub repo OR uploads code
                    │
                    ▼
3. Code Ingestion Service clones/stores code
                    │
                    ▼
4. User starts "Code Review" workflow
                    │
                    ▼
5. Agent Orchestrator (LangGraph) runs multi-step analysis:
   ├─► Step 1: Structure Analysis (file tree, dependencies)
   ├─► Step 2: Code Quality Check (linting, complexity)
   ├─► Step 3: Best Practices Review (patterns, anti-patterns)
   ├─► Step 4: Security Scan (vulnerabilities)
   ├─► Step 5: AI-Powered Suggestions (LLM analysis)
   └─► Step 6: Generate Report
                    │
                    ▼
6. User receives real-time updates via WebSocket
                    │
                    ▼
7. Final report with actionable insights
```

---

## 🗄️ Database Schema (High-Level)

### Core Tables

```sql
-- Users & Authentication
users
├── id (uuid, PK)
├── email (varchar, unique)
├── name (varchar)
├── github_id (varchar, unique)
├── avatar_url (varchar)
├── created_at (timestamp)
└── updated_at (timestamp)

-- Projects / Repositories
projects
├── id (uuid, PK)
├── user_id (uuid, FK → users)
├── name (varchar)
├── description (text)
├── source_type (enum: 'github', 'upload')
├── github_repo_url (varchar)
├── github_branch (varchar)
├── storage_path (varchar)
├── status (enum: 'pending', 'cloned', 'analyzing', 'ready', 'error')
├── created_at (timestamp)
└── updated_at (timestamp)

-- Analysis Sessions
analysis_sessions
├── id (uuid, PK)
├── project_id (uuid, FK → projects)
├── workflow_type (enum: 'full_review', 'quick_check', 'security_only')
├── status (enum: 'queued', 'running', 'completed', 'failed')
├── started_at (timestamp)
├── completed_at (timestamp)
├── metadata (jsonb)
└── created_at (timestamp)

-- Analysis Steps (for tracking workflow progress)
analysis_steps
├── id (uuid, PK)
├── session_id (uuid, FK → analysis_sessions)
├── step_name (varchar)
├── step_order (int)
├── status (enum: 'pending', 'running', 'completed', 'failed')
├── input_data (jsonb)
├── output_data (jsonb)
├── error_message (text)
├── started_at (timestamp)
└── completed_at (timestamp)

-- Analysis Results / Findings
findings
├── id (uuid, PK)
├── session_id (uuid, FK → analysis_sessions)
├── file_path (varchar)
├── line_start (int)
├── line_end (int)
├── severity (enum: 'critical', 'major', 'minor', 'info')
├── category (enum: 'security', 'performance', 'style', 'best_practice', 'bug')
├── title (varchar)
├── description (text)
├── suggestion (text)
├── code_snippet (text)
├── ai_confidence (float)
└── created_at (timestamp)

-- Reports
reports
├── id (uuid, PK)
├── session_id (uuid, FK → analysis_sessions)
├── format (enum: 'json', 'markdown', 'pdf')
├── storage_url (varchar)
├── summary (jsonb)
└── created_at (timestamp)
```

---

## 📋 Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Basic infrastructure and user management

- [ ] Database schema setup with Drizzle
- [ ] Auth service implementation
  - [ ] JWT token generation/validation
  - [ ] GitHub OAuth integration
  - [ ] Session management
- [ ] API Gateway setup
  - [ ] Route definitions
  - [ ] Auth middleware
  - [ ] Error handling
- [ ] Project service
  - [ ] CRUD operations
  - [ ] User-project associations

**Deliverables**:

- User can sign up via GitHub
- User can create/list/delete projects
- Basic API routing works

---

### Phase 2: Code Ingestion (Week 3-4)

**Goal**: Connect to GitHub and ingest code

- [ ] GitHub service
  - [ ] OAuth token management
  - [ ] Repository listing
  - [ ] Clone repository
  - [ ] Webhook setup for auto-sync
- [ ] Code ingestion service
  - [ ] Clone repo to temp storage
  - [ ] Parse file structure
  - [ ] Extract metadata (languages, frameworks)
  - [ ] Store in S3/MinIO
- [ ] File upload alternative
  - [ ] ZIP upload endpoint
  - [ ] Extract and process

**Deliverables**:

- User can connect GitHub account
- User can select and clone a repo
- User can upload ZIP file
- Code structure is stored and indexed

---

### Phase 3: Analysis Engine (Week 5-7)

**Goal**: Build the core analysis capabilities

- [ ] Code analyzer service
  - [ ] AST parsing (tree-sitter)
  - [ ] Cyclomatic complexity
  - [ ] Code duplication detection
  - [ ] Dependency analysis
- [ ] Best practices service
  - [ ] Rule engine setup
  - [ ] Language-specific rules
  - [ ] Framework-specific rules
- [ ] Agent orchestrator (LangGraph)
  - [ ] Define workflow graph
  - [ ] State management
  - [ ] Step execution
  - [ ] Error handling & retries

**Deliverables**:

- Basic code analysis works
- Rules can flag issues
- Multi-step workflow executes

---

### Phase 4: AI Integration (Week 8-10)

**Goal**: LLM-powered intelligent analysis

- [ ] LLM integration
  - [ ] OpenAI GPT-4 integration
  - [ ] Prompt engineering for code review
  - [ ] Context window management
- [ ] Intelligent analysis
  - [ ] Multi-file understanding
  - [ ] Architecture suggestions
  - [ ] Refactoring recommendations
- [ ] Conversation support
  - [ ] Follow-up questions
  - [ ] Explanation requests
  - [ ] Memory/context persistence

**Deliverables**:

- AI provides intelligent suggestions
- User can ask follow-up questions
- Suggestions are actionable and specific

---

### Phase 5: Polish & Scale (Week 11-12)

**Goal**: Production-ready features

- [ ] Queue system
  - [ ] Redis setup
  - [ ] BullMQ workers
  - [ ] Job prioritization
- [ ] Real-time updates
  - [ ] WebSocket service
  - [ ] Progress notifications
  - [ ] Completion alerts
- [ ] Report generation
  - [ ] Markdown reports
  - [ ] PDF export
  - [ ] Summary dashboard
- [ ] Performance & Security
  - [ ] Rate limiting
  - [ ] Caching layer
  - [ ] Input validation
  - [ ] Security hardening

**Deliverables**:

- Async job processing
- Real-time progress updates
- Exportable reports
- Production-ready security

---

## 🛠️ Tech Stack Summary

### TypeScript Services

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **ORM**: Drizzle
- **Validation**: Zod
- **Queue**: BullMQ
- **Testing**: Jest

### Python Services

- **Runtime**: Python 3.11+
- **Framework**: FastAPI
- **AI**: LangChain, LangGraph
- **AST Parsing**: tree-sitter
- **Testing**: pytest

### Infrastructure

- **Database**: PostgreSQL 16
- **Cache/Queue**: Redis
- **Storage**: S3 / MinIO
- **Container**: Docker
- **Orchestration**: Docker Compose (dev) / Kubernetes (prod)

### AI/ML

- **LLM**: OpenAI GPT-4 (primary)
- **Orchestration**: LangGraph
- **Tracing**: LangSmith
- **Embeddings**: OpenAI / local

---

## ❓ Open Questions

### Authentication

- [ ] GitHub OAuth only, or also email/password?
- [ ] Team/organization support needed?
- [ ] SSO requirements?

### Code Storage

- [ ] Cloud storage (AWS S3) or self-hosted (MinIO)?
- [ ] Retention policy for cloned repos?
- [ ] Max repository size limits?

### Analysis Scope

- [ ] Priority languages: Python, TypeScript, JavaScript, Java?
- [ ] Framework support: React, FastAPI, Express, Spring?
- [ ] Custom rules support?

### AI Configuration

- [ ] OpenAI only, or multi-provider (Claude, Gemini)?
- [ ] API cost budget per analysis?
- [ ] Local model fallback?

### Deployment

- [ ] Target: Kubernetes, Docker Swarm, or Docker Compose?
- [ ] Cloud provider: AWS, GCP, Azure?
- [ ] Region requirements?

---

## 📁 Final Monorepo Structure

```
MONO/
├── apps/
│   ├── api-gateway/           # TypeScript - Request routing
│   ├── auth-service/          # TypeScript - Authentication
│   ├── github-service/        # TypeScript - GitHub integration
│   ├── project-service/       # TypeScript - Project management
│   ├── notification-service/  # TypeScript - WebSocket/real-time
│   ├── code-ingestion/        # Python - Clone & parse repos
│   ├── agent-orchestrator/    # Python - LangGraph workflows
│   ├── code-analyzer/         # Python - Static analysis
│   ├── best-practices/        # Python - Rules engine
│   ├── report-service/        # Python - Report generation
│   └── queue-worker/          # Python - Background jobs
├── packages/
│   ├── db/                    # Drizzle schema & client
│   ├── shared/                # Shared types & utilities
│   ├── eslint-config/         # ESLint configuration
│   └── typescript-config/     # TypeScript configuration
├── docker/
│   ├── docker-compose.dev.yml
│   ├── docker-compose.staging.yml
│   └── docker-compose.prod.yml
├── docs/
│   └── PROJECT_PLAN.md        # This document
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

---

## 🚀 Next Steps

1. **Answer open questions** - Finalize decisions on auth, storage, etc.
2. **Design database schema** - Create Drizzle schema files
3. **Build Phase 1** - Auth service, API gateway, project service
4. **Set up CI/CD** - GitHub Actions for testing and deployment

---

_Last updated: January 2026_
