# Aigora — Kubernetes deployment

Single-cluster k3s deploy, with Cloudflare in front of `ai-gora.com`.

## Prerequisites

| What | Where |
|------|-------|
| `kubectl` context pointing at the right cluster | check with `kubectl config current-context` |
| `docker login ghcr.io` (used as the image-pull secret source) | run `docker login ghcr.io -u <github-user>` once |
| `.env` at the repo root with `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY` | reused by `bootstrap-secrets.sh` |
| `db/schema.sql` (source of truth for DB schema) | already in the repo |

## First deploy

```bash
# 1. Build & push images (once per release)
docker build -t ghcr.io/marlburrow/aigora-frontend:latest ./frontend
docker build -t ghcr.io/marlburrow/aigora-backend:latest  ./backend
docker push ghcr.io/marlburrow/aigora-frontend:latest
docker push ghcr.io/marlburrow/aigora-backend:latest

# 2. Bootstrap namespace, secrets, schema ConfigMap (idempotent)
./k8s/bootstrap-secrets.sh

# 3. Apply everything
kubectl apply -f k8s/

# 4. Watch rollout
kubectl -n aigora get pods -w
```

Expected pods:
- `aigora-postgres-0`            — Postgres StatefulSet
- `aigora-frontend-<hash>-<id>`  — 2 replicas of the Next.js frontend

The CronJob is silent until 03:00 UTC; trigger one manually with:
```bash
kubectl -n aigora create job --from=cronjob/aigora-backend backend-now
kubectl -n aigora logs -f job/backend-now
```

## DNS / TLS

`ai-gora.com` (apex) is proxied through Cloudflare. The K8s ingress only
needs to answer plain HTTP on the cluster's MetalLB VIP — Cloudflare
terminates TLS at its edge.

If you later switch Cloudflare to **Full (strict)** SSL:
1. Generate a Cloudflare Origin Certificate
2. `kubectl -n aigora create secret tls aigora-tls --cert=origin.pem --key=origin.key`
3. Add a `tls:` block to `40-ingress.yaml` referencing `aigora-tls`

## Rotating API keys

Edit the project-root `.env`, then re-run:
```bash
./k8s/bootstrap-secrets.sh   # only the providers secret is overwritten
kubectl -n aigora rollout restart cronjob/aigora-backend  # picks up the new secret on next run
```

## Updating the schema

```bash
# 1. Edit db/schema.sql (must stay idempotent — CREATE ... IF NOT EXISTS)
# 2. Refresh the ConfigMap (only effective on a fresh PVC; for live changes
#    apply migrations manually with psql)
./k8s/bootstrap-secrets.sh
```

## Tearing down (DEV ONLY — wipes the DB)

```bash
kubectl delete namespace aigora
# Longhorn PVC is deleted with the namespace because reclaimPolicy=Delete.
```
