import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Cpu, HardDrive, MemoryStick, Network, Activity, Clock } from 'lucide-react';

function Gauge({ label, value, icon: Icon, color }) {
  const r = 40, stroke = 8;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="100" height="100" className="-rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#2a2d3a" strokeWidth={stroke} />
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{Math.round(value)}%</span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-sm text-gray-400">
        <Icon size={14} />
        <span>{label}</span>
      </div>
    </div>
  );
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

function formatBytes(bytes) {
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(1)} KB`;
}

export default function MetricsPanel({ metrics, history }) {
  if (!metrics) return <div className="text-gray-500 p-4">Waiting for metrics...</div>;

  const chartData = history.slice(-30).map((s, i) => ({
    t: i,
    cpu: s.cpu_percent,
    mem: s.memory_percent,
  }));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <Activity size={20} className="text-emerald-400" />
        System Metrics
      </h2>

      <div className="flex justify-around flex-wrap gap-4">
        <Gauge label="CPU" value={metrics.cpu_percent} icon={Cpu} color="#10b981" />
        <Gauge label="Memory" value={metrics.memory_percent} icon={MemoryStick} color="#6366f1" />
        <Gauge label="Disk" value={metrics.disk_percent} icon={HardDrive} color="#f59e0b" />
      </div>

      <div className="bg-[#1a1b23] rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-2">CPU & Memory (last 2.5 min)</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <XAxis dataKey="t" hide />
            <YAxis domain={[0, 100]} hide />
            <Tooltip contentStyle={{ background: '#1f2028', border: '1px solid #2e303a', borderRadius: 8, color: '#e5e7eb' }} />
            <Line type="monotone" dataKey="cpu" stroke="#10b981" dot={false} strokeWidth={2} name="CPU %" />
            <Line type="monotone" dataKey="mem" stroke="#6366f1" dot={false} strokeWidth={2} name="Memory %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="bg-[#1a1b23] rounded-lg p-3">
          <div className="text-gray-500 flex items-center gap-1"><Network size={12} /> Net Sent</div>
          <div className="text-white font-medium">{formatBytes(metrics.net_bytes_sent)}</div>
        </div>
        <div className="bg-[#1a1b23] rounded-lg p-3">
          <div className="text-gray-500 flex items-center gap-1"><Network size={12} /> Net Recv</div>
          <div className="text-white font-medium">{formatBytes(metrics.net_bytes_recv)}</div>
        </div>
        <div className="bg-[#1a1b23] rounded-lg p-3">
          <div className="text-gray-500">Processes</div>
          <div className="text-white font-medium">{metrics.process_count}</div>
        </div>
        <div className="bg-[#1a1b23] rounded-lg p-3">
          <div className="text-gray-500 flex items-center gap-1"><Clock size={12} /> Uptime</div>
          <div className="text-white font-medium">{formatUptime(metrics.uptime_seconds)}</div>
        </div>
      </div>
    </div>
  );
}
