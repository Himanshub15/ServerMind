import asyncio

from pipelines.dummy_pipelines import Pipeline, run_pipeline
from config import PIPELINE_DEFINITIONS


class PipelineRegistry:
    def __init__(self):
        self.pipelines = {}
        self._tasks = {}
        self._on_update = None

        for defn in PIPELINE_DEFINITIONS:
            p = Pipeline(
                id=defn["id"],
                name=defn["name"],
                description=defn["description"],
                stages=defn["stages"],
                failure_rate=defn["failure_rate"],
                min_duration=defn["min_duration"],
                max_duration=defn["max_duration"],
                interval=defn["interval"],
            )
            self.pipelines[p.id] = p

    def set_on_update(self, callback):
        self._on_update = callback

    def get_all(self):
        return [p.to_dict() for p in self.pipelines.values()]

    def get(self, pipeline_id):
        return self.pipelines.get(pipeline_id)

    def trigger(self, pipeline_id):
        p = self.pipelines.get(pipeline_id)
        if not p or p.status == "running":
            return False
        task = asyncio.create_task(run_pipeline(p, on_update=self._on_update))
        self._tasks[pipeline_id] = task
        return True

    def trigger_all(self):
        for pid, p in self.pipelines.items():
            if p.status != "running":
                self.trigger(pid)
