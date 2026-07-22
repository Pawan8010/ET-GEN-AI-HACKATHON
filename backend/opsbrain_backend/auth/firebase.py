import os

import firebase_admin
from firebase_admin import auth

from .models import Principal
from .permissions import permissions_for_roles


def verify_firebase_token(token: str) -> Principal:
    project_id = os.getenv("OPSBRAIN_FIREBASE_PROJECT_ID", "resume-feab6")
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(options={"projectId": project_id})
    claims = auth.verify_id_token(token, check_revoked=True)
    roles = frozenset(claims.get("roles", ["operator"]))
    tenant_id = claims.get("tenant_id") or project_id
    return Principal(
        user_id=claims["uid"], tenant_id=tenant_id, roles=roles,
        permissions=permissions_for_roles(roles), is_guest=False,
    )
