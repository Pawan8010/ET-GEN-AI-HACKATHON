from collections.abc import Awaitable, Callable

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse


DependencyProbe = Callable[[], Awaitable[bool]]
DEPENDENCY_NAMES = ("database", "redis", "qdrant", "neo4j", "object_store")

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready")
async def readiness(request: Request) -> JSONResponse:
    probes: dict[str, DependencyProbe] = getattr(request.app.state, "dependency_probes", {})
    states: dict[str, bool] = {}
    for name in DEPENDENCY_NAMES:
        probe = probes.get(name)
        try:
            states[name] = bool(await probe()) if probe else False
        except Exception:
            states[name] = False
    ready = all(states.values())
    return JSONResponse(
        status_code=200 if ready else 503,
        content={"status": "ready" if ready else "not_ready", "dependencies": states},
    )
