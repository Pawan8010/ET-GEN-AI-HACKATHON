from opsbrain_backend.db.models import Chunk, DocumentVersion, IngestionJob


def test_chunk_lineage_and_incremental_embedding_fields_exist():
    names = set(Chunk.__table__.columns.keys())
    assert {
        "content_hash", "parent_chunk_id", "previous_chunk_id", "next_chunk_id",
        "page_number", "confidence",
    } <= names


def test_ingestion_job_has_retry_and_resume_fields():
    names = set(IngestionJob.__table__.columns.keys())
    assert {"stage", "attempt_count", "checkpoint", "next_retry_at", "error_code"} <= names


def test_document_version_is_incrementally_addressable():
    names = set(DocumentVersion.__table__.columns.keys())
    assert {"document_id", "version", "content_hash", "status"} <= names
