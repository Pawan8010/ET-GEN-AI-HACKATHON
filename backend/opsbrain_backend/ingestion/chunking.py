import hashlib
import re
from dataclasses import dataclass, replace
from uuid import NAMESPACE_URL, uuid5


@dataclass(frozen=True, slots=True)
class IndexedChunk:
    id: str
    document_id: str
    content: str
    content_hash: str
    chunk_index: int
    heading: str | None
    section: str | None
    page_number: int | None = None
    parent_chunk_id: str | None = None
    previous_chunk_id: str | None = None
    next_chunk_id: str | None = None
    confidence: float = 1.0


class SectionAwareChunker:
    def __init__(self, max_chars: int = 1800, overlap_chars: int | None = None):
        overlap_chars = min(180, max_chars // 10) if overlap_chars is None else overlap_chars
        if max_chars < 40:
            raise ValueError("max_chars must be at least 40")
        if overlap_chars < 0 or overlap_chars >= max_chars:
            raise ValueError("overlap_chars must be between zero and max_chars")
        self.max_chars = max_chars
        self.overlap_chars = overlap_chars

    def chunk(self, document_id: str, text: str) -> list[IndexedChunk]:
        normalized = text.replace("\r\n", "\n").replace("\r", "\n").strip()
        if not normalized:
            return []
        sections = self._sections(normalized)
        raw: list[tuple[str | None, str]] = []
        for heading, body in sections:
            raw.extend((heading, part) for part in self._split_body(body))
        chunks: list[IndexedChunk] = []
        for index, (heading, content) in enumerate(raw):
            digest = hashlib.sha256(content.encode("utf-8")).hexdigest()
            stable_id = str(uuid5(NAMESPACE_URL, f"opsbrain:{document_id}:{index}:{digest}"))
            chunks.append(IndexedChunk(
                id=stable_id, document_id=document_id, content=content,
                content_hash=digest, chunk_index=index, heading=heading, section=heading,
            ))
        return [replace(
            chunk,
            previous_chunk_id=chunks[index - 1].id if index else None,
            next_chunk_id=chunks[index + 1].id if index + 1 < len(chunks) else None,
        ) for index, chunk in enumerate(chunks)]

    @staticmethod
    def _sections(text: str) -> list[tuple[str | None, str]]:
        sections: list[tuple[str | None, str]] = []
        heading: str | None = None
        buffer: list[str] = []
        for line in text.splitlines():
            match = re.match(r"^\s{0,3}#{1,6}\s+(.+?)\s*$", line)
            if match:
                if buffer:
                    sections.append((heading, "\n".join(buffer).strip()))
                heading, buffer = match.group(1).strip(), []
            else:
                buffer.append(line)
        if buffer or not sections:
            sections.append((heading, "\n".join(buffer).strip()))
        return [(title, body) for title, body in sections if body]

    def _split_body(self, body: str) -> list[str]:
        paragraphs = [part.strip() for part in re.split(r"\n\s*\n", body) if part.strip()]
        parts: list[str] = []
        current = ""
        for paragraph in paragraphs:
            sentences = re.split(r"(?<=[.!?])\s+", paragraph)
            for sentence in sentences:
                if len(sentence) > self.max_chars:
                    windows = self._windows(sentence)
                else:
                    windows = [sentence]
                for window in windows:
                    candidate = f"{current} {window}".strip()
                    if current and len(candidate) > self.max_chars:
                        parts.append(current)
                        prefix = current[-self.overlap_chars:] if self.overlap_chars else ""
                        current = f"{prefix} {window}".strip()
                    else:
                        current = candidate
        if current:
            parts.append(current)
        return parts

    def _windows(self, text: str) -> list[str]:
        step = self.max_chars - self.overlap_chars
        return [text[start:start + self.max_chars].strip() for start in range(0, len(text), step)]
