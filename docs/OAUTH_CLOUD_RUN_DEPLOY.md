# Deploy `oauth-service` To Cloud Run

This runbook deploys `apps/oauth-service` and validates auth endpoints for frontend integration.

## 1) Prerequisites

- Google Cloud SDK (`gcloud`) installed
- Docker installed
- GCP project with billing enabled
- PostgreSQL available (Cloud SQL or external managed DB)
- Required env/secrets:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - `GITHUB_CALLBACK_URL` (must point to your Cloud Run callback URL)

## 2) Set Variables

```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
export REPO="cap-images"
export SERVICE="oauth-service"
export TAG="$(date +%Y%m%d-%H%M%S)"
export IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:${TAG}"
```

Required runtime values:

```bash
export DATABASE_URL="postgresql://..."
export JWT_SECRET="..."
export GITHUB_CLIENT_ID="..."
export GITHUB_CLIENT_SECRET="..."
export FRONTEND_URL="https://your-frontend-domain.com"
```

## 3) Authenticate And Enable APIs

```bash
gcloud auth login
gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

## 4) Create Artifact Registry Repo (One-Time)

```bash
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="CAP monorepo images"
```

If it already exists, this can be skipped.

## 5) Build And Push Image

```bash
gcloud builds submit . \
  --file apps/oauth-service/Dockerfile \
  --tag "$IMAGE"
```

## 6) Configure Secrets (Recommended)

Create/update secrets:

```bash
printf "%s" "your_database_url" | gcloud secrets create oauth-database-url --data-file=- || true
printf "%s" "your_jwt_secret" | gcloud secrets create oauth-jwt-secret --data-file=- || true
printf "%s" "your_github_client_id" | gcloud secrets create oauth-github-client-id --data-file=- || true
printf "%s" "your_github_client_secret" | gcloud secrets create oauth-github-client-secret --data-file=- || true
```

Add new secret versions when rotating:

```bash
printf "%s" "new_value" | gcloud secrets versions add oauth-jwt-secret --data-file=-
```

## 7) Deploy To Cloud Run

```bash
gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars NODE_ENV=production,PORT=8080,APP_URL=https://your-frontend-domain.com \
  --set-env-vars GITHUB_CALLBACK_URL=https://$SERVICE-<hash>-<region>.a.run.app/auth/callback/github \
  --set-secrets DATABASE_URL=oauth-database-url:latest,JWT_SECRET=oauth-jwt-secret:latest,GITHUB_CLIENT_ID=oauth-github-client-id:latest,GITHUB_CLIENT_SECRET=oauth-github-client-secret:latest
```

After first deploy, replace callback URL value with your actual Cloud Run URL.

## 8) Post-Deploy Verification

Get service URL:

```bash
export OAUTH_BASE_URL="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')"
echo "$OAUTH_BASE_URL"
```

Health checks:

```bash
curl -i "$OAUTH_BASE_URL/health"
curl -i "$OAUTH_BASE_URL/health/ready"
```

Auth smoke tests:

```bash
curl -i -c /tmp/auth.cookies \
  -X POST "$OAUTH_BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"clouduser@example.com","password":"StrongPass123!","name":"Cloud User"}'

curl -i -c /tmp/auth.cookies \
  -X POST "$OAUTH_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"clouduser@example.com","password":"StrongPass123!"}'

curl -i -b /tmp/auth.cookies "$OAUTH_BASE_URL/auth/me"
```

## 9) Frontend Handoff

Share with frontend:
- Cloud Run base URL (for example `https://oauth-service-...run.app`)
- API contract doc: `docs/AUTH_API.md`
- OpenAPI spec: `docs/oauth-service-auth.openapi.yaml`

## 10) Common Issues

- `401 Missing or invalid Authorization`:
  - Cookie not being sent; ensure frontend uses `credentials: "include"` for cookie flow.
- `403 Invalid state parameter` on GitHub callback:
  - Callback is not preserving `oauth_state` cookie.
- `500 password authentication failed`:
  - `DATABASE_URL` is wrong or DB network access is blocked.
- CORS issues in browser:
  - Current service origin is hardcoded to `http://localhost:3000`; update service config before production frontend domains.

## Optional: One-Command Deploy Script

You can use:

```bash
./scripts/deploy-oauth-cloud-run.sh
```

The script will:
- Enable required APIs
- Create Artifact Registry repo if missing
- Upsert secrets in Secret Manager
- Build and deploy image
- Set callback URL to the deployed Cloud Run URL
