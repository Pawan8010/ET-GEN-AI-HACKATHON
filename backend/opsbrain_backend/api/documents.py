from urllib.parse import quote

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

from ..ingestion.extractors import extract_text
from ..realtime.events import DomainEvent


router = APIRouter(prefix="/documents", tags=["documents"])
MAX_UPLOAD_BYTES = 30 * 1024 * 1024


@router.post("/seed")
async def seed_documents(request: Request) -> dict:
    seeded_count = await request.app.state.bootstrap_corpus()
    return {"success": True, "seeded_count": seeded_count}


def summary(document) -> dict:
    return {
        "id": document.id, "filename": document.filename, "doc_type": document.doc_type,
        "ingest_status": document.ingest_status, "upload_date": document.upload_date,
        "tags": document.tags, "suggested_tags": document.suggested_tags,
        "is_archived": document.is_archived, "folder_path": document.folder_path,
    }


@router.post("/upload", status_code=202)
async def upload_document(
    request: Request, file: UploadFile = File(...), doc_type: str = Form("document")
) -> dict:
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, detail={"code": "file_too_large"})
    try:
        text = extract_text(file.filename or "document.txt", content)
    except (ValueError, OSError) as error:
        raise HTTPException(400, detail={"code": "extraction_failed", "message": str(error)}) from error
    if not text.strip():
        raise HTTPException(422, detail={"code": "no_text_extracted"})
    document = await request.app.state.rag.create_and_index(
        file.filename or "document", doc_type, text
    )
    await request.app.state.event_bus.publish(DomainEvent(
        tenant_id="demo", type="ingestion-progress",
        data={"document_id": document.id, "stage": "indexed", "progress": 100},
    ))
    _update_metrics(request)
    return {"document_id": document.id, "filename": document.filename, "status": "indexed", "chunks_created": len(request.app.state.corpus.document_chunks(document.id))}


@router.get("")
async def list_documents(request: Request) -> list[dict]:
    return [summary(document) for document in sorted(
        request.app.state.corpus.documents.values(), key=lambda item: item.upload_date, reverse=True
    )]


@router.get("/search")
async def search_documents(request: Request, q: str = "") -> list[dict]:
    query = q.lower().strip()
    results = []
    for stored in request.app.state.corpus.chunks.values():
        document = request.app.state.corpus.documents[stored.chunk.document_id]
        if query in stored.chunk.content.lower() or query in document.filename.lower():
            results.append({
                "id": stored.chunk.id, "document_id": document.id,
                "content": stored.chunk.content, "section_label": stored.chunk.section,
                "chunk_index": stored.chunk.chunk_index, "filename": document.filename,
                "doc_type": document.doc_type, "score": 1.0,
            })
    return results[:50]


@router.get("/{document_id}/file", response_class=PlainTextResponse)
async def document_file(request: Request, document_id: str) -> PlainTextResponse:
    """Return the searchable document text for inline preview and download."""
    document = request.app.state.corpus.documents.get(document_id)
    if not document:
        raise HTTPException(404, detail={"code": "document_not_found"})
    chunks = sorted(
        request.app.state.corpus.document_chunks(document_id),
        key=lambda item: item.chunk.chunk_index,
    )
    content = "\n\n".join(item.chunk.content for item in chunks)
    filename = quote(f"{document.filename}.txt" if not document.filename.lower().endswith(".txt") else document.filename)
    return PlainTextResponse(
        content,
        headers={"Content-Disposition": f"inline; filename*=UTF-8''{filename}"},
    )


@router.get("/{document_id}")
async def document_details(request: Request, document_id: str) -> dict:
    document = request.app.state.corpus.documents.get(document_id)
    if not document:
        raise HTTPException(404, detail={"code": "document_not_found"})
    chunks = request.app.state.corpus.document_chunks(document_id)
    entities = [name for name, ids in request.app.state.corpus.entities.items() if document_id in ids]
    return {
        **summary(document), "summary": document.summary,
        "chunks": [{
            "id": item.chunk.id, "content": item.chunk.content,
            "section_label": item.chunk.section, "chunk_index": item.chunk.chunk_index,
        } for item in chunks],
        "entities": {"equipment": entities, "procedures": [], "regulations": []},
    }


class TagsRequest(BaseModel):
    tags: list[str]


class BulkActionRequest(BaseModel):
    documentIds: list[str]
    action: str
    value: str | None = None


@router.post("/bulk-action")
async def bulk_action(request: Request, payload: BulkActionRequest) -> dict:
    documents = [request.app.state.corpus.documents[item] for item in payload.documentIds if item in request.app.state.corpus.documents]
    if not documents:
        raise HTTPException(404, detail={"code": "documents_not_found"})
    for document in documents:
        if payload.action == "archive":
            document.is_archived = 1
        elif payload.action == "unarchive":
            document.is_archived = 0
        elif payload.action == "move_folder":
            document.folder_path = payload.value or "/"
        elif payload.action == "tag":
            existing = [tag.strip() for tag in (document.tags or "").split(",") if tag.strip()]
            added = [tag.strip() for tag in (payload.value or "").split(",") if tag.strip()]
            document.tags = ",".join(dict.fromkeys(existing + added))
        elif payload.action == "delete":
            request.app.state.corpus.documents.pop(document.id, None)
            request.app.state.corpus.replace_chunks(document.id, [])
        else:
            raise HTTPException(400, detail={"code": "unsupported_bulk_action"})
    _update_metrics(request)
    return {"success": True, "message": f"{payload.action} applied to {len(documents)} document(s)"}


@router.post("/{document_id}/apply-tags")
async def apply_tags(request: Request, document_id: str, payload: TagsRequest) -> dict:
    document = request.app.state.corpus.documents.get(document_id)
    if not document:
        raise HTTPException(404, detail={"code": "document_not_found"})
    document.tags = ",".join(dict.fromkeys(tag.strip() for tag in payload.tags if tag.strip()))
    return {"success": True, "tags": document.tags}


def _update_metrics(request: Request) -> None:
    documents = list(request.app.state.corpus.documents.values())
    request.app.state.rag_metrics = {
        "total_documents": len(documents),
        "indexed_documents": sum(doc.ingest_status == "indexed" for doc in documents),
        "failed_documents": sum(doc.ingest_status == "failed" for doc in documents),
        "processing_documents": sum(doc.ingest_status == "processing" for doc in documents),
        "total_chunks": len(request.app.state.corpus.chunks),
        "entity_index_size": len(request.app.state.corpus.entities),
    }
