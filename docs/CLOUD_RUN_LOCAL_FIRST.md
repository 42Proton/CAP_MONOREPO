# Local First + Cloud Run Deployment

This repo has multiple services. On Cloud Run, deploy each service as its own Cloud Run service.

## 1) Local Validation First

### 1.1 Prepare env

```bash
cp .env.example .env
```

Fill required values in `.env`:
- `DATABASE_URL`
- `JWT_SECRET`
- GitHub keys/secrets (`GITHUB_*`) for auth services
- `OPENAI_API_KEY` if AI routes are used

### 1.2 Start local services with Docker

For `oauth-service` + `ai-analyzer` + postgres:

```bash
docker compose up --build postgres oauth-service ai-analyzer
```

For `api-gateway` + `python-service` + postgres:

```bash
docker compose -f docker/docker-compose.dev.yml up --build postgres api-gateway python-service
```

### 1.3 Smoke test health endpoints

```bash
curl http://localhost:3001/health
curl http://localhost:5001/health
curl http://localhost:3000/health
curl http://localhost:8000/health/
```

Run tests if needed:

```bash
pnpm test
```

## 2) Test the Container Exactly Like Cloud Run

Choose one service and build its Docker image.

### Example: oauth-service

```bash
docker build -f apps/oauth-service/Dockerfile -t cap/oauth-service:local .
docker run --rm --env-file .env -e NODE_ENV=production -e PORT=8080 -p 8080:8080 cap/oauth-service:local
curl http://localhost:8080/health
```

### Example: ai-analyzer

```bash
docker build -f apps/ai-analyzer/Dockerfile -t cap/ai-analyzer:local .
docker run --rm --env-file .env -e NODE_ENV=production -e PORT=8080 -p 8080:8080 cap/ai-analyzer:local
curl http://localhost:8080/health
```

### Example: python-service

```bash
docker build -f apps/python-service/Dockerfile -t cap/python-service:local apps/python-service
docker run --rm --env-file .env -e PORT=8080 -p 8080:8080 cap/python-service:local
curl http://localhost:8080/health/
```

## 3) Deploy to Cloud Run (Per Service)

Set variables once:

```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
export REPO="cap-images"
export SERVICE="oauth-service"  # change per deployment
export TAG="$(date +%Y%m%d-%H%M%S)"
export IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:${TAG}"
```

Enable required APIs:

```bash
gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

Create Artifact Registry repo (one-time):

```bash
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="CAP monorepo images"
```

Build and push image:

```bash
gcloud builds submit . \
  --file apps/oauth-service/Dockerfile \
  --tag "$IMAGE"
```

Deploy:

```bash
gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars NODE_ENV=production,PORT=8080 \
  --set-env-vars APP_URL=https://YOUR_APP_DOMAIN \
  --set-env-vars DATABASE_URL=YOUR_DATABASE_URL
```

For `ai-analyzer`, keep `--port 8080` and set `PORT=8080` in env vars.

For secrets, prefer Secret Manager:

```bash
gcloud run services update "$SERVICE" \
  --region "$REGION" \
  --set-secrets OPENAI_API_KEY=openai-api-key:latest,JWT_SECRET=jwt-secret:latest
```

## 4) Verify in Cloud Run

```bash
gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)'
gcloud run services logs read "$SERVICE" --region "$REGION" --limit=100
```

Then call:

```bash
curl https://YOUR_CLOUD_RUN_URL/health
```

## Notes

- Cloud Run does not run your docker-compose stack. Deploy each microservice separately.
- Do not run PostgreSQL inside Cloud Run for production. Use Cloud SQL or another managed Postgres.
- If a service needs private DB access, attach a Serverless VPC connector and (for Cloud SQL) use `--add-cloudsql-instances`.
