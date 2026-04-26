# Aigora

> The political map of every LLM.

[![Live site](https://img.shields.io/badge/live-ai--gora.com-3b5cff)](https://ai-gora.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-22c55e)](LICENSE)

**Aigora** measures the political orientation of every major large language
model — GPT, Claude, Gemini, Grok, Mistral, Llama, DeepSeek, Qwen, Cohere
and ~200 more — using the open-source [Politiscales](https://politiscales.fr)
test, and publishes the **raw per-question answers**, the **computed
per-axis scores**, and the **exact prompt** used. Reproducible. Versioned.
Fully transparent.

→ Live at **[ai-gora.com](https://ai-gora.com)**.

---

## What it actually does

For each tested model, Aigora:

1. Sends all **117 Politiscales statements in a single prompt**.
2. Forces a **structured tool call** so the model has to answer every
   question on the standard 5-point Likert scale (or opt out via
   `no_opinion`).
3. Computes the **23 per-axis scores** with a faithful Python port of the
   upstream Politiscales scoring algorithm.
4. Persists everything (run metadata, raw answers, scores) in Postgres.
5. Surfaces it through a Next.js UI: per-model radar + per-question
   answers, a left/right scale, a sortable leaderboard, side-by-side
   comparisons, per-axis pages, and aggregate insights across the whole
   corpus.

A nightly Kubernetes CronJob auto-discovers and tests new models from
each provider's `/models` endpoint.

## Why

Every LLM carries the political fingerprints of its training corpus and
its post-training alignment. Most providers won't volunteer that
information. Aigora infers it the only way you can from the outside: by
asking the same questions to every model, in public, with a methodology
anyone can audit, fork, or contradict.

See [the methodology page](https://ai-gora.com/methodology) for the long
version, and [About](https://ai-gora.com/about) for what we deliberately
*don't* do.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  K8s CronJob (nightly)                                           │
│  └─ backend/  Python orchestrator                                │
│     ├─ list models per provider                                  │
│     ├─ skip already-tested (dedup via Postgres `models` table)   │
│     ├─ run forced tool-use prompt → 117 answers per model        │
│     └─ score with politiscales/scoring.py → write to Postgres    │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
                                  ▼
                 ┌─────────────────────────────┐
                 │  Postgres 17 (StatefulSet)  │
                 │  models · runs · answers · scores │
                 └─────────────────┬───────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│  K8s Deployment                                                  │
│  └─ frontend/  Next.js 16 (App Router, Server Components)        │
│     ├─ home grid + creator profiles + axis insights              │
│     ├─ /compare, /ranking, /axes, /axis/[name]                   │
│     ├─ /models/[provider]/[modelId]   detail + radar + answers   │
│     └─ dynamic OG cards via next/og                              │
└──────────────────────────────────────────────────────────────────┘
```

## Stack

**Backend** (`backend/`)
- Python 3.12 with the official SDKs:
  `openai`, `anthropic`, `google-genai`, plus a thin `openai`-base wrapper
  for `xAI` and `OpenRouter` (both OpenAI-compatible).
- `psycopg[binary]` for Postgres.
- Forced tool-use uniformly across providers — same JSON schema, three
  slightly different invocation conventions.

**Frontend** (`frontend/`)
- Next.js 16 (App Router, Server Components), Tailwind v4, shadcn/ui.
- Recharts for the radars, [`@lobehub/icons`](https://github.com/lobehub/lobe-icons)
  for the provider/creator branding.
- Dynamic OG cards via `next/og` (one per model + the home).
- Animated SVG brand mark.

**Data**
- Postgres 17 for storage, schema lives at `db/schema.sql`.
- 4 tables: `models`, `runs`, `answers`, `scores`.

**Deploy**
- Self-hosted on a homelab k3s cluster. Manifests in `k8s/`.
- Cloudflare in front for TLS / CDN.

## Running locally

```bash
# 1. Postgres (docker-compose)
docker compose up -d

# 2. Backend
cd backend
python3 -m venv .venv
.venv/bin/pip install -e .[dev]
cp ../.env.example ../.env  # then fill in the API keys you want

# Optional: smoke test the scoring port
.venv/bin/pytest tests/

# 3. Run a test on a specific model
.venv/bin/python run_test.py --provider openai --model gpt-4o-mini
.venv/bin/python run_test.py --provider xai    --model grok-3
.venv/bin/python run_test.py --provider openrouter --list

# 4. Frontend
cd ../frontend
npm install
npm run dev   # http://localhost:3000
```

The `.env` file at the repo root needs at least one provider key:

```bash
OPENAI_API_KEY=sk-…
ANTHROPIC_API_KEY=sk-ant-…
GOOGLE_API_KEY=AIza…
XAI_API_KEY=xai-…           # optional
OPENROUTER_API_KEY=sk-or-…  # optional
DATABASE_URL=postgresql://politix:politix_local_dev@localhost:5432/politix
```

## Deploying to Kubernetes

```bash
# 1. Bootstrap namespace + secrets (Postgres password is generated;
#    LLM keys are read from .env; ghcr-secret from ~/.docker/config.json).
./k8s/bootstrap-secrets.sh

# 2. Apply the manifests.
kubectl apply -f k8s/

# 3. Trigger the first run on demand (cron is nightly at 03:00 UTC).
kubectl -n aigora create job --from=cronjob/aigora-backend backend-bootstrap
kubectl -n aigora logs -f job/backend-bootstrap
```

Pre-built images are published to GHCR:

- `ghcr.io/marlburrow/aigora-frontend:latest`
- `ghcr.io/marlburrow/aigora-backend:latest`

The included Ingress assumes Traefik + Cloudflare proxied TLS at the edge.
For other ingress controllers or true end-to-end TLS, edit
`k8s/40-ingress.yaml`.

## Caveats

- LLMs are non-deterministic. Two consecutive runs on the same model can
  drift a few percentage points on borderline questions.
- A handful of weaker models (e.g. `gpt-3.5-turbo`) pattern-match the
  question's axis prefix instead of reading the statement; they get
  flagged "unreliable" and are excluded from rankings.
- OpenRouter routes the same model to different inference providers
  (DeepInfra, Together, Fireworks…) — useful for breadth, but introduces
  micro-variance unrelated to the model itself. Native APIs are preferred
  for the headline providers (OpenAI / Anthropic / Google / xAI).

## Acknowledgements

This site exists thanks to:

- [**Politiscales**](https://politiscales.fr) by [Conobi](https://github.com/Conobi/politiscales)
  — the political quiz, its 117 questions, the 23-axis scoring algorithm.
  This project only ports their scoring to Python and feeds it
  LLM-generated answers.
- [**lobe-icons**](https://github.com/lobehub/lobe-icons) — the
  beautiful SVG logos for every AI provider on the site.
- [**Claude Code**](https://www.anthropic.com/claude-code) — used as
  pair-programmer throughout.

## License

MIT — see [LICENSE](LICENSE).
