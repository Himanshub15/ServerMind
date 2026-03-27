# ServerMind — Server-Resident AI Monitoring Agent

A real-time server monitoring dashboard with an htop-style process viewer, simulated ETL pipelines, anomaly detection, and an AI-powered chat agent. Built with FastAPI + React.

---

## One-Command Setup

```bash
git clone https://github.com/Himanshub15/ServerMind.git
cd ServerMind
./setup.sh
```

The interactive installer walks you through everything:

```
  [1/4] Checking your system...
        done Python 3.12.4
        done Node.js v20.11.0

  [2/4] Quick configuration...

  Backend port [8000]:
  Frontend port [5173]:

  AI Features (optional — powers alert summaries & chat)
  Get a free key at: https://build.nvidia.com

  NVIDIA API key [skip]:

  [3/4] Installing dependencies...
        done Python packages installed
        done Frontend packages installed

  [4/4] Finalizing...
        done Configuration saved
```

Then start it:

```bash
./start.sh
```

Dashboard at `http://localhost:5173`. Press `Ctrl+C` to stop.

### Prerequisites

Only two things need to be on your system:

| Requirement | Install |
|---|---|
| **Python 3.9+** | `brew install python3` / `sudo apt install python3 python3-venv python3-pip` |
| **Node.js 18+** | `brew install node` / `sudo apt install nodejs` |

Everything else (pip packages, npm modules, venv) is handled automatically.

---

## What It Does

### Live System Metrics
- **CPU, memory, disk** — real-time circular gauges updated every 5 seconds
- **Per-core CPU bars** — vertical bar chart for every core, color-coded by load
- **Network I/O** — bytes sent and received
- **Load averages & swap** — 1/5/15 min load, swap usage
- **Uptime & process count** — at a glance

### htop-Style Process Monitor
- **Top 50 processes** with PID, user, name, CPU%, memory%, memory MB, status
- **Sortable columns** — click any header to sort ascending/descending
- **Live search** — filter by process name, user, or PID
- **Auto-refresh** every 5 seconds with pause/resume toggle
- **Visual CPU & memory bars** in each row, color-coded (green → yellow → red)
- **Per-core CPU chart** — vertical bars for each core above the process table
- **Top 3 consumers** shown at a glance

### 5 Simulated ETL Pipelines

| Pipeline | Failure Rate | Duration |
|----------|:---:|---|
| User Activity ETL | 10% | 10-20s |
| Payment Reconciliation | 25% | 15-30s |
| Inventory Sync | 15% | 8-15s |
| Clickstream Analytics | 5% | 20-40s |
| Email Campaign ETL | 30% | 5-12s |

- Pipelines auto-trigger every ~90 seconds
- Each runs through staged execution (extract → transform → load)
- Manual trigger via the UI
- Real-time status updates via WebSocket

### Anomaly Detection & Alerts
- **Rule-based checks** — CPU > 85%, memory > 85%, disk > 90%
- **Critical thresholds** — CPU > 95%, memory > 95%, disk > 98%
- **Pipeline failure alerts** — immediate alert when any pipeline fails
- **60-second dedup window** — no duplicate alert spam
- **Dismiss alerts** from the feed

### AI-Powered Agent (Optional)
- **Alert summaries** — AI generates 1-2 sentence explanations for each alert
- **Chat interface** — floating panel to ask questions about system health
- **Full system context** — AI sees current metrics, pipeline states, and recent alerts
- Uses NVIDIA's free LLM API (`nvidia/llama-3.1-nemotron-ultra-253b-v1`)
- **Works fully without an API key** — all monitoring features run standalone

### Real-Time Dashboard
- **WebSocket streaming** — no polling, instant updates
- **Auto-reconnect** with exponential backoff
- **Dark theme** — designed for server monitoring
- **Responsive** — works on desktop and tablet

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.9+, FastAPI, uvicorn, psutil, APScheduler |
| Frontend | React 19, Vite, TailwindCSS v4, Recharts, Lucide icons |
| AI | OpenAI SDK → NVIDIA API (free tier) |
| Realtime | WebSocket (native FastAPI) |
| Storage | In-memory (no database required) |

---

## Project Structure

