# ET AI Hackathon 2.0 — PS8 Submission Package

Use this document as the source for the detailed PDF/brief, GitHub submission, and demo recording.

## Selected problem statement

**PS 8: AI for Industrial Knowledge Intelligence: Unified Asset & Operations Brain**

## One-line solution

OpsBrain AI turns fragmented industrial records into a connected, searchable operational memory and delivers grounded maintenance, safety, compliance, and RCA answers with citations.

## Executive summary

Industrial teams store critical knowledge in manuals, SOPs, inspection reports, incident logs, spreadsheets, and shift handovers. Finding the right evidence during maintenance or an incident is slow, and generic chatbots cannot prove where an answer came from. OpsBrain AI addresses this gap with an enterprise RAG platform that automatically ingests operational documents, extracts metadata, creates adaptive chunks, builds entity relationships, and combines keyword, semantic, and graph retrieval. Its Copilot returns evidence-backed answers with document/page/chunk citations, confidence, related sources, and retrieval diagnostics. Asset, Graph, Compliance, RCA, and Insights views make the same evidence useful across the complete operations workflow.

## Problem and users

**Users:** maintenance engineers, reliability teams, EHS/safety officers, plant managers, compliance teams, and incident investigators.

**Pain points:** fragmented records, repeated failures, slow root-cause investigation, poor traceability, and disconnected asset history.

## Product workflow

1. Upload a PDF, DOCX, PPTX, spreadsheet, HTML, text, Markdown, or ZIP record.
2. Extract content and metadata and create section-aware chunks.
3. Index the evidence for keyword, semantic, and graph retrieval.
4. Ask a natural-language question in Copilot.
5. Review the grounded answer, citations, confidence, source ranking, and retrieval trace.
6. Follow connected evidence through Assets, Graph, Compliance, RCA, and Insights.

## Technology and architecture

- React + TypeScript responsive web application
- FastAPI backend with authenticated APIs
- Firebase Email/Password authentication
- Hybrid retrieval: keyword, vector/semantic, and entity-graph evidence
- Gemini generation provider with deterministic extractive fallback
- PostgreSQL/Redis/Qdrant/Neo4j/MinIO/ClamAV Docker topology for deployment expansion
- Automated tests, health endpoints, CI workflow, and Docker Compose configuration

## What makes it innovative

- **Evidence-first Copilot:** citations and confidence are part of every answer.
- **Digital asset memory:** asset history, manuals, maintenance, incidents, risks, and recommendations are connected.
- **Graph + RAG:** relationships help retrieve context that keyword search alone misses.
- **Operational traceability:** retrieval counts and source ranking make AI behavior inspectable.
- **Incremental ingestion:** new documents become searchable without a manual training button.

## Expected impact

- Reduce time spent searching operational records.
- Improve consistency and auditability of maintenance and compliance decisions.
- Reuse lessons from incidents across assets and departments.
- Provide a practical foundation for QMS, sensor, and plant-system integrations.

## Demo script (3–4 minutes)

1. Open the landing page and show the ingestion-to-answer workflow.
2. Sign in using Firebase Email/Password.
3. Open Documents and show the indexed demonstration corpus.
4. Ask: **“What are the vibration alert thresholds for PMP-101?”**
5. Point out the grounded response, cited document, chunk, confidence, and retrieval diagnostics.
6. Open the PMP-101 asset view and show linked maintenance/incident evidence.
7. Open Graph to show the asset–incident–procedure relationships.
8. Open Compliance or RCA to show evidence-led operational workflows.
9. End on Insights with indexed document, chunk, entity, confidence, and health metrics.

## Submission upload checklist

### Detailed document (PDF)

Export this file, `docs/ARCHITECTURE_DIAGRAM.md`, `docs/REQUIREMENTS_MATRIX.md`, and `HACKATHON_DELIVERABLES.md` into one polished PDF titled `OpsBrain-AI-PS8-Submission.pdf`.

### Additional files

- Architecture diagram PDF/PNG
- Presentation deck based on `docs/PRESENTATION_DECK.md`
- Requirements matrix
- Optional screenshots of Copilot, Assets, Graph, and Insights

### GitHub URL

https://github.com/Pawan8010/ET-GEN-AI-HACKATHON

### Demo video

Record the script above in 3–4 minutes. Upload MP4 directly when under the portal limit; otherwise upload an accessible Google Drive/YouTube link and test it in an incognito window.

## Honest scope statement

The working prototype demonstrates multi-format document intelligence, hybrid RAG, graph retrieval, citations, responsive UI, asset intelligence, compliance/RCA workflows, and live Gemini integration. Plant-specific scanned-image OCR/P&ID computer vision and external QMS connectors remain clearly documented extension points because they require plant drawings, model selection, or customer credentials.
