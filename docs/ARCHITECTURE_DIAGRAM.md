# OpsBrain AI — Submission Architecture Diagram

```mermaid
flowchart LR
  U[Operator] --> UI[React responsive workspace]
  UI --> AUTH[Firebase Email/Password]
  UI --> API[FastAPI gateway]
  API --> ING[Document ingestion]
  ING --> EX[PDF DOCX PPTX XLSX CSV HTML TXT ZIP extraction]
  EX --> CH[Heading-aware adaptive chunking]
  CH --> EMB[Embedding provider\nGemini or deterministic local]
  CH --> META[Metadata and equipment entity extraction]
  EMB --> IDX[Incremental corpus index]
  META --> GRAPH[Knowledge graph index]
  UI -. SSE progress .-> EVENTS[Realtime event bus]
  API --> RET[Hybrid retriever]
  RET --> IDX
  RET --> GRAPH
  RET --> KEY[Keyword and metadata matching]
  RET --> RANK[Ranked evidence compression]
  RANK --> GEN[Gemini grounded generation\nor local extractive fallback]
  GEN --> CITE[Citations confidence entities diagnostics]
  CITE --> UI
  API --> RCA[RCA and maintenance intelligence]
  API --> COMP[Compliance and evidence packages]
  API --> INS[Lessons and live insights]
```

## Demo path

`Upload → Extract → Chunk → Embed → Index → Graph → Retrieve → Ground → Cite → Act`

The same `/api/query` contract powers Copilot and the RAG Architecture trace. The seeded corpus under `storage/documents` is synthetic validation evidence and is explicitly marked in every file.
