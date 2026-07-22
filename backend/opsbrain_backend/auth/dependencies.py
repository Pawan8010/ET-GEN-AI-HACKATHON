from typing import Annotated

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .firebase import verify_firebase_token
from .models import Principal


bearer = HTTPBearer(auto_error=False)


async def get_principal(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> Principal:
    if not credentials:
        raise HTTPException(401, detail={"code": "authentication_required"})
    token = credentials.credentials
    try:
        return verify_firebase_token(token)
    except Exception as error:
        raise HTTPException(401, detail={"code": "invalid_token"}) from error


async def enforce_permission(principal: Principal, permission: str) -> Principal:
    if "*" not in principal.permissions and permission not in principal.permissions:
        raise HTTPException(403, detail={"code": "permission_denied"})
    return principal


def require_permission(permission: str):
    async def dependency(principal: Annotated[Principal, Depends(get_principal)]) -> Principal:
        return await enforce_permission(principal, permission)

    return dependency


PrincipalDependency = Annotated[Principal, Depends(get_principal)]
