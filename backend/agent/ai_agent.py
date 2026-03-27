import json
from typing import Optional, List
from openai import AsyncOpenAI
from config import NVIDIA_API_KEY, NVIDIA_BASE_URL, NVIDIA_MODEL

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = AsyncOpenAI(base_url=NVIDIA_BASE_URL, api_key=NVIDIA_API_KEY)
    return _client


def _build_system_context(metrics=None, pipelines=None, alerts=None):
    parts = [
        "You are ServerMind, an AI server monitoring agent. You observe ETL pipelines and server metrics.",
        "Respond concisely and helpfully. Use data provided to answer questions about system health.",
    ]
    if metrics:
        parts.append(f"\n## Current Server Metrics\n```json\n{json.dumps(metrics, indent=2)}\n```")
    if pipelines:
        parts.append(f"\n## Pipeline Statuses\n```json\n{json.dumps(pipelines, indent=2)}\n```")
    if alerts:
        parts.append(f"\n## Recent Alerts\n```json\n{json.dumps(alerts[:10], indent=2)}\n```")
    return "\n".join(parts)


async def summarize_alert(alert_dict, metrics=None, pipelines=None):
    if not NVIDIA_API_KEY:
        return "AI summary unavailable (no API key configured)."
    try:
        client = _get_client()
        resp = await client.chat.completions.create(
            model=NVIDIA_MODEL,
            messages=[
                {"role": "system", "content": "You are ServerMind. Summarize this alert in 1-2 sentences. Explain what happened and possible causes."},
                {"role": "user", "content": json.dumps(alert_dict)},
            ],
            max_tokens=150,
            temperature=0.3,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        return f"AI summary failed: {e}"


async def chat(message, metrics=None, pipelines=None, alerts=None):
    if not NVIDIA_API_KEY:
        return "I'm ServerMind, but my AI brain isn't connected yet. Set the NVIDIA_API_KEY environment variable to enable AI responses."
    try:
        client = _get_client()
        system = _build_system_context(metrics, pipelines, alerts)
        resp = await client.chat.completions.create(
            model=NVIDIA_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": message},
            ],
            max_tokens=500,
            temperature=0.5,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        return f"Sorry, I encountered an error: {e}"
