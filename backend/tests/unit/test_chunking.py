def test_section_chunker_preserves_headings_and_lineage():
    from opsbrain_backend.ingestion.chunking import SectionAwareChunker

    text = "# Safety\nPMP-101 must be isolated before maintenance.\n\n# Restart\nVerify alignment before restart."
    chunks = SectionAwareChunker(max_chars=60, overlap_chars=15).chunk("doc-1", text)
    assert len(chunks) >= 2
    assert chunks[0].heading == "Safety"
    assert chunks[-1].heading == "Restart"
    assert chunks[0].next_chunk_id == chunks[1].id
    assert chunks[1].previous_chunk_id == chunks[0].id
    assert all(chunk.content_hash for chunk in chunks)


def test_unchanged_content_produces_stable_chunk_ids():
    from opsbrain_backend.ingestion.chunking import SectionAwareChunker

    chunker = SectionAwareChunker(max_chars=100)
    first = chunker.chunk("doc-1", "# Procedure\nIsolate VLV-204 before opening PMP-101.")
    second = chunker.chunk("doc-1", "# Procedure\nIsolate VLV-204 before opening PMP-101.")
    assert [chunk.id for chunk in first] == [chunk.id for chunk in second]
