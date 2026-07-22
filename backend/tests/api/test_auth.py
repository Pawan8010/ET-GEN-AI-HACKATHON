from fastapi.testclient import TestClient

from opsbrain_backend.core.config import Settings
from opsbrain_backend.main import create_app


def test_guest_exchange_is_not_exposed():
    response = TestClient(create_app(Settings())).post(
        "/api/auth/guest", json={"display_name": "Demo Operator"}
    )
    assert response.status_code in {404, 405}


def test_invalid_bearer_token_is_rejected():
    app = create_app(Settings())
    response = TestClient(app).get(
        "/api/auth/me", headers={"Authorization": "Bearer invalid"}
    )
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_token"
