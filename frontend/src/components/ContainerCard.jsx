import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  RotateCw, 
  Pause, 
  Terminal, 
  Info, 
  Trash2, 
  Copy, 
  Check, 
  Network,
  Activity,
  Layers
} from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

export default function ContainerCard({
  container,
  actionLoading,
  onAction,
  onOpenLogs,
  onOpenInspect,
  onOpenDeleteConfirm,
  onOpenStopConfirm
}) {
  const [copiedId, setCopiedId] = useState(false);

  const isRunning = container.state === 'running';
  const isPaused = container.state === 'paused';
  const isExited = container.state === 'exited' || container.state === 'created';
  const isRestarting = container.state === 'restarting';

  const isLoading = Boolean(actionLoading[container.id]);
  const currentAction = actionLoading[container.id];

  const handleCopyId = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(container.fullId || container.id);
    setCopiedId(true);
    triggerHaptic('light');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getBorderClass = () => {
    if (isRunning) return 'glass-card-running';
    if (isPaused) return 'glass-card-paused';
    if (isRestarting) return 'glass-card-restarting';
    return 'glass-card-exited';
  };

  const getBadgeClass = () => {
    if (isRunning) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (isPaused) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    if (isRestarting) return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  };

  return (
    <div className={`glass-panel-interactive rounded-2xl p-4 sm:p-5 relative transition-all duration-200 ${getBorderClass()}`}>
      
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-base text-white truncate tracking-tight" title={container.name}>
              {container.name}
            </h3>

            {/* Copyable ID Badge */}
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 border border-slate-700/80 transition"
              title="Click to copy container ID"
            >
              {copiedId ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-slate-400" />}
              <span>{container.id}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
            <Layers className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="font-mono text-[11px] text-slate-300 truncate" title={container.image}>
              {container.image}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0 flex items-center">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getBadgeClass()}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isRunning ? 'bg-emerald-400 animate-pulse' : isPaused ? 'bg-amber-400' : isRestarting ? 'bg-cyan-400 animate-spin' : 'bg-rose-400'
            }`}></span>
            {container.state}
          </span>
        </div>
      </div>

      {/* Meta Info & Ports */}
      <div className="mb-4 space-y-1.5">
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Activity className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">{container.status}</span>
        </div>

        {container.ports && container.ports.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <Network className="w-3 h-3 text-slate-400 shrink-0" />
            {container.ports.map((port, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded bg-dark-900 border border-slate-800 text-[10px] font-mono text-cyan-300"
              >
                {port}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons Bar */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80 flex-wrap">
        
        {/* State Transition Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {isRunning ? (
            <>
              {/* Stop Button */}
              <button
                onClick={() => {
                  triggerHaptic('warning');
                  onOpenStopConfirm(container);
                }}
                disabled={isLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold transition disabled:opacity-50"
                title="Stop Container"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>

              {/* Restart Button */}
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onAction(container.id, 'restart');
                }}
                disabled={isLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-xs font-semibold transition disabled:opacity-50"
                title="Restart Container"
              >
                <RotateCw className={`w-3 h-3 ${isLoading && currentAction === 'restart' ? 'animate-spin' : ''}`} />
                <span>Restart</span>
              </button>

              {/* Pause Button */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onAction(container.id, 'pause');
                }}
                disabled={isLoading}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs transition disabled:opacity-50"
                title="Pause Container"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            </>
          ) : isPaused ? (
            <>
              {/* Resume Button */}
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onAction(container.id, 'unpause');
                }}
                disabled={isLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-semibold transition disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Resume</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onAction(container.id, 'restart');
                }}
                disabled={isLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-xs font-semibold transition disabled:opacity-50"
              >
                <RotateCw className="w-3 h-3" />
                <span>Restart</span>
              </button>
            </>
          ) : (
            <>
              {/* Start Button */}
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onAction(container.id, 'start');
                }}
                disabled={isLoading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition disabled:opacity-50"
              >
                <Play className={`w-3 h-3 fill-current ${isLoading && currentAction === 'start' ? 'animate-pulse' : ''}`} />
                <span>Start</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onAction(container.id, 'restart');
                }}
                disabled={isLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-xs font-semibold transition disabled:opacity-50"
              >
                <RotateCw className="w-3 h-3" />
                <span>Restart</span>
              </button>
            </>
          )}
        </div>

        {/* Utility Actions (Logs, Inspect, Delete) */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Logs */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenLogs(container);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
            title="View Container Logs"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Logs</span>
          </button>

          {/* Inspect */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenInspect(container);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition"
            title="Inspect Details"
          >
            <Info className="w-3.5 h-3.5 text-indigo-400" />
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              triggerHaptic('warning');
              onOpenDeleteConfirm(container);
            }}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 text-xs transition"
            title="Delete Container"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
}
