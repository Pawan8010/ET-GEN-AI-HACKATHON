from fastapi.testclient import TestClient


def test_health_preserves_frontend_contract():
    from opsbrain_backend.main import create_app

    response = TestClient(create_app()).get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_every_response_has_request_id():
    from opsbrain_backend.main import create_app

    response = TestClient(create_app()).get("/api/health")
    assert response.headers["x-request-id"]


def test_readiness_reports_individual_dependencies():
    from opsbrain_backend.main import create_app

    response = TestClient(create_app()).get("/api/ready")
    assert response.status_code == 503
    assert set(response.json()["dependencies"]) == {
        "database", "redis", "qdrant", "neo4j", "object_store"
    }
