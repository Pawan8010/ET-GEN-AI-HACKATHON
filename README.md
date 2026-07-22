# OpsBrain AI

> **Industrial knowledge intelligence for safer, faster operational decisions.**

OpsBrain AI is an enterprise RAG platform for industrial teams. It turns heterogeneous engineering records into a searchable operational memory and gives maintenance, compliance, and safety teams cited answers they can verify.

## Hackathon submission

### The problem

Critical knowledge is spread across manuals, SOPs, incident reports, inspection notes, spreadsheets, and shift handovers. Engineers lose time searching, evidence is difficult to trace, and similar failures recur because lessons are not connected to assets or procedures.

### Our solution

OpsBrain automatically ingests operational documents, extracts structured evidence, builds adaptive chunks and entity relationships, and combines keyword, semantic, and graph retrieval. The Copilot responds only from retrieved evidence, displays citations and confidence, and exposes the retrieval trace for auditability.

### Why it matters

- Faster answers during maintenance and incident response
- Evidence-backed decisions instead of unauditable chatbot text
- A digital memory for every asset, procedure, and incident
- A foundation for compliance gap analysis and predictive workflows

## Capability map

| Capability | Demonstrated implementation |
|---|---|
| Document intelligence | PDF, DOCX, PPTX, XLSX, CSV, HTML, TXT, Markdown, ZIP extraction; metadata and adaptive chunking |
| Enterprise RAG | Hybrid keyword/vector retrieval, query expansion, reranking, grounded Gemini generation, citations, confidence |
| Knowledge graph | Entity and relationship index with asset, incident, procedure, department, and regulation links |
| Operational Copilot | Streaming-ready chat API, conversation context, source ranking, related documents, retrieval diagnostics |
| Asset intelligence | Asset history, manuals, maintenance evidence, risks, recommendations, and linked incidents |
| Compliance and RCA | Evidence-led compliance gap and root-cause workflows in the product UI |
| Observability | Health, readiness, RAG status, ingestion progress, latency and confidence telemetry |
| Responsive product | Premium desktop and mobile layouts with authenticated React routes |

## Architecture

```text
React + Firebase Email/Password Auth
              |
              v
FastAPI API gateway (REST + realtime events)
              |
  ingestion -> extraction/OCR -> metadata -> adaptive chunks
              |
  embeddings -> hybrid retrieval (keyword + vector + graph)
              |
  reranking -> prompt orchestration -> Gemini (optional)
              |
  citations + confidence + related entities -> Copilot UI
```

The local runtime includes deterministic retrieval and extractive fallback behavior, so the cited workflow remains testable without an external model key. Docker Compose provides PostgreSQL, Redis, Qdrant, Neo4j, MinIO, and ClamAV foundations for production integration.

Detailed module ownership is documented in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). The Mermaid architecture diagram is in [docs/ARCHITECTURE_DIAGRAM.md](docs/ARCHITECTURE_DIAGRAM.md).

## Run locally

**Prerequisites:** Node.js 20+, Python 3.11+, and (optional) Docker Desktop.

```powershell
git clone https://github.com/Pawan8010/ET-GEN-AI-HACKATHON.git
cd ET-GEN-AI-HACKATHON
npm install
python -m pip install -e ".\backend[dev]"
Copy-Item .env.example .env
npm run build
npm run backend:dev
```

Open `http://127.0.0.1:8000/#/`. FastAPI docs: `http://127.0.0.1:8000/docs`.

### Environment configuration

Set values in a local `.env` file only; never commit it.

- `GEMINI_API_KEY` — optional Gemini generation provider
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` — Firebase client configuration
- `FIREBASE_PROJECT_ID` and service-account settings — backend token verification when enabled
- `DATABASE_URL`, `REDIS_URL`, `QDRANT_URL`, `NEO4J_URI` — optional external services

In Firebase Console, enable **Email/Password** authentication and authorize `localhost`, `127.0.0.1`, and the deployed hostname. Google SSO and demo sign-in are intentionally not part of the product flow.

## Use the product

1. Sign in with an approved Firebase Email/Password account.
2. Open **Documents** and upload an engineering record or use the marked demonstration corpus.
3. Wait for ingestion/indexing progress to complete.
4. Ask **Copilot** a question such as: “What are the vibration alert thresholds for PMP-101?”
5. Inspect citations, page/chunk metadata, confidence, and retrieval diagnostics.
6. Explore **Assets**, **Graph**, **Compliance**, **RCA**, and **Insights** for connected evidence.

Every uploaded document is indexed automatically; there is no manual training button.

## Verification and quality

```powershell
npm run verify
```

This runs the backend test suite, TypeScript validation, and the production frontend build. CI repeats the same checks for pushes and pull requests. Useful runtime checks:

- `/api/health` — process health
- `/api/ready` — dependency readiness
- `/api/rag-status` — indexed documents, chunks, entities, provider, and health

## Container deployment

Configure deployment secrets outside Git, then:

```powershell
docker compose up --build
```

Use a managed secret store, restricted Firebase domains, HTTPS, rate limiting, and rotated provider keys in a hosted environment.

## Judging and demo assets

- [Hackathon deliverables](HACKATHON_DELIVERABLES.md) — judging narrative and live demo flow
- [Requirements matrix](docs/REQUIREMENTS_MATRIX.md) — implemented capabilities and extension points
- [Presentation deck source](docs/PRESENTATION_DECK.md) — slide-by-slide pitch content
- [Demo video storyboard](docs/DEMO_VIDEO_STORYBOARD.md) — 3:30 recording plan

The requirements matrix is intentionally honest: scanned-image OCR/P&ID computer vision and external QMS connectors are documented extension points requiring plant-specific models or credentials. The core working prototype, ingestion pipeline, hybrid RAG, graph retrieval, citations, responsive UI, and demo corpus are included in this repository.

## Repository structure

```text
src/                 React pages, components, API client, auth, design system
backend/app/         FastAPI routes, ingestion, retrieval, Gemini orchestration
backend/tests/       Unit, integration, retrieval, and RAG tests
storage/documents/   Small marked demonstration corpus
docs/                Architecture, requirements, deck, and demo documentation
docker-compose.yml   Local production-topology services
```

## Security and responsible use

Do not commit API keys, Firebase service accounts, production documents, or personal data. Treat Copilot output as decision support: verify cited source material before safety-critical action. Uploaded files and credentials should be protected with the deployment's approved malware scanning, retention, access-control, and audit policies.

## License

Provided for the ET GenAI Hackathon demonstration. Add the competition or organization license before public production distribution.
