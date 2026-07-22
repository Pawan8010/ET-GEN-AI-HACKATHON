from dataclasses import dataclass, field
from datetime import datetime, timezone

from ..ingestion.chunking import IndexedChunk


@dataclass(slots=True)
class CorpusDocument:
    id: str
    filename: str
    doc_type: str
    ingest_status: str = "processing"
    upload_date: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    tags: str | None = None
    suggested_tags: str | None = None
    summary: str = ""
    folder_path: str = "/"
    is_archived: int = 0


@dataclass(slots=True)
class StoredChunk:
    chunk: IndexedChunk
    vector: list[float]


class InMemoryCorpus:
    def __init__(self):
        self.documents: dict[str, CorpusDocument] = {}
        self.chunks: dict[str, StoredChunk] = {}
        self.entities: dict[str, set[str]] = {}

    def upsert_document(self, document: CorpusDocument) -> None:
        self.documents[document.id] = document

    def replace_chunks(self, document_id: str, chunks: list[StoredChunk]) -> None:
        self.chunks = {
            key: value for key, value in self.chunks.items()
            if value.chunk.document_id != document_id
        }
        self.chunks.update({item.chunk.id: item for item in chunks})

    def document_chunks(self, document_id: str) -> list[StoredChunk]:
        return sorted(
            (item for item in self.chunks.values() if item.chunk.document_id == document_id),
            key=lambda item: item.chunk.chunk_index,
        )
