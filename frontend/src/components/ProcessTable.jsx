import { useState, useEffect, useRef } from 'react';
import { Terminal, ArrowUp, ArrowDown, RefreshCw, Search } from 'lucide-react';
import { getProcesses } from '../api';

const STATUS_COLORS = {
  running: 'text-emerald-400',
  sleeping: 'text-gray-500',
  idle: 'text-gray-600',
  stopped: 'text-yellow-400',
  zombie: 'text-red-400',
  disk_sleep: 'text-orange-400',
};

function CpuBar({ value }) {
  const color = value > 80 ? '#ef4444' : value > 50 ? '#f59e0b' : '#10b981';
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-[#2a2d3a] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs w-12 text-right tabular-nums" style={{ color }}>{value.toFixed(1)}%</span>
    </div>
  );
}

function MemBar({ value }) {
  const color = value > 80 ? '#ef4444' : value > 50 ? '#6366f1' : '#6366f1';
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-[#2a2d3a] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs w-12 text-right tabular-nums" style={{ color }}>{value.toFixed(1)}%</span>
    </div>
  );
}

const COLUMNS = [
  { key: 'pid', label: 'PID', align: 'right', width: 'w-16' },
  { key: 'user', label: 'USER', align: 'left', width: 'w-24' },
  { key: 'name', label: 'PROCESS', align: 'left', width: 'flex-1' },
  { key: 'cpu_percent', label: 'CPU%', align: 'right', width: 'w-36' },
  { key: 'memory_percent', label: 'MEM%', align: 'right', width: 'w-36' },
  { key: 'memory_mb', label: 'MEM MB', align: 'right', width: 'w-20' },
  { key: 'status', label: 'STATUS', align: 'center', width: 'w-20' },
];

export default function ProcessTable({ metrics }) {
  const [processes, setProcesses] = useState([]);
  const [sortKey, setSortKey] = useState('cpu_percent');
  const [sortAsc, setSortAsc] = useState(false);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  const fetchProcs = async () => {
    setLoading(true);
    try {
      const data = await getProcesses(50);
      setProcesses(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchProcs();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchProcs, 5000);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const filtered = processes
    .filter(p => {
      if (!filter) return true;
      const q = filter.toLowerCase();
      return p.name.toLowerCase().includes(q)
        || p.user.toLowerCase().includes(q)
        || String(p.pid).includes(q);
    })
    .sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return sortAsc ? cmp : -cmp;
    });

  const topCpu = processes.slice().sort((a, b) => b.cpu_percent - a.cpu_percent).slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Terminal size={20} className="text-cyan-400" />
          Process Monitor
          <span className="text-xs text-gray-500 font-normal">
            ({processes.length} processes)
          </span>
        </h2>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter processes..."
              className="bg-[#1a1b23] border border-[#2e303a] rounded-lg pl-8 pr-3 py-1.5 text-sm
                text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 w-48"
            />
          </div>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              transition-colors ${autoRefresh
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'bg-[#1a1b23] text-gray-500 border border-[#2e303a]'}`}
          >
            <RefreshCw size={12} className={autoRefresh ? 'animate-spin' : ''} style={autoRefresh ? { animationDuration: '3s' } : {}} />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>

          <button
            onClick={fetchProcs}
            className="p-1.5 rounded-lg bg-[#1a1b23] border border-[#2e303a] text-gray-400
              hover:text-white hover:border-[#3e404a] transition-colors"
            title="Refresh now"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary bar — per-core CPU + top consumers */}
      {metrics && (
        <div className="bg-[#1a1b23] rounded-lg p-3 space-y-2">
          {metrics.cpu_per_core && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5">CPU Cores</p>
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(metrics.cpu_per_core.length, 16)}, 1fr)` }}>
                {metrics.cpu_per_core.map((v, i) => {
                  const color = v > 80 ? '#ef4444' : v > 50 ? '#f59e0b' : '#10b981';
                  return (
                    <div key={i} className="flex flex-col items-center gap-0.5" title={`Core ${i}: ${v}%`}>
                      <div className="w-full h-8 bg-[#2a2d3a] rounded-sm overflow-hidden flex flex-col-reverse">
                        <div className="w-full transition-all duration-500 rounded-sm"
                          style={{ height: `${v}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-[9px] text-gray-600">{i}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {metrics.load_avg && metrics.load_avg.length > 0 && (
            <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
              <span>Load Avg:</span>
              <span className="text-gray-300">{metrics.load_avg[0].toFixed(2)}</span>
              <span className="text-gray-400">{metrics.load_avg[1].toFixed(2)}</span>
              <span className="text-gray-500">{metrics.load_avg[2].toFixed(2)}</span>
              {metrics.swap_total_gb > 0 && (
                <>
                  <span className="ml-4">Swap:</span>
                  <span className="text-gray-300">{metrics.swap_used_gb} / {metrics.swap_total_gb} GB ({metrics.swap_percent}%)</span>
                </>
              )}
            </div>
          )}
          {topCpu.length > 0 && (
            <div className="flex items-center gap-4 text-xs pt-1">
              <span className="text-gray-500">Top:</span>
              {topCpu.map(p => (
                <span key={p.pid} className="text-gray-400">
                  <span className="text-cyan-400">{p.name}</span>
                  <span className="text-gray-600 ml-1">{p.cpu_percent}%</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Process table */}
      <div className="bg-[#1a1b23] rounded-lg overflow-hidden border border-[#2e303a]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#15161e]">
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    className={`px-3 py-2 font-medium text-gray-500 cursor-pointer hover:text-gray-300
                      transition-colors select-none ${col.width} text-${col.align}`}
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (
                        sortAsc ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="text-center py-8 text-gray-600">
                    {filter ? 'No matching processes' : 'Loading...'}
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => (
                  <tr key={`${p.pid}-${i}`}
                    className="border-t border-[#2e303a]/50 hover:bg-[#1f2028] transition-colors">
                    <td className="px-3 py-1.5 text-right text-gray-600 tabular-nums text-xs">{p.pid}</td>
                    <td className="px-3 py-1.5 text-gray-500 text-xs truncate max-w-[6rem]">{p.user}</td>
                    <td className="px-3 py-1.5 text-white font-medium truncate max-w-[14rem]" title={p.name}>{p.name}</td>
                    <td className="px-3 py-1.5"><CpuBar value={p.cpu_percent} /></td>
                    <td className="px-3 py-1.5"><MemBar value={p.memory_percent} /></td>
                    <td className="px-3 py-1.5 text-right text-gray-400 tabular-nums text-xs">{p.memory_mb}</td>
                    <td className={`px-3 py-1.5 text-center text-xs ${STATUS_COLORS[p.status] || 'text-gray-500'}`}>
                      {p.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
