import json


def test_sse_packet_contains_id_type_and_json_data():
    from opsbrain_backend.api.events import encode_sse
    from opsbrain_backend.realtime.events import DomainEvent

    packet = encode_sse(DomainEvent(tenant_id="demo", type="indexed", data={"ok": True}, id=7))
    assert packet == f'id: 7\nevent: indexed\ndata: {json.dumps({"ok": True}, separators=(",", ":"))}\n\n'
