import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from monitoring.server_metrics import collect_metrics, MetricsHistory
from pipelines.registry import PipelineRegistry
from agent.alerts import AlertStore
from agent.anomaly import detect_anomalies
from agent.ai_agent import summarize_alert
from ws_manager import ConnectionManager


def setup_scheduler(
    registry: PipelineRegistry,
    metrics_history: MetricsHistory,
    alert_store: AlertStore,
    ws: ConnectionManager,
) -> AsyncIOScheduler:

    scheduler = AsyncIOScheduler()

    async def collect_and_broadcast():
        snapshot = collect_metrics()
        metrics_history.add(snapshot)
        await ws.broadcast("metrics_update", snapshot)

    async def agent_check():
        latest = metrics_history.latest()
        if not latest:
            return
        pipelines = registry.get_all()
        new_alerts = detect_anomalies(latest, pipelines)
        for alert in new_alerts:
            added = alert_store.add(alert)
            if added:
                try:
                    summary = await summarize_alert(added.to_dict(), latest, pipelines)
                    added.ai_summary = summary
                except Exception:
                    pass
                await ws.broadcast("alert_new", added.to_dict())

    async def pipeline_update_callback(pipeline):
        await ws.broadcast("pipeline_update", pipeline.to_dict())

    registry.set_on_update(pipeline_update_callback)

    async def trigger_pipelines():
        for pid, p in registry.pipelines.items():
            if p.status != "running":
                registry.trigger(pid)
                await asyncio.sleep(2)  # stagger starts

    from config import METRIC_INTERVAL, AGENT_CHECK_INTERVAL
    scheduler.add_job(collect_and_broadcast, "interval", seconds=METRIC_INTERVAL, id="metrics")
    scheduler.add_job(agent_check, "interval", seconds=AGENT_CHECK_INTERVAL, id="agent_check")
    scheduler.add_job(trigger_pipelines, "interval", seconds=90, id="pipeline_trigger")

    return scheduler
