import re
from uuid import uuid4

from ..ingestion.chunking import SectionAwareChunker
from .embeddings import LocalHashEmbedding, cosine, terms
from .store import CorpusDocument, InMemoryCorpus, StoredChunk


class RagService:
    def __init__(self, corpus: InMemoryCorpus, embedding=None, generator=None):
        self.corpus = corpus
        self.embedding = embedding or LocalHashEmbedding()
        self.generator = generator
        self.chunker = SectionAwareChunker()

    async def index_text(
        self, document_id: str, filename: str, doc_type: str, text: str
    ) -> CorpusDocument:
        document = self.corpus.documents.get(document_id) or CorpusDocument(
            id=document_id, filename=filename, doc_type=doc_type
        )
        self.corpus.upsert_document(document)
        chunks = self.chunker.chunk(document_id, text)
        vectors = await self.embedding.embed([chunk.content for chunk in chunks])
        self.corpus.replace_chunks(document_id, [
            StoredChunk(chunk=chunk, vector=vector) for chunk, vector in zip(chunks, vectors)
        ])
        # Keep the graph focused on physical assets. Document, incident, work-order,
        # procedure, inspection and regulatory identifiers are modeled separately.
        non_equipment_prefixes = {
            "OSHA", "OISD", "PESO", "EPA", "ISO", "STD", "SOP",
            "INC", "INSP", "FR", "WO", "TECH",
        }
        entities = sorted({
            tag for tag in re.findall(r"\b[A-Z]{1,6}(?:-\d{1,5})+\b", text)
            if tag.split("-", 1)[0] not in non_equipment_prefixes
        })
        for entity in entities:
            self.corpus.entities.setdefault(entity, set()).add(document_id)
        document.suggested_tags = ",".join(entities)
        document.summary = chunks[0].content[:600] if chunks else ""
        document.ingest_status = "indexed"
        return document

    async def create_and_index(self, filename: str, doc_type: str, text: str) -> CorpusDocument:
        return await self.index_text(str(uuid4()), filename, doc_type, text)

    async def query(self, query_text: str, top_k: int = 6) -> dict:
        query_text = query_text.strip()
        if not query_text or not self.corpus.chunks:
            return self._unsupported()
        query_vector = (await self.embedding.embed([query_text]))[0]
        stop_terms = {
            "what", "which", "when", "where", "with", "that", "this", "from",
            "have", "were", "directly", "caused", "required", "about", "does",
        }
        query_terms = set(terms(query_text)) - stop_terms
        entity_terms = {
            tag.lower() for tag in re.findall(r"\b[A-Z]{1,6}(?:-\d{1,5})+\b", query_text, re.I)
        }
        candidates = list(self.corpus.chunks.values())
        if entity_terms:
            candidates = [
                item for item in candidates
                if entity_terms <= set(terms(item.chunk.content))
            ]
        if not candidates:
            return self._unsupported()
        vector_ranked = sorted(
            ((cosine(query_vector, item.vector), item) for item in candidates),
            key=lambda pair: pair[0], reverse=True,
        )
        keyword_ranked = []
        for item in candidates:
            content_terms = set(terms(item.chunk.content))
            exact = len(query_terms & content_terms) / max(1, len(query_terms))
            if exact:
                keyword_ranked.append((exact, item))
        keyword_ranked.sort(key=lambda pair: pair[0], reverse=True)

        scores: dict[str, float] = {}
        for rank, (score, item) in enumerate(vector_ranked[:top_k * 2]):
            content_terms = set(terms(item.chunk.content))
            has_exact_term = bool(query_terms & content_terms)
            if score > 0.18 and (has_exact_term or score > 0.42):
                scores[item.chunk.id] = scores.get(item.chunk.id, 0) + 1 / (60 + rank) + score * 0.25
        for rank, (score, item) in enumerate(keyword_ranked[:top_k * 2]):
            scores[item.chunk.id] = scores.get(item.chunk.id, 0) + 1 / (60 + rank) + score * 0.5
        selected = sorted(
            (self.corpus.chunks[chunk_id] for chunk_id in scores),
            key=lambda item: scores[item.chunk.id], reverse=True,
        )[:top_k]
        best_keyword = keyword_ranked[0][0] if keyword_ranked else 0.0
        best_vector = vector_ranked[0][0] if vector_ranked else 0.0
        if not selected or (best_keyword < 0.15 and best_vector < 0.1):
            return self._unsupported()

        evidence = selected[:3]
        extractive_answer = "Based on the indexed corpus:\n\n" + "\n\n".join(
            f"• {item.chunk.content}" for item in evidence
        )
        answer = extractive_answer
        if self.generator:
            try:
                generated = await self.generator.answer(
                    query_text, [(item.chunk.id, item.chunk.content) for item in evidence]
                )
                valid_ids = {item.chunk.id for item in evidence}
                cited_ids = set(re.findall(r"\[([0-9a-f-]{36})\]", generated, re.I))
                if generated and generated != "Not found in corpus." and cited_ids and cited_ids <= valid_ids:
                    answer = generated
            except Exception:
                answer = extractive_answer
        citations = []
        for item in evidence:
            document = self.corpus.documents[item.chunk.document_id]
            citations.append({
                "document_id": document.id,
                "document_name": document.filename,
                "section": item.chunk.section,
                "excerpt": item.chunk.content[:500],
                "chunk_id": item.chunk.id,
                "score": round(scores[item.chunk.id], 6),
            })
        mentioned = [entity for entity in self.corpus.entities if entity.lower() in query_text.lower()]
        confidence = min(0.96, max(0.35, 0.25 + best_keyword * 0.45 + max(0, best_vector) * 0.3))
        return {
            "answer": answer,
            "citations": citations,
            "confidence": round(confidence, 4),
            "confidence_reason": f"Grounded in {len(evidence)} retrieved chunks; exact-term coverage {best_keyword:.0%}.",
            "related_entities": [
                {"id": f"equip:{entity}", "type": "Equipment", "name": entity}
                for entity in mentioned
            ],
            "intent": "maintenance" if re.search(r"fail|vibrat|maintenance|inspect", query_text, re.I) else "knowledge_search",
            "retrieval_debug": {
                "vector_hits": sum(1 for score, _ in vector_ranked[:top_k] if score > 0),
                "graph_hits": len(mentioned),
                "keyword_hits": len(keyword_ranked[:top_k]),
            },
        }

    @staticmethod
    def _unsupported() -> dict:
        return {
            "answer": "Not found in corpus. Upload a relevant document and try again.",
            "citations": [], "confidence": 0.05,
            "confidence_reason": "No sufficiently relevant indexed evidence was retrieved.",
            "related_entities": [], "intent": "knowledge_search",
            "retrieval_debug": {"vector_hits": 0, "graph_hits": 0, "keyword_hits": 0},
        }
