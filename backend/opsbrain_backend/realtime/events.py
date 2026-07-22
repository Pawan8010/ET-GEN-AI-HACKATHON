from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass(frozen=True, slots=True)
class DomainEvent:
    tenant_id: str
    type: str
    data: dict
    id: int = 0
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
