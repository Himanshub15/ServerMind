from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/pipelines", tags=["pipelines"])

# These get set by main.py on startup
_registry = None


def init(registry):
    global _registry
    _registry = registry


@router.get("")
async def list_pipelines():
    return _registry.get_all()


@router.get("/{pipeline_id}")
async def get_pipeline(pipeline_id: str):
    p = _registry.get(pipeline_id)
    if not p:
        raise HTTPException(404, "Pipeline not found")
    return p.to_dict()


@router.post("/{pipeline_id}/trigger")
async def trigger_pipeline(pipeline_id: str):
    ok = _registry.trigger(pipeline_id)
    if not ok:
        raise HTTPException(400, "Pipeline not found or already running")
    return {"status": "triggered"}
