#!/usr/bin/env bash
# Idempotent bootstrap of the Kubernetes secrets and the schema ConfigMap
# Aigora needs to start up on a fresh cluster.
#
# Usage: ./k8s/bootstrap-secrets.sh
#
# Reads provider API keys from the project-root .env file and the local
# ~/.docker/config.json for the GHCR pull secret. Generates a fresh Postgres
# password the first time, then reuses the existing one.
set -euo pipefail

NS=aigora
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "→ Ensuring namespace ${NS} exists"
kubectl get ns "${NS}" >/dev/null 2>&1 || kubectl create namespace "${NS}"

echo "→ ghcr-secret (image pull)"
if ! kubectl -n "${NS}" get secret ghcr-secret >/dev/null 2>&1; then
  if [[ ! -f "${HOME}/.docker/config.json" ]]; then
    echo "ERROR: ${HOME}/.docker/config.json not found — run 'docker login ghcr.io' first." >&2
    exit 1
  fi
  kubectl -n "${NS}" create secret generic ghcr-secret \
    --from-file=.dockerconfigjson="${HOME}/.docker/config.json" \
    --type=kubernetes.io/dockerconfigjson
else
  echo "  (already present)"
fi

echo "→ aigora-postgres (DB password + DATABASE_URL)"
if ! kubectl -n "${NS}" get secret aigora-postgres >/dev/null 2>&1; then
  PG_PASSWORD="$(openssl rand -hex 24)"
  DB_URL="postgresql://aigora:${PG_PASSWORD}@aigora-postgres:5432/aigora"
  kubectl -n "${NS}" create secret generic aigora-postgres \
    --from-literal=POSTGRES_PASSWORD="${PG_PASSWORD}" \
    --from-literal=DATABASE_URL="${DB_URL}"
else
  echo "  (already present — keeping the existing password)"
fi

echo "→ aigora-providers (LLM API keys, sourced from .env)"
if [[ ! -f "${ROOT}/.env" ]]; then
  echo "ERROR: ${ROOT}/.env not found — needs OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY." >&2
  exit 1
fi
# Source .env carefully (only the variables we want — keeps DATABASE_URL etc.
# out of the providers secret). Recreate every run so newly-rotated keys land
# in the cluster.
set -a; source "${ROOT}/.env"; set +a
: "${OPENAI_API_KEY:?missing OPENAI_API_KEY in .env}"
: "${ANTHROPIC_API_KEY:?missing ANTHROPIC_API_KEY in .env}"
: "${GOOGLE_API_KEY:?missing GOOGLE_API_KEY in .env}"
# OPENROUTER_API_KEY is optional — without it the cron's OpenRouter step is
# skipped at runtime.
SECRET_ARGS=(
  --from-literal=OPENAI_API_KEY="${OPENAI_API_KEY}"
  --from-literal=ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}"
  --from-literal=GOOGLE_API_KEY="${GOOGLE_API_KEY}"
)
if [[ -n "${OPENROUTER_API_KEY:-}" ]]; then
  SECRET_ARGS+=( --from-literal=OPENROUTER_API_KEY="${OPENROUTER_API_KEY}" )
fi
kubectl -n "${NS}" create secret generic aigora-providers \
  "${SECRET_ARGS[@]}" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "→ aigora-postgres-schema (initdb script ConfigMap)"
kubectl -n "${NS}" create configmap aigora-postgres-schema \
  --from-file=01_schema.sql="${ROOT}/db/schema.sql" \
  --dry-run=client -o yaml | kubectl apply -f -

echo
echo "✓ All secrets and the schema ConfigMap are in place in namespace '${NS}'."
echo "  Next: kubectl apply -f k8s/"
