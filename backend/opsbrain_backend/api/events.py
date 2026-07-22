import asyncio
import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from ..realtime.events import DomainEvent
from ..auth.firebase import verify_firebase_token


router = APIRouter(tags=["realtime"])


def encode_sse(event: DomainEvent) -> str:
    payload = json.dumps(event.data, separators=(",", ":"))
    return f"id: {event.id}\nevent: {event.type}\ndata: {payload}\n\n"


def resolve_tenant(request: Request, access_token: str | None) -> str:
    if access_token:
        try:
            return verify_firebase_token(access_token).tenant_id
        except Exception as error:
            raise HTTPException(401, detail={"code": "invalid_token"}) from error
    if request.app.state.settings.environment == "development":
        return "demo"
    raise HTTPException(401, detail={"code": "authentication_required"})


async def stream_events(request: Request, tenant_id: str, after_id: int) -> AsyncIterator[str]:
    subscription = request.app.state.event_bus.subscribe(tenant_id, after_id)
    while not await request.is_disconnected():
        try:
            event = await asyncio.wait_for(anext(subscription), timeout=20)
            yield encode_sse(event)
        except TimeoutError:
            yield ": heartbeat\n\n"


@router.get("/events")
async def events(request: Request, access_token: str | None = None) -> StreamingResponse:
    tenant_id = resolve_tenant(request, access_token)
    after_id = int(request.headers.get("last-event-id", "0"))
    return StreamingResponse(stream_events(request, tenant_id, after_id), media_type="text/event-stream")


@router.get("/documents/{document_id}/stream")
async def document_events(
    request: Request, document_id: str, access_token: str | None = None
) -> StreamingResponse:
    tenant_id = resolve_tenant(request, access_token)

    async def filtered() -> AsyncIterator[str]:
        async for packet in stream_events(request, tenant_id, 0):
            if packet.startswith(":") or f'"document_id":"{document_id}"' in packet:
                yield packet

    return StreamingResponse(filtered(), media_type="text/event-stream")
