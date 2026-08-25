import React from 'react';
import { 
  Cpu, 
  HardDrive, 
  Boxes, 
  Clock, 
  PlayCircle, 
  StopCircle, 
  PauseCircle,
  Thermometer,
  Flame,
  CheckCircle2
} from 'lucide-react';

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
  if (!seconds) return '0m';
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function SystemStats({ stats, containerCounts, loading }) {
  if (loading && !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="glass-panel p-4 rounded-2xl h-24 animate-pulse bg-slate-800/40 border border-slate-800"></div>
        ))}
      </div>
    );
  }

  const runningCount = containerCounts?.running || 0;
  const stoppedCount = containerCounts?.stopped || 0;
  const pausedCount = containerCounts?.paused || 0;
  const totalCount = containerCounts?.total || 0;

  const memPercent = stats?.memory?.usagePercent || 0;
  const memUsedStr = formatBytes(stats?.memory?.usedBytes);
  const memTotalStr = formatBytes(stats?.memory?.totalBytes);

  // Temperature parsing
  const temp = stats?.temperature;
  const tempAvailable = Boolean(temp && temp.available && temp.main !== null);
  const mainTemp = tempAvailable ? temp.main : null;

  const getTempColor = (t) => {
    if (!t) return { text: 'text-slate-400', badge: 'bg-slate-800 text-slate-400', label: 'N/A' };
    if (t < 50) return { text: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', label: 'Optimal' };
    if (t < 70) return { text: 'text-cyan-400', badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', label: 'Normal' };
    if (t < 80) return { text: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30', label: 'Warm' };
    return { text: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse', label: 'Hot!' };
  };

  const tempStyle = getTempColor(mainTemp);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      
      {/* 1. Containers Summary */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Containers</span>
          <Boxes className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {totalCount}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-0.5 text-emerald-400">
              <PlayCircle className="w-3 h-3 inline" /> {runningCount}
            </span>
            <span>•</span>
            <span className="flex items-center gap-0.5 text-rose-400">
              <StopCircle className="w-3 h-3 inline" /> {stoppedCount}
            </span>
            {pausedCount > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-amber-400">
                  <PauseCircle className="w-3 h-3 inline" /> {pausedCount}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Server Temperature */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Server Temp</span>
          {mainTemp && mainTemp >= 75 ? (
            <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
          ) : (
            <Thermometer className="w-4 h-4 text-cyan-400" />
          )}
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-1">
            <span className={`text-2xl font-bold tracking-tight ${tempStyle.text}`}>
              {tempAvailable ? `${mainTemp}°C` : 'N/A'}
            </span>
            {tempAvailable && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${tempStyle.badge}`}>
                {tempStyle.label}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {tempAvailable ? (
              temp.max ? `Peak: ${temp.max}°C` : `${temp.sensors?.length || 1} sensor(s)`
            ) : (
              'Thermal zone inactive'
            )}
          </div>
        </div>
      </div>

      {/* 3. Host CPU Cores / Load */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">CPU Load</span>
          <Cpu className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats?.cpu?.cores || 1} <span className="text-xs font-normal text-slate-400">Cores</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono truncate">
            Load: {stats?.cpu?.loadAvg?.length ? stats.cpu.loadAvg.join(', ') : '0.00'}
          </div>
        </div>
      </div>

      {/* 4. Memory / RAM Usage */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Host RAM</span>
          <HardDrive className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">{memPercent}%</span>
            <span className="text-[11px] text-slate-400 font-mono">{memUsedStr} / {memTotalStr}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                memPercent > 85 ? 'bg-rose-500' : memPercent > 65 ? 'bg-amber-500' : 'bg-gradient-to-r from-cyan-400 to-indigo-500'
              }`}
              style={{ width: `${Math.min(memPercent, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 5. Host Uptime & Docker Engine */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between col-span-2 md:col-span-1">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Uptime & Engine</span>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {formatUptime(stats?.uptime)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            Docker {stats?.docker?.version ? `v${stats.docker.version}` : 'Active'}
          </div>
        </div>
      </div>

    </div>
  );
}
