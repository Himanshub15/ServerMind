import time
from collections import deque
from datetime import datetime, timezone
from typing import Optional, List, Dict

import psutil


def _gather_processes(limit=20):
    """Gather top processes sorted by CPU usage."""
    procs = []
    for p in psutil.process_iter(["pid", "name", "username", "cpu_percent",
                                   "memory_percent", "memory_info", "status"]):
        try:
            info = p.info
            procs.append({
                "pid": info["pid"],
                "name": info["name"] or "",
                "user": info.get("username") or "",
                "cpu_percent": round(info.get("cpu_percent") or 0, 1),
                "memory_percent": round(info.get("memory_percent") or 0, 1),
                "memory_mb": round((info.get("memory_info").rss if info.get("memory_info") else 0) / (1024 ** 2), 1),
                "status": info.get("status") or "",
            })
        except (psutil.AccessDenied, psutil.NoSuchProcess, psutil.ZombieProcess):
            continue
    procs.sort(key=lambda x: x["cpu_percent"], reverse=True)
    return procs[:limit]


def collect_processes(limit=50):
    # type: (int) -> List[Dict]
    """Full process list for the htop-style endpoint."""
    return _gather_processes(limit)


def collect_metrics():
    cpu = psutil.cpu_percent(interval=1)
    per_cpu = psutil.cpu_percent(interval=0, percpu=True)
    mem = psutil.virtual_memory()
    swap = psutil.swap_memory()
    disk = psutil.disk_usage("/")
    net = psutil.net_io_counters()
    boot = psutil.boot_time()
    uptime = time.time() - boot
    load_avg = list(psutil.getloadavg()) if hasattr(psutil, "getloadavg") else []

    top_procs = _gather_processes(20)

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "cpu_percent": cpu,
        "cpu_per_core": per_cpu,
        "cpu_count": psutil.cpu_count(),
        "load_avg": load_avg,
        "memory_percent": mem.percent,
        "memory_used_gb": round(mem.used / (1024 ** 3), 2),
        "memory_total_gb": round(mem.total / (1024 ** 3), 2),
        "swap_percent": swap.percent,
        "swap_used_gb": round(swap.used / (1024 ** 3), 2),
        "swap_total_gb": round(swap.total / (1024 ** 3), 2),
        "disk_percent": disk.percent,
        "disk_used_gb": round(disk.used / (1024 ** 3), 2),
        "disk_total_gb": round(disk.total / (1024 ** 3), 2),
        "net_bytes_sent": net.bytes_sent,
        "net_bytes_recv": net.bytes_recv,
        "process_count": len(psutil.pids()),
        "uptime_seconds": int(uptime),
        "top_processes": top_procs,
    }


class MetricsHistory:
    def __init__(self, maxlen=60):
        self._history = deque(maxlen=maxlen)

    def add(self, snapshot):
        self._history.append(snapshot)

    def get_all(self):
        return list(self._history)

    def latest(self):
        return self._history[-1] if self._history else None
