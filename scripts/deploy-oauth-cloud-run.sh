#!/usr/bin/env bash
set -euo pipefail

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required env var: $name" >&2
    exit 1
  fi
}

upsert_secret() {
  local name="$1"
  local value="$2"

  if gcloud secrets describe "$name" >/dev/null 2>&1; then
    printf "%s" "$value" | gcloud secrets versions add "$name" --data-file=-
  else
    printf "%s" "$value" | gcloud secrets create "$name" --data-file=-
  fi
}

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud is not installed. Install Google Cloud SDK first." >&2
  exit 1
fi

require_env PROJECT_ID
require_env DATABASE_URL
require_env JWT_SECRET
require_env GITHUB_CLIENT_ID
require_env GITHUB_CLIENT_SECRET

REGION="${REGION:-us-central1}"
REPO="${REPO:-cap-images}"
SERVICE="${SERVICE:-oauth-service}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
TAG="${TAG:-$(date +%Y%m%d-%H%M%S)}"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:${TAG}"

echo "Using:"
echo "  PROJECT_ID=$PROJECT_ID"
echo "  REGION=$REGION"
echo "  REPO=$REPO"
echo "  SERVICE=$SERVICE"
echo "  IMAGE=$IMAGE"

gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

if ! gcloud artifacts repositories describe "$REPO" --location "$REGION" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$REPO" \
    --repository-format=docker \
    --location="$REGION" \
    --description="CAP monorepo images"
fi

echo "Syncing secrets..."
upsert_secret oauth-database-url "$DATABASE_URL"
upsert_secret oauth-jwt-secret "$JWT_SECRET"
upsert_secret oauth-github-client-id "$GITHUB_CLIENT_ID"
upsert_secret oauth-github-client-secret "$GITHUB_CLIENT_SECRET"

echo "Building image..."
gcloud builds submit . \
  --file apps/oauth-service/Dockerfile \
  --tag "$IMAGE"

echo "Deploying Cloud Run service..."
gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars NODE_ENV=production,PORT=8080,APP_URL="$FRONTEND_URL",GITHUB_CALLBACK_URL=https://example.com/auth/callback/github \
  --set-secrets DATABASE_URL=oauth-database-url:latest,JWT_SECRET=oauth-jwt-secret:latest,GITHUB_CLIENT_ID=oauth-github-client-id:latest,GITHUB_CLIENT_SECRET=oauth-github-client-secret:latest

OAUTH_BASE_URL="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')"
REAL_CALLBACK_URL="${OAUTH_BASE_URL}/auth/callback/github"

echo "Updating GitHub callback URL env to deployed service URL..."
gcloud run services update "$SERVICE" \
  --region "$REGION" \
  --set-env-vars GITHUB_CALLBACK_URL="$REAL_CALLBACK_URL",APP_URL="$FRONTEND_URL",NODE_ENV=production,PORT=8080

echo
echo "Deploy complete."
echo "Cloud Run URL: $OAUTH_BASE_URL"
echo "GitHub callback URL to configure in GitHub App/OAuth App: $REAL_CALLBACK_URL"
