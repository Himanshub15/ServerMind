from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

_alert_store = None


def init(alert_store):
    global _alert_store
    _alert_store = alert_store


@router.get("")
async def list_alerts(active: bool = Query(False)):
    if active:
        return _alert_store.get_active()
    return _alert_store.get_recent()


@router.post("/{alert_id}/dismiss")
async def dismiss_alert(alert_id: str):
    ok = _alert_store.dismiss(alert_id)
    if not ok:
        raise HTTPException(404, "Alert not found")
    return {"status": "dismissed"}
