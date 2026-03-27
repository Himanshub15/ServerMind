import { AlertTriangle, Info, AlertOctagon, X } from 'lucide-react';
import { dismissAlert } from '../api';

const sevConfig = {
  info:     { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  warning:  { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
  critical: { icon: AlertOctagon, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
};

export default function AlertFeed({ alerts, onDismiss }) {
  const handleDismiss = async (id) => {
    try {
      await dismissAlert(id);
      onDismiss?.(id);
    } catch {}
  };

  const active = alerts.filter(a => !a.dismissed);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <AlertTriangle size={20} className="text-yellow-400" />
        Alerts
        {active.length > 0 && (
          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
            {active.length}
          </span>
        )}
      </h2>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {active.length === 0 && (
          <p className="text-gray-500 text-sm p-4 text-center">No active alerts</p>
        )}
        {active.map((a) => {
          const cfg = sevConfig[a.severity] || sevConfig.info;
          const Icon = cfg.icon;
          return (
            <div key={a.id} className={`bg-[#1a1b23] rounded-lg p-3 border ${cfg.border} relative`}>
              <button onClick={() => handleDismiss(a.id)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-300">
                <X size={14} />
              </button>
              <div className="flex items-start gap-2">
                <Icon size={16} className={`${cfg.color} mt-0.5 shrink-0`} />
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium">{a.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.message}</p>
                  {a.ai_summary && (
                    <p className="text-xs text-indigo-300 mt-1 italic">{a.ai_summary}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(a.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
