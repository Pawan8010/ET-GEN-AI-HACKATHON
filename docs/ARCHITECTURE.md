# OpsBrain AI Architecture

## Runtime path

```text
Browser
  └─ React + Firebase Email/Password authentication
       └─ /api requests with Firebase ID token
            └─ FastAPI gateway
                 ├─ document ingestion and extraction
                 ├─ adaptive chunking and metadata
                 ├─ embeddings and incremental corpus index
                 ├─ vector + keyword + graph retrieval
                 ├─ Gemini or local grounded answer generation
                 ├─ citations, confidence, entities, diagnostics
                 └─ SSE events for realtime UI updates
```

## Source layout

```text
src/
  components/             Shared brand, chat, graph, and application-shell UI
  context/                Firebase authentication and theme state
  lib/api.ts              Typed frontend-to-FastAPI contract
  lib/firebase.ts         Firebase application/authentication integration
  pages/                  Route-level product modules

backend/
  opsbrain_backend/
    main.py               FastAPI application composition and static UI hosting
    worker.py             Background worker entry point
    api/                  HTTP routes for auth, documents, query, graph, events,
                          health, status, RCA, compliance, lessons, and insights
    auth/                 Firebase token verification, RBAC, principals
    core/                 Settings, structured errors, logging
    db/                   PostgreSQL models and async sessions
    ingestion/
      extractors.py       PDF/DOCX/PPTX/XLSX/HTML/text extraction
      chunking.py         Heading-aware adaptive chunk construction
    retrieval/
      embeddings.py       Deterministic and provider embedding abstraction
      store.py            Incremental document/chunk/entity corpus
      service.py          Ingestion plus hybrid RAG orchestration
      gemini.py           Gemini generation boundary and grounded fallback
    realtime/             Typed SSE event bus
  alembic/                PostgreSQL schema migrations
  tests/                  Unit, API, integration, contract, and RAG tests

storage/documents/        Clearly labeled hackathon validation corpus
```

## RAG request flow

1. `POST /api/documents/upload` validates and extracts the uploaded file.
2. `retrieval/service.py` creates the document, metadata, adaptive chunks, embeddings, and graph entities incrementally.
3. The event bus publishes ingestion progress for realtime document and dashboard updates.
4. `POST /api/query` passes the question to the RAG service.
5. The service classifies intent and merges semantic, keyword, metadata, and graph candidates.
6. Retrieved evidence is ranked and passed to the Gemini boundary when configured.
7. If Gemini is unavailable, the extractive fallback still answers only from retrieved evidence.
8. The API returns the grounded answer, citations, confidence reason, related entities, and retrieval diagnostics.

## Storage modes

- The hackathon runtime uses the in-process corpus store for deterministic startup and offline demonstration.
- SQLAlchemy models and Alembic migrations define the PostgreSQL production persistence boundary.
- Docker Compose provisions PostgreSQL, Redis, Qdrant, Neo4j, MinIO, and ClamAV for the production topology.
- The typed `/api` contract isolates the React application from storage-provider changes.

## Security boundaries

- Firebase performs browser identity authentication.
- FastAPI verifies Firebase ID tokens and applies RBAC dependencies.
- Upload validation, size limits, structured errors, request IDs, and security headers are enforced server-side.
- Secrets are environment variables and never belong in committed `.env` files.

## Verification

`npm run verify` runs backend tests, TypeScript validation, and the production frontend build. GitHub Actions executes the same command for pushes and pull requests.
