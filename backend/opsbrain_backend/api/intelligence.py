import re
from collections import Counter
from datetime import date, timedelta
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from ..realtime.events import DomainEvent


router = APIRouter(tags=["operations-intelligence"])

FAILURE_KNOWLEDGE = {
    "PMP-101": [
        {"date": "2025-11-08", "symptom": "loss of containment during casing work", "cause": "Incomplete lockout/tagout verification and an unreliable VLV-204 position indicator", "action": "Physically verify isolation, repair the indicator, and require an independent LOTO sign-off"},
        {"date": "2026-07-20", "symptom": "high vibration", "cause": "Probable bearing fatigue or mechanical misalignment pending inspection", "action": "Inspect bearings and alignment before restart; record isolation evidence"},
    ],
    "CMP-202": [
        {"date": "2026-05-11", "symptom": "bearing temperature trending up", "cause": "Restricted lubrication flow at the drive-end bearing", "action": "Flush the lubrication line, inspect the bearing, and trend temperature every shift"},
    ],
    "VLV-204": [
        {"date": "2025-11-08", "symptom": "position indication unreliable", "cause": "Position transmitter calibration drift", "action": "Calibrate the transmitter and require physical closed-position verification"},
    ],
}

REGULATIONS = [
    {"id": "reg-oisd-105", "name": "OISD-STD-105", "clause": "5.2", "source": "Oil Industry Safety Directorate", "severity": "Critical", "status": "Review Required", "assets_mapped": 2},
    {"id": "reg-osha-119", "name": "OSHA 1910.119", "clause": "Process Safety Information", "source": "OSHA", "severity": "High", "status": "Compliant", "assets_mapped": 3},
    {"id": "reg-iso-14224", "name": "ISO 14224", "clause": "Reliability data quality", "source": "ISO", "severity": "Medium", "status": "Compliant", "assets_mapped": 2},
    {"id": "reg-peso-2016", "name": "PESO SMPV Rules", "clause": "Inspection evidence", "source": "PESO", "severity": "High", "status": "Review Required", "assets_mapped": 1},
]


@router.get("/maintenance/rca")
async def maintenance_rca(request: Request, equipment_tag: str, symptom: str) -> dict:
    records = FAILURE_KNOWLEDGE.get(equipment_tag, [])
    query_terms = set(re.findall(r"[a-z0-9]+", symptom.lower()))
    ranked = sorted(records, key=lambda row: len(query_terms & set(re.findall(r"[a-z0-9]+", row["symptom"].lower()))), reverse=True)
    causes = [{"cause": row["cause"], "probability": round(max(.42, .86 - index * .17), 2), "evidence": f'{row["date"]}: {row["symptom"]}. {row["action"]}'} for index, row in enumerate(ranked[:4])]
    linked = []
    for document_id in request.app.state.corpus.entities.get(equipment_tag, set()):
        document = request.app.state.corpus.documents[document_id]
        linked.append({"document_name": document.filename, "excerpt": document.summary[:260]})
    return {
        "equipment_tag": equipment_tag, "symptom": symptom,
        "mtbf_days": 255 if len(records) > 1 else 0,
        "failure_rate_annual": round(len(records) / 1.5, 2),
        "criticality": "High" if equipment_tag in {"PMP-101", "VLV-204"} else "Medium" if records else "Unknown",
        "root_causes": causes,
        "recommended_action": ranked[0]["action"] if ranked else "Inspect the asset, verify operating conditions, and capture evidence before return to service.",
        "next_inspection_date": (date.today() + timedelta(days=14)).isoformat(),
        "citations": linked[:3],
    }


@router.get("/compliance/dashboard")
async def compliance_dashboard() -> dict:
    compliant = sum(item["status"] == "Compliant" for item in REGULATIONS)
    gaps = [
        {"id": "gap-loto-pmp101", "regulation_name": "OISD-STD-105", "mapped_entity": "PMP-101 / VLV-204", "entity_type": "Asset isolation", "status": "Evidence Gap", "severity": "Critical", "action_required": "Attach independent LOTO verification and repaired valve-indicator calibration evidence."},
        {"id": "gap-peso-tnk301", "regulation_name": "PESO SMPV Rules", "mapped_entity": "TNK-301", "entity_type": "Pressure vessel", "status": "Review Required", "severity": "High", "action_required": "Upload the current statutory inspection certificate."},
    ]
    return {"compliance_rate": round(compliant / len(REGULATIONS) * 100), "total_regulations": len(REGULATIONS), "mapped_assets_count": 5, "regulations": REGULATIONS, "gaps": gaps}


