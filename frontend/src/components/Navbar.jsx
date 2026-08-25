import React from 'react';
import { Server, RefreshCw, Trash2, ShieldCheck, User, Zap, Activity } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

export default function Navbar({
  serverStats,
  loading,
  onRefresh,
  autoRefreshInterval,
  onAutoRefreshChange,
  onOpenPruneModal,
  telegramUser
}) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-dark-950/85 border-b border-slate-800/80 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-600/30 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Server className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-dark-950"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Homelab <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Controller</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                <Zap className="w-3 h-3 text-cyan-400" /> TMA v1.1
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5">
              {serverStats?.hostname ? (
                <>
                  <span className="text-slate-300 font-mono">{serverStats.hostname}</span>
                  <span>•</span>
                  <span>{serverStats.platform}</span>
                </>
              ) : (
                'Docker & Homelab Management'
              )}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          
          {/* Telegram User Badge */}
          {telegramUser && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>{telegramUser.first_name}</span>
            </div>
          )}

          {/* Auto Refresh Select */}
          <div className="flex items-center bg-dark-900 border border-slate-800 rounded-lg p-1 text-xs">
            <Activity className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1 shrink-0" />
            <select
              value={autoRefreshInterval}
              onChange={(e) => {
                triggerHaptic('selection');
                onAutoRefreshChange(Number(e.target.value));
              }}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer pr-1 py-0.5"
              title="Auto Refresh Interval"
            >
              <option value="0" className="bg-dark-900 text-slate-200">Auto: Off</option>
              <option value="5000" className="bg-dark-900 text-slate-200">Auto: 5s</option>
              <option value="10000" className="bg-dark-900 text-slate-200">Auto: 10s</option>
              <option value="30000" className="bg-dark-900 text-slate-200">Auto: 30s</option>
            </select>
          </div>

          {/* System Prune Button */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenPruneModal();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition"
            title="Prune Unused Images & Containers"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prune</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onRefresh();
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 disabled:opacity-50 rounded-lg shadow-md shadow-indigo-500/20 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

      </div>
    </header>
  );
}
