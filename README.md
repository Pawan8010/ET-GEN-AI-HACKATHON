# OpsBrain AI

> **A grounded operational memory for industrial teams.**

OpsBrain AI is a working enterprise RAG prototype for maintenance, safety, and compliance teams. It converts engineering records into connected evidence, then answers operational questions with source citations, confidence, and a visible retrieval trail.

## The challenge

Industrial knowledge is fragmented across SOPs, manuals, incident reports, inspection notes, spreadsheets, and shift handovers. During a maintenance or safety decision, teams need an answer quickly—but also need to know exactly where that answer came from.

## What we built

OpsBrain creates a searchable digital memory for plant operations:

- Ingests PDF, DOCX, PPTX, XLSX, CSV, HTML, TXT, Markdown, and ZIP records.
- Extracts text and metadata, creates adaptive section-aware chunks, and indexes them automatically.
- Combines keyword, semantic, and entity/graph retrieval for evidence discovery.
- Uses Gemini when configured, with a deterministic extractive fallback for repeatable local demos.
- Returns grounded answers with document, page/chunk, similarity, confidence, and related-source evidence.
- Connects Copilot, Documents, Assets, Graph, Compliance, RCA, and Insights through one API.

## Why it is valuable

1. **Faster decisions:** operators ask a natural-language question instead of searching multiple folders.
2. **Trustworthy answers:** every response exposes its evidence and retrieval diagnostics.
3. **Connected context:** incidents, assets, procedures, departments, and regulations are linked.
4. **Deployable foundation:** the same API can connect to enterprise storage, QMS, and plant systems.

## Judge-ready demonstration

1. Sign in with Firebase Email/Password.
2. Open **Documents** and upload a record—or use the marked demonstration corpus.
3. Wait for automatic extraction and indexing.
4. In **Copilot**, ask: *“What are the vibration alert thresholds for PMP-101?”*
5. Verify the cited source, chunk, confidence, and retrieval counts.
6. Open **Assets**, **Graph**, **Compliance**, **RCA**, and **Insights** to follow the same evidence across workflows.

The product has no fake sign-in or demo bypass. Every document follows the same ingestion and retrieval path.

## Architecture

```text
React + Firebase Email/Password
              |
              v
FastAPI API gateway and realtime events
              |
 extraction -> metadata -> adaptive chunks -> embeddings
              |
 keyword + semantic + graph retrieval -> reranking
              |
 Gemini prompt orchestration -> citations/confidence -> Copilot
```

The repository includes a local production topology for PostgreSQL, Redis, Qdrant, Neo4j, MinIO, and ClamAV. The core prototype runs with its local indexed corpus and does not require every optional service.

See [the module architecture](docs/ARCHITECTURE.md) and [the Mermaid system diagram](docs/ARCHITECTURE_DIAGRAM.md).

## Key capabilities

| Area | What is working in this submission |
| --- | --- |
| Document intelligence | Multi-format extraction, ZIP handling, metadata, adaptive chunks, ingestion status |
| Enterprise RAG | Hybrid keyword/vector/graph retrieval, query expansion, reranking, grounded generation, citations |
| Knowledge graph | Entity and relationship index for assets, incidents, procedures, departments, and regulations |
| Operations Copilot | Conversational context, source ranking, confidence, related documents, retrieval diagnostics |
| Asset intelligence | Asset history, maintenance evidence, risks, recommendations, and linked incidents |
| Compliance and RCA | Evidence-led compliance gaps and root-cause workflows |
| Product experience | Responsive React UI for desktop and mobile, light/dark theme, route-connected dashboards |
| Operations | Health/readiness endpoints, ingestion telemetry, CI checks, Docker Compose topology |

## Quick start

**Prerequisites:** Node.js 20+, Python 3.11+, and optionally Docker Desktop.

```powershell
git clone https://github.com/Pawan8010/ET-GEN-AI-HACKATHON.git
cd ET-GEN-AI-HACKATHON
npm install
python -m pip install -e ".\\backend[dev]"
Copy-Item .env.example .env
npm run verify
npm run backend:dev
```

Open `http://127.0.0.1:8000/#/`. API documentation is at `http://127.0.0.1:8000/docs`.

### Environment and security

Put secrets in a local `.env` only; `.env` is ignored and is not in this repository. Configure `GEMINI_API_KEY` for Gemini answers, Firebase client settings for sign-in, and optional service URLs for PostgreSQL/Redis/Qdrant/Neo4j. In Firebase Console, enable Email/Password and authorize the local or deployed hostname.

Never commit provider keys, Firebase service accounts, production documents, or personal data. Rotate any key that has been shared outside a secret manager.

## Verification

```powershell
npm run verify
```

This runs the backend test suite, TypeScript validation, and the production frontend build. Runtime checks:

- `/api/health` — process health
- `/api/ready` — dependency readiness
- `/api/rag-status` — indexed documents, chunks, entities, provider, and health

The submission was verified with 30 backend tests, a successful TypeScript/build pipeline, Docker Compose validation, and a live Gemini-grounded query against the demonstration corpus.

## Submission materials

- [Hackathon deliverables and demo flow](HACKATHON_DELIVERABLES.md)
- [Requirements matrix](docs/REQUIREMENTS_MATRIX.md)
- [Architecture diagram](docs/ARCHITECTURE_DIAGRAM.md)
- [Presentation deck source](docs/PRESENTATION_DECK.md)
- [Demo video storyboard](docs/DEMO_VIDEO_STORYBOARD.md)

The requirements matrix clearly separates implemented prototype features from plant-specific extension points. Scanned-image OCR/P&ID computer vision and external QMS connectors require customer drawings, models, or credentials and are not presented as falsely completed.

## Repository map

```text
src/                 React pages, components, API client, auth, design system
backend/app/         FastAPI routes, ingestion, retrieval, Gemini orchestration
backend/tests/       Unit, integration, retrieval, and RAG tests
storage/documents/   Marked synthetic demonstration corpus
docs/                Architecture, requirements, pitch, and recording assets
docker-compose.yml   Optional production-topology services
```

## Responsible use

OpsBrain is decision support, not an autonomous safety controller. Verify cited source material before safety-critical action, and apply the deployment's approved access control, malware scanning, retention, audit, encryption, and rate-limit policies.

## License

Provided for the ET GenAI Hackathon demonstration. Add the competition or organization license before public production distribution.
