from fastapi import APIRouter
from pydantic import BaseModel

from agent.ai_agent import chat

router = APIRouter(prefix="/api/chat", tags=["chat"])

_metrics_history = None
_registry = None
_alert_store = None


def init(metrics_history, registry, alert_store):
    global _metrics_history, _registry, _alert_store
    _metrics_history = metrics_history
    _registry = registry
    _alert_store = alert_store


class ChatRequest(BaseModel):
    message: str


@router.post("")
async def chat_endpoint(req: ChatRequest):
    metrics = _metrics_history.latest()
    pipelines = _registry.get_all()
    alerts = _alert_store.get_recent(10)
    reply = await chat(req.message, metrics=metrics, pipelines=pipelines, alerts=alerts)
    return {"reply": reply}
