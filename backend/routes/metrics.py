from fastapi import APIRouter, Query

from monitoring.server_metrics import collect_processes

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

_metrics_history = None


def init(metrics_history):
    global _metrics_history
    _metrics_history = metrics_history


@router.get("")
async def current_metrics():
    latest = _metrics_history.latest()
    return latest or {}


@router.get("/history")
async def metrics_history():
    return _metrics_history.get_all()


@router.get("/processes")
async def process_list(limit: int = Query(50, ge=1, le=200)):
    """htop-style process list — returns top N processes by CPU usage."""
    return collect_processes(limit)
