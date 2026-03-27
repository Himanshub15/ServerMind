import { useState, useCallback, useEffect } from 'react';
import { Server, Wifi, WifiOff } from 'lucide-react';
import useWebSocket from './hooks/useWebSocket';
import { getPipelines, getMetricsHistory, getAlerts } from './api';
import MetricsPanel from './components/MetricsPanel';
import PipelineCards from './components/PipelineCards';
import AlertFeed from './components/AlertFeed';
import ProcessTable from './components/ProcessTable';
import ChatPanel from './components/ChatPanel';

export default function App() {
  const [metrics, setMetrics] = useState(null);
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const onMetrics = useCallback((data) => {
    setMetrics(data);
    setMetricsHistory(prev => [...prev.slice(-59), data]);
  }, []);

  const onPipeline = useCallback((data) => {
    setPipelines(prev => prev.map(p => p.id === data.id ? data : p));
  }, []);

  const onAlert = useCallback((data) => {
    setAlerts(prev => [data, ...prev]);
  }, []);

  const { connected } = useWebSocket({ onMetrics, onPipeline, onAlert });

  useEffect(() => {
    getPipelines().then(setPipelines).catch(() => {});
    getMetricsHistory().then(h => {
      setMetricsHistory(h);
      if (h.length) setMetrics(h[h.length - 1]);
    }).catch(() => {});
    getAlerts().then(setAlerts).catch(() => {});
  }, []);

  const handleDismiss = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  };

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <header className="border-b border-[#2e303a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Server size={24} className="text-indigo-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">ServerMind</h1>
          <span className="text-xs text-gray-500 bg-[#1a1b23] px-2 py-0.5 rounded">v1.0</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {connected ? (
            <span className="flex items-center gap-1 text-emerald-400"><Wifi size={14} /> Live</span>
          ) : (
            <span className="flex items-center gap-1 text-red-400"><WifiOff size={14} /> Disconnected</span>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <MetricsPanel metrics={metrics} history={metricsHistory} />
          <ProcessTable metrics={metrics} />
          <PipelineCards pipelines={pipelines} />
        </div>
        <div>
          <AlertFeed alerts={alerts} onDismiss={handleDismiss} />
        </div>
      </main>

      <ChatPanel />
    </div>
  );
}
