from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from monitoring.server_metrics import MetricsHistory
from pipelines.registry import PipelineRegistry
from agent.alerts import AlertStore
from ws_manager import ConnectionManager
from scheduler import setup_scheduler
from routes import pipelines as pipelines_route
from routes import metrics as metrics_route
from routes import alerts as alerts_route
from routes import chat as chat_route

# Shared state
registry = PipelineRegistry()
metrics_history = MetricsHistory()
alert_store = AlertStore()
ws_manager = ConnectionManager()

# Wire routes to shared state
pipelines_route.init(registry)
metrics_route.init(metrics_history)
alerts_route.init(alert_store)
chat_route.init(metrics_history, registry, alert_store)


@asynccontextmanager
async def lifespan(app: FastAPI):
    sched = setup_scheduler(registry, metrics_history, alert_store, ws_manager)
    sched.start()
    yield
    sched.shutdown()


app = FastAPI(title="ServerMind", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pipelines_route.router)
app.include_router(metrics_route.router)
app.include_router(alerts_route.router)
app.include_router(chat_route.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "agent": "ServerMind"}


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws_manager.connect(ws)
    try:
        while True:
            await ws.receive_text()  # keep alive
    except WebSocketDisconnect:
        ws_manager.disconnect(ws)
