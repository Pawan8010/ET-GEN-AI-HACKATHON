# OpsBrain AI

> Industrial knowledge intelligence for safer, faster operational decisions.

OpsBrain AI connects engineering procedures, asset history, incidents, inspections, maintenance records, and regulations through automatic ingestion, hybrid retrieval, and a live operational knowledge graph. Copilot answers are grounded in indexed evidence and include citations, related entities, retrieval diagnostics, and a human-readable confidence explanation.

## Product experience

- **Knowledge Copilot** — grounded operational Q&A with citations and conversation history.
- **Document Intelligence** — automatic extraction, metadata, adaptive chunks, indexing, preview, tags, search, and realtime progress.
- **Asset Memory** — unified manuals, incidents, maintenance, risk, and recommendations per asset.
- **Knowledge Graph** — relationship search and multi-hop exploration across operational entities.
- **RCA & Compliance** — evidence-led root cause analysis and control-gap reporting.
- **Lessons & Insights** — proactive recurrence alerts, work-order checks, corpus coverage, and RAG health.
- **RAG Architecture** — an interactive, live trace through the same query API used by Copilot.

## Connected architecture

```text
React UI + Firebase Auth
          │
          ▼
FastAPI gateway ── SSE realtime events
          │
          ├── extraction / OCR / metadata / adaptive chunking
          ├── vector + keyword + graph retrieval
          ├── grounded Gemini orchestration (optional provider)
          └── citations / confidence / related entities
```

The development runtime has a deterministic local retrieval and extractive-answer fallback, so the complete cited RAG workflow remains demonstrable without a provider key. The Docker topology includes PostgreSQL, Redis, Qdrant, Neo4j, MinIO, and ClamAV production foundations behind the same API contract.

## Quick start

Prerequisites: Node.js 20+ and Python 3.11+.

```powershell
npm install
python -m pip install -e ".\backend[dev]"
Copy-Item .env.example .env
npm run build
npm run backend:dev
```

Open `http://127.0.0.1:8000/#/`. API documentation is available at `http://127.0.0.1:8000/docs`.

Configure Firebase Email/Password authentication values in `.env`. In Firebase Console, enable **Email/Password** under Authentication → Sign-in method and add `localhost`, `127.0.0.1`, plus the deployment hostname under Authentication → Settings → Authorized domains.

To enable Gemini generation, set `GEMINI_API_KEY`. Uploaded documents become searchable automatically; no manual training action is required. The optional seeded validation files under `storage/documents` are clearly marked `DEMONSTRATION DATA` within their content.

## Verification

```powershell
npm run verify
```

This runs the complete backend test suite, TypeScript validation, and the production frontend build. GitHub Actions runs the same command for pushes to `main` and all pull requests.

## Containerized topology

Replace all development credentials in `.env`, then run:

```powershell
docker compose up --build
```

Health endpoints:

- `/api/health` — process health
- `/api/ready` — dependency readiness
- `/api/rag-status` — live corpus and provider status

## Demo guide

See [HACKATHON_DELIVERABLES.md](HACKATHON_DELIVERABLES.md) for the judging narrative, live demo flow, architecture summary, and fallback plan.

For the exact runtime flow and locations of every Python/RAG module, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
