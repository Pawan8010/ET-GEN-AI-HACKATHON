import pytest
from fastapi import HTTPException


def test_operator_permission_set_excludes_admin_actions():
    from opsbrain_backend.auth.permissions import permissions_for_roles

    permissions = permissions_for_roles({"operator"})
    assert "documents:upload" in permissions
    assert "users:manage" not in permissions


def test_unknown_role_has_no_permissions():
    from opsbrain_backend.auth.permissions import permissions_for_roles

    permissions = permissions_for_roles({"unknown"})
    assert permissions == frozenset()


@pytest.mark.asyncio
async def test_permission_guard_rejects_missing_permission():
    from opsbrain_backend.auth.dependencies import Principal, enforce_permission

    principal = Principal(
        user_id="operator-1", tenant_id="demo", roles=frozenset({"operator"}),
        permissions=frozenset({"documents:read"}), is_guest=True,
    )
    with pytest.raises(HTTPException) as exc:
        await enforce_permission(principal, "documents:upload")
    assert exc.value.status_code == 403
