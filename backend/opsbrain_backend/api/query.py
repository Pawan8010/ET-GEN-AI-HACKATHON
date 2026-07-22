from fastapi import APIRouter, Request
from pydantic import BaseModel, Field


router = APIRouter(tags=["rag"])


class QueryRequest(BaseModel):
    query_text: str = Field(min_length=1, max_length=4000)


@router.post("/query")
async def query(request: Request, payload: QueryRequest) -> dict:
    return await request.app.state.rag.query(payload.query_text)


class SummarizeRequest(BaseModel):
    messages: list[dict]


@router.post("/query/summarize-session")
async def summarize_session(payload: SummarizeRequest) -> dict:
    statements = []
    for message in payload.messages[-20:]:
        text = message.get("text") or message.get("response", {}).get("answer")
        if text:
            statements.append(str(text).strip())
    return {"summary": "\n".join(statements)[:2000] or "No conversation content."}
