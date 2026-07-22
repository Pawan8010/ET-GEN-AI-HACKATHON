import asyncio
from collections import defaultdict, deque
from collections.abc import AsyncIterator
from dataclasses import replace

from .events import DomainEvent


class MemoryEventBus:
    """Bounded, tenant-isolated event bus for tests and reduced local mode."""

    def __init__(self, retention: int = 1000):
        if retention < 1:
            raise ValueError("retention must be positive")
        self._events: dict[str, deque[DomainEvent]] = defaultdict(
            lambda: deque(maxlen=retention)
        )
        self._sequence = 0
        self._condition = asyncio.Condition()

    async def publish(self, event: DomainEvent) -> DomainEvent:
        async with self._condition:
            self._sequence += 1
            published = replace(event, id=self._sequence)
            self._events[event.tenant_id].append(published)
            self._condition.notify_all()
            return published

    async def replay(
        self, tenant_id: str, after_id: int | None = None
    ) -> AsyncIterator[DomainEvent]:
        cursor = after_id or 0
        for event in tuple(self._events.get(tenant_id, ())):
            if event.id > cursor:
                yield event

    async def subscribe(
        self, tenant_id: str, after_id: int | None = None
    ) -> AsyncIterator[DomainEvent]:
        cursor = after_id or 0
        while True:
            emitted = False
            for event in tuple(self._events.get(tenant_id, ())):
                if event.id > cursor:
                    cursor = event.id
                    emitted = True
                    yield event
            if not emitted:
                async with self._condition:
                    await self._condition.wait()
