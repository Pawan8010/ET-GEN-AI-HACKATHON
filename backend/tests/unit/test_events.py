import pytest


@pytest.mark.asyncio
async def test_memory_bus_replays_events_after_cursor():
    from opsbrain_backend.realtime.events import DomainEvent
    from opsbrain_backend.realtime.bus import MemoryEventBus

    bus = MemoryEventBus(retention=10)
    first = await bus.publish(DomainEvent(tenant_id="a", type="indexed", data={"n": 1}))
    await bus.publish(DomainEvent(tenant_id="a", type="indexed", data={"n": 2}))
    replay = [event async for event in bus.replay("a", after_id=first.id)]
    assert [event.data["n"] for event in replay] == [2]


@pytest.mark.asyncio
async def test_bus_never_replays_another_tenants_events():
    from opsbrain_backend.realtime.events import DomainEvent
    from opsbrain_backend.realtime.bus import MemoryEventBus

    bus = MemoryEventBus(retention=10)
    await bus.publish(DomainEvent(tenant_id="b", type="indexed", data={}))
    assert [event async for event in bus.replay("a")] == []


@pytest.mark.asyncio
async def test_retention_is_bounded():
    from opsbrain_backend.realtime.events import DomainEvent
    from opsbrain_backend.realtime.bus import MemoryEventBus

    bus = MemoryEventBus(retention=2)
    for n in range(3):
        await bus.publish(DomainEvent(tenant_id="a", type="progress", data={"n": n}))
    assert [event.data["n"] async for event in bus.replay("a")] == [1, 2]
