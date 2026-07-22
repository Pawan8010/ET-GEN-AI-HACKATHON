import hashlib
import math
import re


def terms(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+(?:[-_.][a-z0-9]+)*", text.lower())


class LocalHashEmbedding:
    """Deterministic feature-hashing embedding for credential-free local retrieval."""

    name = "local-feature-hash-v1"

    def __init__(self, dimension: int = 384):
        self.dimension = dimension

    async def embed(self, texts: list[str]) -> list[list[float]]:
        return [self._one(text) for text in texts]

    def _one(self, text: str) -> list[float]:
        vector = [0.0] * self.dimension
        tokens = terms(text)
        features = tokens + [f"{a}:{b}" for a, b in zip(tokens, tokens[1:])]
        for feature in features:
            digest = hashlib.blake2b(feature.encode(), digest_size=8).digest()
            value = int.from_bytes(digest, "big")
            vector[value % self.dimension] += -1.0 if value & 1 else 1.0
        norm = math.sqrt(sum(value * value for value in vector)) or 1.0
        return [value / norm for value in vector]


def cosine(left: list[float], right: list[float]) -> float:
    return sum(a * b for a, b in zip(left, right))