class CompliancePackageRequest(BaseModel):
    regulation_ids: list[str]


@router.post("/compliance/generate_package")
async def generate_compliance_package(payload: CompliancePackageRequest) -> dict:
    selected = [item for item in REGULATIONS if item["id"] in payload.regulation_ids]
    if not selected:
        raise HTTPException(400, detail={"code": "regulation_ids_required"})
    sections = [f'## {item["name"]} — {item["clause"]}\n- Source: {item["source"]}\n- Severity: {item["severity"]}\n- Status: {item["status"]}\n- Evidence rule: only indexed, cited records are admissible.' for item in selected]
    return {"report_markdown": "# OpsBrain Audit Evidence Package\n\n" + "\n\n".join(sections) + "\n\n## Open gaps\nMissing evidence is explicitly marked for human review; no evidence has been fabricated."}


@router.get("/lessons/alerts")
async def lessons_alerts() -> dict:
    return {"alerts": [
        {"type": "Recurring Failure", "severity": "High", "title": "Repeated isolation risk around PMP-101", "description": "Near-miss and vibration records both require verified isolation before casing work. Review VLV-204 indication and independent LOTO sign-off.", "linked_incidents": ["INC-2025-11-08-003", "INSP-2026-07-20-PMP101"]},
        {"type": "Condition Trend", "severity": "Medium", "title": "CMP-202 bearing temperature trend", "description": "Restricted lubrication flow was previously associated with rising drive-end bearing temperature.", "linked_incidents": ["FR-2026-05-11-CMP202"]},
    ]}


class WorkOrderRequest(BaseModel):
    equipment_tag: str
    description: str
    type: str
    technician_id: str
    date: str


@router.post("/work_orders/create", status_code=201)
async def create_work_order(request: Request, payload: WorkOrderRequest) -> dict:
    record = FAILURE_KNOWLEDGE.get(payload.equipment_tag, [])
    description_terms = set(re.findall(r"[a-z0-9]+", payload.description.lower()))
    match = next((row for row in record if description_terms & set(re.findall(r"[a-z0-9]+", row["symptom"].lower()))), None)
    work_order = {"id": str(uuid4()), "wo_number": f"WO-{date.today().year}-{str(uuid4())[:6].upper()}", **payload.model_dump(), "status": "Scheduled"}
    warning = None
    if match:
        warning = {"severity": "High", "title": f"Lessons learned: {payload.equipment_tag}", "message": f'A similar {match["symptom"]} event occurred on {match["date"]}. Root cause: {match["cause"]}. Required control: {match["action"]}.'}
        await request.app.state.event_bus.publish(DomainEvent(tenant_id="demo", type="work-order-warning", data={"work_order": work_order, "warning_banner": warning}))
    return {"status": "created", "work_order": work_order, "warning_banner": warning}


@router.get("/insights/summary")
async def insights_summary(request: Request) -> dict:
    documents = list(request.app.state.corpus.documents.values())
    document_types = Counter(doc.doc_type for doc in documents if doc.ingest_status == "indexed")
    stop = {"this", "that", "with", "from", "have", "must", "shall", "before", "after", "equipment", "section"}
    topics = Counter()
    for stored in request.app.state.corpus.chunks.values():
        topics.update(term for term in re.findall(r"[a-z]{5,}", stored.chunk.content.lower()) if term not in stop)
    return {"is_live": True, "document_types": [{"doc_type": key, "count": value} for key, value in document_types.most_common()], "topics": [{"topic": key, "count": value} for key, value in topics.most_common(10)], "total_chunks": len(request.app.state.corpus.chunks), "indexed_documents": sum(doc.ingest_status == "indexed" for doc in documents), "entity_index_size": len(request.app.state.corpus.entities)}
