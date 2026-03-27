import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional


@dataclass
class Alert:
    severity: str
    category: str
    title: str
    message: str
    id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    ai_summary: Optional[str] = None
    dismissed: bool = False

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "severity": self.severity,
            "category": self.category,
            "title": self.title,
            "message": self.message,
            "ai_summary": self.ai_summary,
            "dismissed": self.dismissed,
        }


class AlertStore:
    def __init__(self, max_alerts=200):
        self._alerts = []
        self._max = max_alerts
        self._recent_keys = {}

    def _dedup_key(self, alert):
        return f"{alert.category}:{alert.title}"

    def add(self, alert):
        key = self._dedup_key(alert)
        now = datetime.now(timezone.utc).timestamp()
        if key in self._recent_keys and (now - self._recent_keys[key]) < 60:
            return None
        self._recent_keys[key] = now
        self._alerts.insert(0, alert)
        if len(self._alerts) > self._max:
            self._alerts = self._alerts[:self._max]
        return alert

    def get_recent(self, n=50):
        return [a.to_dict() for a in self._alerts[:n]]

    def get_active(self):
        return [a.to_dict() for a in self._alerts if not a.dismissed]

    def dismiss(self, alert_id):
        for a in self._alerts:
            if a.id == alert_id:
                a.dismissed = True
                return True
        return False

    def find(self, alert_id):
        for a in self._alerts:
            if a.id == alert_id:
                return a
        return None
