from fastapi import APIRouter

from ..auth.dependencies import PrincipalDependency


router = APIRouter(prefix="/auth", tags=["authentication"])


@router.get("/me")
async def current_identity(principal: PrincipalDependency) -> dict:
    return {
        "user_id": principal.user_id,
        "tenant_id": principal.tenant_id,
        "roles": sorted(principal.roles),
        "permissions": sorted(principal.permissions),
        "is_guest": principal.is_guest,
    }
