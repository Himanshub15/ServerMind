import { Play, CheckCircle, XCircle, Loader, Circle } from 'lucide-react';
import { triggerPipeline } from '../api';

const statusConfig = {
  idle:    { color: 'text-gray-400', bg: 'bg-gray-400/10', icon: Circle, label: 'Idle' },
  running: { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Loader, label: 'Running' },
  success: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle, label: 'Success' },
  failed:  { color: 'text-red-400', bg: 'bg-red-400/10', icon: XCircle, label: 'Failed' },
};

export default function PipelineCards({ pipelines }) {
  const handleTrigger = async (id) => {
    try { await triggerPipeline(id); } catch {}
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <Play size={20} className="text-blue-400" />
        ETL Pipelines
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {pipelines.map((p) => {
          const cfg = statusConfig[p.status] || statusConfig.idle;
          const Icon = cfg.icon;
          return (
            <div key={p.id} className="bg-[#1a1b23] rounded-lg p-4 border border-[#2e303a] hover:border-[#3e405a] transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-white font-medium text-sm">{p.name}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">{p.description}</p>
                </div>
                <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                  <Icon size={12} className={p.status === 'running' ? 'animate-spin' : ''} />
                  {cfg.label}
                </span>
              </div>

              {p.current_stage && (
                <p className="text-xs text-blue-300 mb-2">Stage: {p.current_stage}</p>
              )}
              {p.error_message && (
                <p className="text-xs text-red-400 mb-2">{p.error_message}</p>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2e303a]">
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Runs: {p.run_count}</span>
                  <span>Fails: {p.fail_count}</span>
                </div>
                <button
                  onClick={() => handleTrigger(p.id)}
                  disabled={p.status === 'running'}
                  className="text-xs px-3 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Trigger
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
