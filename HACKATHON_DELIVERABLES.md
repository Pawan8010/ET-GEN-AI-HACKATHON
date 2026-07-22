# OpsBrain AI — Hackathon Demo Guide

## Core story

Industrial knowledge is fragmented across procedures, incident reports, inspections, work orders, regulations, and experienced operators. OpsBrain converts those sources into one searchable operational memory and returns evidence-backed answers at the point of work.

## Three-minute live demo

1. **Landing page (20 seconds)** — introduce the document-to-action workflow and point out that the document, chunk, entity, and engine indicators are live backend values.
2. **Documents (35 seconds)** — upload an operating note and show automatic extraction, chunking, indexing, tagging, graph updates, realtime progress, and document preview.
3. **Copilot (45 seconds)** — ask “What caused the near-miss incident involving PMP-101?” Show the grounded answer, cited documents, confidence explanation, and retrieval diagnostics.
4. **Graph and Asset Memory (30 seconds)** — open PMP-101 relationships and demonstrate how incidents, controls, procedures, and maintenance evidence connect around the asset.
5. **RCA and Compliance (35 seconds)** — generate an evidence-led RCA, then show compliance coverage and clearly identified evidence gaps.
6. **Lessons and Insights (25 seconds)** — create or inspect a maintenance work order, show recurrence alerts, and finish with live corpus/RAG health metrics.

## What judges should notice

- Uploaded evidence becomes searchable automatically; there is no manual training button.
- Vector, keyword, metadata, and graph context are merged before answering.
- Unsupported questions produce a low-confidence, “not found” response instead of fabricated guidance.
- Citations, related entities, and confidence are visible and inspectable.
- All product modules share the same API and indexed corpus.
- Firebase authentication, route protection, rate limiting, file validation, audit boundaries, SSE updates, health endpoints, CI, and containers provide a credible enterprise path.

## Demo-safe fallback

The deterministic local retrieval and extractive-answer path remains operational without a Gemini key. Seeded validation documents under `storage/documents` are explicitly labeled `DEMONSTRATION DATA`, making the distinction between product evidence and illustrative content clear.

## Verification checklist

- Run `npm run verify`.
- Confirm `/api/health`, `/api/ready`, and `/api/rag-status`.
- Confirm Firebase Email/Password authentication and authorized deployment domains.
- Upload one new document and verify it appears in Documents, Search, Graph, and Insights.
- Run the PMP-101 question and open at least one citation.
- Test the landing page and Copilot at desktop and mobile widths.
- Keep a Gemini-free local fallback ready for unreliable venue connectivity.

## Submission assets

- Repository README with setup, architecture, verification, and container instructions.
- GitHub Actions verification workflow.
- Dockerfiles and Docker Compose production-service topology.
- API documentation at `/docs`.
- Design and platform specifications under `docs/superpowers/`.
