from opsbrain_backend.auth import firebase


def test_firebase_user_defaults_to_configured_single_tenant(monkeypatch):
    monkeypatch.setenv("OPSBRAIN_FIREBASE_PROJECT_ID", "resume-feab6")
    monkeypatch.setattr(firebase.firebase_admin, "get_app", lambda: object())
    monkeypatch.setattr(firebase.auth, "verify_id_token", lambda token, check_revoked: {
        "uid": "firebase-user-1",
        "roles": ["operator"],
    })

    principal = firebase.verify_firebase_token("verified-token")

    assert principal.user_id == "firebase-user-1"
    assert principal.tenant_id == "resume-feab6"
    assert principal.roles == frozenset({"operator"})
    assert principal.is_guest is False
