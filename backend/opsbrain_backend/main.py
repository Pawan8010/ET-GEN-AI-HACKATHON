import logging
from contextlib import asynccontextmanager
from pathlib import Path
from uuid import NAMESPACE_URL, uuid4, uuid5

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .api.health import router as health_router
from .api.status import router as status_router
from .api.events import router as events_router
from .api.documents import router as documents_router
from .api.query import router as query_router
from .api.graph import router as graph_router
from .api.auth import router as auth_router
from .api.intelligence import router as intelligence_router
from .realtime.bus import MemoryEventBus
from .retrieval.service import RagService
from .retrieval.store import InMemoryCorpus
from .retrieval.gemini import GeminiEmbedding, GeminiGroundedGenerator
from .core.config import Settings, get_settings
from .core.errors import OpsBrainError
from .core.logging import configure_logging


logger = logging.getLogger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    active_settings = settings or get_settings()
    configure_logging()
    app = FastAPI(title=active_settings.app_name, version="1.0.0")
    app.state.settings = active_settings
    app.state.dependency_probes = {}
    app.state.last_dependency_states = {}
    app.state.rag_metrics = {}
    app.state.event_bus = MemoryEventBus()
    app.state.corpus = InMemoryCorpus()
    if active_settings.gemini_api_key:
        embedding = GeminiEmbedding(
            active_settings.gemini_api_key, active_settings.gemini_embedding_model
        )
        generator = GeminiGroundedGenerator(
            active_settings.gemini_api_key, active_settings.gemini_generation_model
        )
    else:
        embedding = None
        generator = None
    app.state.rag = RagService(app.state.corpus, embedding=embedding, generator=generator)

    async def bootstrap_corpus() -> int:
        """Idempotently restore bundled/uploaded text sources after a restart."""
        documents_dir = Path(__file__).resolve().parents[2] / "storage" / "documents"
        if not documents_dir.exists():
            return 0
        indexed = 0
        for source in sorted(documents_dir.glob("*.txt")):
            text = source.read_text(encoding="utf-8", errors="replace").strip()
            if not text:
                continue
            document_id = str(uuid5(NAMESPACE_URL, f"opsbrain:{source.name}"))
            await app.state.rag.index_text(document_id, source.name, "knowledge_source", text)
            indexed += 1
        corpus_documents = list(app.state.corpus.documents.values())
        app.state.rag_metrics = {
            "total_documents": len(corpus_documents),
            "indexed_documents": sum(doc.ingest_status == "indexed" for doc in corpus_documents),
            "failed_documents": sum(doc.ingest_status == "failed" for doc in corpus_documents),
            "processing_documents": sum(doc.ingest_status == "processing" for doc in corpus_documents),
            "total_chunks": len(app.state.corpus.chunks),
            "entity_index_size": len(app.state.corpus.entities),
        }
        app.state.last_dependency_states["database"] = True
        return indexed

    app.state.bootstrap_corpus = bootstrap_corpus

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        await bootstrap_corpus()
        yield

    app.router.lifespan_context = lifespan

    app.add_middleware(
        CORSMiddleware,
        allow_origins=active_settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def request_context(request: Request, call_next):
        request_id = request.headers.get("x-request-id") or str(uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["x-request-id"] = request_id
        response.headers["x-content-type-options"] = "nosniff"
        return response

    @app.exception_handler(OpsBrainError)
    async def handle_opsbrain_error(request: Request, error: OpsBrainError) -> JSONResponse:
        return JSONResponse(
            status_code=error.status_code,
            content={"error": error.message, "code": error.code, "request_id": request.state.request_id},
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, error: Exception) -> JSONResponse:
        logger.exception("Unhandled request error", exc_info=error)
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "code": "internal_error",
                "request_id": request.state.request_id,
            },
        )

    app.include_router(health_router, prefix=active_settings.api_prefix)
    app.include_router(status_router, prefix=active_settings.api_prefix)
    app.include_router(events_router, prefix=active_settings.api_prefix)
    app.include_router(documents_router, prefix=active_settings.api_prefix)
    app.include_router(query_router, prefix=active_settings.api_prefix)
    app.include_router(graph_router, prefix=active_settings.api_prefix)
    app.include_router(auth_router, prefix=active_settings.api_prefix)
    app.include_router(intelligence_router, prefix=active_settings.api_prefix)

    dist = Path(__file__).resolve().parents[2] / "dist"
    if dist.exists():
        assets = dist / "assets"
        if assets.exists():
            app.mount("/assets", StaticFiles(directory=assets), name="assets")

        @app.get("/{path:path}", include_in_schema=False)
        async def frontend(path: str) -> FileResponse:
            del path
            return FileResponse(dist / "index.html")
    return app


app = create_app()
