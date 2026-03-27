import asyncio
import random
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List, Optional


@dataclass
class Pipeline:
    id: str
    name: str
    description: str
    stages: List[str]
    failure_rate: float
    min_duration: int
    max_duration: int
    interval: int
    status: str = "idle"
    current_stage: Optional[str] = None
    last_run: Optional[str] = None
    error_message: Optional[str] = None
    run_count: int = 0
    fail_count: int = 0

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "stages": self.stages,
            "status": self.status,
            "current_stage": self.current_stage,
            "last_run": self.last_run,
            "error_message": self.error_message,
            "run_count": self.run_count,
            "fail_count": self.fail_count,
        }


async def run_pipeline(pipeline, on_update=None):
    pipeline.status = "running"
    pipeline.error_message = None
    pipeline.run_count += 1
    pipeline.last_run = datetime.now(timezone.utc).isoformat()

    total_duration = random.uniform(pipeline.min_duration, pipeline.max_duration)
    stage_duration = total_duration / len(pipeline.stages)

    for stage in pipeline.stages:
        pipeline.current_stage = stage
        if on_update:
            await on_update(pipeline)

        await asyncio.sleep(stage_duration)

        if random.random() < pipeline.failure_rate:
            pipeline.status = "failed"
            pipeline.error_message = f"Stage '{stage}' failed: simulated error"
            pipeline.current_stage = None
            pipeline.fail_count += 1
            if on_update:
                await on_update(pipeline)
            return

    pipeline.status = "success"
    pipeline.current_stage = None
    if on_update:
        await on_update(pipeline)
