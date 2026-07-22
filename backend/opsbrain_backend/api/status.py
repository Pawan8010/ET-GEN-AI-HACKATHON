from fastapi import APIRouter, Request


router = APIRouter(tags=["status"])


@router.get("/rag-status")
async def rag_status(request: Request) -> dict:
    metrics = getattr(request.app.state, "rag_metrics", {})
    probes = getattr(request.app.state, "last_dependency_states", {})
    database_connected = bool(probes.get("database", False))
    return {
        "connected": database_connected,
        "database_connected": database_connected,
        "gemini_connected": bool(request.app.state.settings.gemini_api_key),
        "total_documents": int(metrics.get("total_documents", 0)),
        "indexed_documents": int(metrics.get("indexed_documents", 0)),
        "failed_documents": int(metrics.get("failed_documents", 0)),
        "processing_documents": int(metrics.get("processing_documents", 0)),
        "total_chunks": int(metrics.get("total_chunks", 0)),
        "entity_index_size": int(metrics.get("entity_index_size", 0)),
    }
