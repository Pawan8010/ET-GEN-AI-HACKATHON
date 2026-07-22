from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Principal:
    user_id: str
    tenant_id: str
    roles: frozenset[str]
    permissions: frozenset[str]
    is_guest: bool = False
