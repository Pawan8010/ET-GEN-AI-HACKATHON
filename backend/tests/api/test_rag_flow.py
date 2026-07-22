from fastapi.testclient import TestClient

from opsbrain_backend.main import create_app


def test_upload_automatically_trains_and_becomes_searchable():
    client = TestClient(create_app())
    upload = client.post(
        "/api/documents/upload",
        files={"file": ("pump-note.txt", b"PMP-101 high vibration was caused by bearing fatigue and misalignment.", "text/plain")},
        data={"doc_type": "inspection_report"},
    )
    assert upload.status_code == 202
    document_id = upload.json()["document_id"]

    documents = client.get("/api/documents").json()
    assert any(item["id"] == document_id and item["ingest_status"] == "indexed" for item in documents)

    preview = client.get(f"/api/documents/{document_id}/file")
    assert preview.status_code == 200
    assert preview.headers["content-type"].startswith("text/plain")
    assert "bearing fatigue and misalignment" in preview.text

    answer = client.post("/api/query", json={"query_text": "What caused PMP-101 vibration?"})
    assert answer.status_code == 200
    body = answer.json()
    assert "bearing fatigue" in body["answer"].lower()
    assert body["citations"][0]["document_id"] == document_id
    assert body["confidence"] >= 0.35
