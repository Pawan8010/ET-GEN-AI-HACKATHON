from fastapi.testclient import TestClient

from opsbrain_backend.main import create_app


client = TestClient(create_app())


def test_health_shape():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_rag_status_has_existing_required_keys():
    response = client.get("/api/rag-status")
    assert response.status_code == 200
    body = response.json()
    assert {
        "connected", "database_connected", "gemini_connected", "total_documents",
        "indexed_documents", "failed_documents", "processing_documents", "total_chunks",
        "entity_index_size",
    } <= body.keys()


def test_rag_status_counts_are_non_negative_integers():
    body = client.get("/api/rag-status").json()
    for key in (
        "total_documents", "indexed_documents", "failed_documents",
        "processing_documents", "total_chunks", "entity_index_size",
    ):
        assert isinstance(body[key], int)
        assert body[key] >= 0