```
servermind/
├── setup.sh                      # Interactive one-command installer
├── start.sh                      # Start both servers with one command
├── backend/
│   ├── main.py                   # FastAPI app, CORS, WebSocket, lifespan
│   ├── config.py                 # Settings: API keys, thresholds, pipelines
│   ├── scheduler.py              # APScheduler: metrics, anomaly, pipeline jobs
│   ├── ws_manager.py             # WebSocket connection manager
│   ├── monitoring/
│   │   └── server_metrics.py     # psutil collector, per-core CPU, process list
│   ├── pipelines/
│   │   ├── dummy_pipelines.py    # Pipeline dataclass + async runner
│   │   └── registry.py           # Pipeline registry with trigger/status
│   ├── agent/
│   │   ├── alerts.py             # Alert model + dedup store
│   │   ├── anomaly.py            # Rule-based anomaly detection
│   │   └── ai_agent.py           # NVIDIA LLM: summarize + chat
│   └── routes/
│       ├── pipelines.py          # Pipeline CRUD + trigger
│       ├── metrics.py            # Metrics + process list endpoint
│       ├── alerts.py             # Alert list + dismiss
│       └── chat.py               # AI chat endpoint
├── frontend/
│   ├── vite.config.js            # Proxy config for dev
│   └── src/
│       ├── App.jsx               # Layout, state, WebSocket wiring
│       ├── api.js                # REST client helpers
│       ├── hooks/
│       │   └── useWebSocket.js   # Auto-reconnect WebSocket hook
│       └── components/
│           ├── MetricsPanel.jsx  # Gauges + line chart + stats
│           ├── ProcessTable.jsx  # htop-style sortable process table
│           ├── PipelineCards.jsx # Pipeline cards with trigger
│           ├── AlertFeed.jsx    # Severity-coded alert feed
│           └── ChatPanel.jsx    # Floating AI chat panel
└── .gitignore
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/metrics` | Current system snapshot (CPU, mem, disk, per-core, load avg, swap, top processes) |
| GET | `/api/metrics/history` | Last 60 snapshots (5 min window) |
| GET | `/api/metrics/processes?limit=50` | htop-style process list |
| GET | `/api/pipelines` | All pipeline statuses |
| GET | `/api/pipelines/{id}` | Single pipeline detail |
| POST | `/api/pipelines/{id}/trigger` | Manually trigger a pipeline |
| GET | `/api/alerts?active=true` | List alerts (optionally active-only) |
| POST | `/api/alerts/{id}/dismiss` | Dismiss an alert |
| POST | `/api/chat` | Chat with AI agent `{message: "..."}` → `{reply: "..."}` |
| WS | `/ws` | Real-time: `metrics_update`, `pipeline_update`, `alert_new` |

---

## Configuration

All settings in `backend/config.py`:

| Setting | Default | Description |
|---------|---------|-------------|
| `NVIDIA_API_KEY` | _(empty)_ | From `.env` — enables AI features |
| `NVIDIA_MODEL` | `nvidia/llama-3.1-nemotron-ultra-253b-v1` | Free tier model |
| `METRIC_INTERVAL` | 5s | How often to collect metrics |
| `AGENT_CHECK_INTERVAL` | 15s | How often to check for anomalies |
| `CPU_THRESHOLD` | 85% | Alert threshold for CPU |
| `MEMORY_THRESHOLD` | 85% | Alert threshold for memory |
| `DISK_THRESHOLD` | 90% | Alert threshold for disk |

Custom ports are saved during setup in `.servermind.conf`.

---

## What Works Without an API Key

Everything except AI features:
- Live metrics dashboard with gauges and charts
- htop-style process monitor
- Pipeline cards with real-time status
- Manual pipeline triggering
- Anomaly detection and alert feed
- WebSocket real-time updates

Add your NVIDIA API key to `backend/.env` anytime to enable AI summaries and chat.

---

## Notes

- Python 3.9 compatible (uses `Optional`/`Union`, no `X | Y` syntax)
- All state is in-memory — restarting the backend resets everything
- Frontend proxies API calls through Vite dev server
- No data leaves your machine unless you configure the NVIDIA API key
- Designed to run on the same server you're monitoring

---

## License

MIT
