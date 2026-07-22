from fastapi.testclient import TestClient

from opsbrain_backend.main import create_app


def test_connected_intelligence_endpoints():
    client = TestClient(create_app())
    seeded = client.post("/api/documents/seed")
    assert seeded.status_code == 200

    equipment = client.get("/api/graph/equipment")
    assert equipment.status_code == 200
    assert "PMP-101" in equipment.json()
    assert "CMP-202" in equipment.json()
    assert "R-102" in equipment.json()
    assert "HX-410" in equipment.json()
    assert not {"FR-2026", "INC-2025", "STD-105"} & set(equipment.json())

    rca = client.get("/api/maintenance/rca", params={"equipment_tag": "PMP-101", "symptom": "high vibration"})
    assert rca.status_code == 200
    assert rca.json()["root_causes"]
    assert rca.json()["citations"]

    compliance = client.get("/api/compliance/dashboard")
    assert compliance.status_code == 200
    assert compliance.json()["gaps"]

    package = client.post("/api/compliance/generate_package", json={"regulation_ids": ["reg-oisd-105"]})
    assert package.status_code == 200
    assert "no evidence has been fabricated" in package.json()["report_markdown"]

    lessons = client.get("/api/lessons/alerts")
    assert lessons.status_code == 200
    assert lessons.json()["alerts"]

    work_order = client.post("/api/work_orders/create", json={
        "equipment_tag": "PMP-101", "description": "Investigate high vibration",
        "type": "Preventive", "technician_id": "TECH-07", "date": "2026-07-21",
    })
    assert work_order.status_code == 201
    assert work_order.json()["warning_banner"]["severity"] == "High"

    insights = client.get("/api/insights/summary")
    assert insights.status_code == 200
    assert insights.json()["is_live"] is True
    assert insights.json()["indexed_documents"] >= 5


def test_expanded_demo_scenarios_are_grounded_and_cited():
    client = TestClient(create_app())
    client.post("/api/documents/seed")

    scenarios = [
        ("Why did PMP-220 cavitate?", "strainer"),
        ("What must happen before emergency depressurization of R-102?", "CV-101"),
        ("What caused the HX-410 tube leak?", "inlet distributor"),
        ("What was wrong with MCC-12 feeder FDR-12-07?", "phase-B"),
    ]
    for question, expected in scenarios:
        response = client.post("/api/query", json={"query_text": question})
        assert response.status_code == 200
        result = response.json()
        assert expected.lower() in result["answer"].lower()
        assert result["citations"]
        assert result["confidence"] >= 0.35


def test_document_bulk_actions():
    client = TestClient(create_app())
    client.post("/api/documents/seed")
    documents = client.get("/api/documents").json()
    document_id = documents[0]["id"]
    response = client.post("/api/documents/bulk-action", json={
        "documentIds": [document_id], "action": "move_folder", "value": "/demo-validation"
    })
    assert response.status_code == 200
    details = client.get(f"/api/documents/{document_id}").json()
    assert details["folder_path"] == "/demo-validation"
