import os
from dotenv import load_dotenv

load_dotenv()

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
NVIDIA_MODEL = "nvidia/llama-3.1-nemotron-ultra-253b-v1"

BACKEND_PORT = int(os.getenv("BACKEND_PORT", "8000"))

METRIC_INTERVAL = 5          # seconds between metric collections
AGENT_CHECK_INTERVAL = 15    # seconds between anomaly checks
METRICS_HISTORY_SIZE = 60    # keep last 60 snapshots (5 min at 5s)

CPU_THRESHOLD = 85
MEMORY_THRESHOLD = 85
DISK_THRESHOLD = 90

PIPELINE_DEFINITIONS = [
    {
        "id": "user-activity-etl",
        "name": "User Activity ETL",
        "description": "Extract user logs, transform to events, load to warehouse",
        "stages": ["extract_logs", "transform_events", "load_warehouse"],
        "failure_rate": 0.10,
        "min_duration": 10,
        "max_duration": 20,
        "interval": 60,
    },
    {
        "id": "payment-reconciliation",
        "name": "Payment Reconciliation",
        "description": "Extract transactions, validate amounts, load reconciliation",
        "stages": ["extract_transactions", "validate_amounts", "load_reconciliation"],
        "failure_rate": 0.25,
        "min_duration": 15,
        "max_duration": 30,
        "interval": 75,
    },
    {
        "id": "inventory-sync",
        "name": "Inventory Sync",
        "description": "Extract inventory API, transform stock levels, load to DB",
        "stages": ["extract_inventory", "transform_stock", "load_db"],
        "failure_rate": 0.15,
        "min_duration": 8,
        "max_duration": 15,
        "interval": 90,
    },
    {
        "id": "clickstream-analytics",
        "name": "Clickstream Analytics",
        "description": "Extract clickstream, sessionize, load to analytics",
        "stages": ["extract_clickstream", "sessionize", "load_analytics"],
        "failure_rate": 0.05,
        "min_duration": 20,
        "max_duration": 40,
        "interval": 100,
    },
    {
        "id": "email-campaign-etl",
        "name": "Email Campaign ETL",
        "description": "Extract campaign data, enrich with user profiles, load reports",
        "stages": ["extract_campaigns", "enrich_profiles", "load_reports"],
        "failure_rate": 0.30,
        "min_duration": 5,
        "max_duration": 12,
        "interval": 65,
    },
]
