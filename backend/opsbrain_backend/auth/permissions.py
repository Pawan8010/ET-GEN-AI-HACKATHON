ROLE_PERMISSIONS: dict[str, frozenset[str]] = {
    "operator": frozenset({
        "documents:read", "documents:upload", "search:read", "graph:read",
        "work_orders:create", "assets:read", "rca:read",
    }),
    "manager": frozenset({
        "documents:read", "documents:upload", "documents:manage", "search:read",
        "graph:read", "work_orders:create", "assets:read", "rca:read",
        "reports:generate", "analytics:read",
    }),
    "auditor": frozenset({
        "documents:read", "search:read", "graph:read", "compliance:read",
        "compliance:generate", "audit:read", "reports:generate",
    }),
    "admin": frozenset({"*"}),
}


def permissions_for_roles(roles: set[str] | frozenset[str]) -> frozenset[str]:
    combined: set[str] = set()
    for role in roles:
        combined.update(ROLE_PERMISSIONS.get(role, frozenset()))
    return frozenset(combined)
