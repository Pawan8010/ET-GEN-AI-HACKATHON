# Hackathon Requirements Matrix

| Requirement | Status | Evidence in repository |
|---|---|---|
| Working prototype | Implemented | `src/`, `backend/`, `npm run verify` |
| RAG over industrial documents | Implemented | `backend/opsbrain_backend/retrieval/service.py` |
| Hybrid vector + keyword + graph retrieval | Implemented | `retrieval/service.py`, `retrieval/store.py` |
| Knowledge graph relationships | Implemented | graph API and entity index |
| OCR/document intelligence | Partial | PDF/DOCX/PPTX/XLSX/CSV/HTML/TXT/ZIP extraction is live; scanned-image OCR/P&ID vision is a documented next adapter |
| Computer vision / P&ID parsing | Extension point | Requires a vision model and plant drawing samples; not falsely represented as active functionality |
| QMS integration | Extension point | Compliance API and evidence packages are live; external QMS credentials/API contract are deployment-specific |
| Maintenance AI | Implemented | RCA, asset memory, lessons, work-order and predictive maintenance demo data |
| Compliance workflows | Implemented | compliance dashboard, gaps, and evidence package API |
| Architecture diagram | Implemented | `docs/ARCHITECTURE_DIAGRAM.md` |
| Presentation deck | Source-ready | `docs/PRESENTATION_DECK.md`; binary deck generation depends on the unavailable presentation runtime in this environment |
| Demo video | Recording-ready | `docs/DEMO_VIDEO_STORYBOARD.md` |
| Responsive premium UI | Implemented | Landing page, mobile navigation, route transitions, light/dark theme |
| GitHub submission | Ready | `.github/workflows/ci.yml`, README, Docker, clean commit |

The matrix intentionally distinguishes deployed functionality from integration points that need customer systems, plant drawings, or external credentials.
