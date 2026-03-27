const BASE = '';

export async function getPipelines() {
  const r = await fetch(`${BASE}/api/pipelines`);
  return r.json();
}

export async function triggerPipeline(id) {
  const r = await fetch(`${BASE}/api/pipelines/${id}/trigger`, { method: 'POST' });
  return r.json();
}

export async function getMetrics() {
  const r = await fetch(`${BASE}/api/metrics`);
  return r.json();
}

export async function getMetricsHistory() {
  const r = await fetch(`${BASE}/api/metrics/history`);
  return r.json();
}

export async function getAlerts(active = false) {
  const r = await fetch(`${BASE}/api/alerts?active=${active}`);
  return r.json();
}

export async function dismissAlert(id) {
  const r = await fetch(`${BASE}/api/alerts/${id}/dismiss`, { method: 'POST' });
  return r.json();
}

export async function getProcesses(limit = 50) {
  const r = await fetch(`${BASE}/api/metrics/processes?limit=${limit}`);
  return r.json();
}

export async function sendChat(message) {
  const r = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  return r.json();
}
