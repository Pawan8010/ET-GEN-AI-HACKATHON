import pytest


@pytest.mark.asyncio
async def test_hybrid_retrieval_ranks_exact_equipment_evidence_first():
    from opsbrain_backend.retrieval.service import RagService
    from opsbrain_backend.retrieval.store import InMemoryCorpus

    corpus = InMemoryCorpus()
    service = RagService(corpus)
    await service.index_text("doc-a", "pump.txt", "manual", "PMP-101 high vibration was caused by bearing fatigue.")
    await service.index_text("doc-b", "valve.txt", "manual", "VLV-204 inspection found seat erosion.")
    result = await service.query("What caused PMP-101 high vibration?")
    assert result["citations"][0]["document_name"] == "pump.txt"
    assert "bearing fatigue" in result["answer"].lower()
    assert result["retrieval_debug"]["vector_hits"] > 0
    assert result["retrieval_debug"]["keyword_hits"] > 0


@pytest.mark.asyncio
async def test_named_equipment_query_excludes_unrelated_high_similarity_chunks():
    from opsbrain_backend.retrieval.service import RagService
    from opsbrain_backend.retrieval.store import InMemoryCorpus

    corpus = InMemoryCorpus()
    service = RagService(corpus)
    await service.index_text(
        "incident", "PMP-101-incident.txt", "incident_report",
        "PMP-101 near-miss was directly caused by incomplete lockout verification. "
        "Corrective action requires physically verifying VLV-204 before dismantling.",
    )
    await service.index_text(
        "procurement", "unrelated-bid.pdf", "contract",
        "The buyer directly requires corrective documents and bid verification before award.",
    )

    result = await service.query(
        "What directly caused the PMP-101 near-miss and what corrective action is required?"
    )

    assert result["citations"]
    assert {citation["document_name"] for citation in result["citations"]} == {
        "PMP-101-incident.txt"
    }
    assert "unrelated-bid" not in result["answer"]


@pytest.mark.asyncio
async def test_unsupported_query_fails_closed_without_citations():
    from opsbrain_backend.retrieval.service import RagService
    from opsbrain_backend.retrieval.store import InMemoryCorpus

    service = RagService(InMemoryCorpus())
    result = await service.query("What is the reactor shutdown pressure?")
    assert result["answer"].startswith("Not found in corpus")
    assert result["citations"] == []
    assert result["confidence"] < 0.2


@pytest.mark.asyncio
async def test_regulation_numbers_are_not_classified_as_equipment():
    from opsbrain_backend.retrieval.service import RagService
    from opsbrain_backend.retrieval.store import InMemoryCorpus

    corpus = InMemoryCorpus()
    await RagService(corpus).index_text(
        "doc-a", "safety.txt", "sop", "PMP-101 follows OSHA-1910 and OISD-105."
    )
    assert set(corpus.entities) == {"PMP-101"}
