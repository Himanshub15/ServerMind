from agent.alerts import Alert
from config import CPU_THRESHOLD, MEMORY_THRESHOLD, DISK_THRESHOLD


def check_metrics(snapshot):
    alerts = []

    cpu = snapshot.get("cpu_percent", 0)
    if cpu >= CPU_THRESHOLD:
        alerts.append(Alert(
            severity="critical" if cpu >= 95 else "warning",
            category="cpu",
            title=f"High CPU usage: {cpu}%",
            message=f"CPU usage is at {cpu}%, exceeding threshold of {CPU_THRESHOLD}%.",
        ))

    mem = snapshot.get("memory_percent", 0)
    if mem >= MEMORY_THRESHOLD:
        alerts.append(Alert(
            severity="critical" if mem >= 95 else "warning",
            category="memory",
            title=f"High memory usage: {mem}%",
            message=f"Memory usage is at {mem}%, exceeding threshold of {MEMORY_THRESHOLD}%.",
        ))

    disk = snapshot.get("disk_percent", 0)
    if disk >= DISK_THRESHOLD:
        alerts.append(Alert(
            severity="critical" if disk >= 98 else "warning",
            category="disk",
            title=f"High disk usage: {disk}%",
            message=f"Disk usage is at {disk}%, exceeding threshold of {DISK_THRESHOLD}%.",
        ))

    return alerts


def check_pipelines(pipelines):
    alerts = []
    for p in pipelines:
        if p["status"] == "failed":
            alerts.append(Alert(
                severity="critical",
                category="pipeline",
                title=f"Pipeline failed: {p['name']}",
                message=p.get("error_message") or f"Pipeline '{p['name']}' failed.",
            ))
    return alerts


def detect_anomalies(metrics, pipelines):
    return check_metrics(metrics) + check_pipelines(pipelines)
