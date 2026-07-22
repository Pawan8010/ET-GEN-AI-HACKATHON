from fastapi import APIRouter, HTTPException, Request


router = APIRouter(prefix="/graph", tags=["knowledge-graph"])


def entity_node(name: str) -> dict:
    return {"id": f"equip:{name}", "attrs": {"entity_type": "Equipment", "canonical_name": name}}


@router.get("/equipment")
async def equipment(request: Request) -> list[str]:
    return sorted(request.app.state.corpus.entities)


@router.get("/search")
async def search_graph(request: Request, q: str = "") -> list[dict]:
    query = q.lower().strip()
    nodes = [entity_node(name) for name in request.app.state.corpus.entities if query in name.lower()]
    for document in request.app.state.corpus.documents.values():
        if query in document.filename.lower():
            nodes.append({"id": f"doc:{document.id}", "attrs": {"entity_type": "Document", "canonical_name": document.filename, "doc_type": document.doc_type}})
    return nodes[:50]


@router.get("/entity/{node_id:path}")
async def entity_neighbors(request: Request, node_id: str, hops: int = 1) -> dict:
    del hops
    name = node_id.removeprefix("equip:")
    document_ids = request.app.state.corpus.entities.get(name)
    if document_ids is None:
        raise HTTPException(404, detail={"code": "entity_not_found"})
    nodes = [entity_node(name)]
    edges = []
    for document_id in sorted(document_ids):
        document = request.app.state.corpus.documents[document_id]
        doc_node = {"id": f"doc:{document.id}", "attrs": {"entity_type": "Document", "canonical_name": document.filename, "doc_type": document.doc_type}}
        nodes.append(doc_node)
        edges.append({"source": doc_node["id"], "target": f"equip:{name}", "rel_type": "MENTIONS", "attrs": {"source": "ingestion"}})
    return {"nodes": nodes, "edges": edges}
