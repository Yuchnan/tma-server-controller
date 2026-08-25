import React, { useState, useEffect } from 'react';
import { 
  X, 
  Info, 
  Layers, 
  Key, 
  Network, 
  FolderGit2, 
  Copy, 
  Check, 
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

export default function InspectModal({ container, onClose, onShowToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'env', 'network', 'mounts'
  const [copiedKey, setCopiedKey] = useState(null);
  const [envFilter, setEnvFilter] = useState('');

  const fetchInspect = async () => {
    if (!container) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/containers/${container.id}/inspect`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Inspect failed:', err);
      if (onShowToast) onShowToast({ type: 'error', message: `Inspect failed: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspect();
  }, [container?.id]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    triggerHaptic('light');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!container) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-dark-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl h-[85vh] max-h-[700px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-dark-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Info className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h3 className="font-bold text-sm sm:text-base text-white truncate flex items-center gap-2">
                <span>{container.name}</span>
                <span className="text-xs font-normal text-slate-400 font-mono">({container.id})</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('light');
                fetchInspect();
              }}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh Details"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 bg-dark-850 border-b border-slate-800 overflow-x-auto text-xs">
          {[
            { id: 'overview', label: 'Overview', icon: Layers },
            { id: 'env', label: `Environment (${data?.env?.length || 0})`, icon: Key },
            { id: 'network', label: 'Networks & Ports', icon: Network },
            { id: 'mounts', label: `Mounts (${data?.mounts?.length || 0})`, icon: FolderGit2 },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto bg-dark-900 text-slate-300 text-xs sm:text-sm">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-indigo-400" />
              Loading inspect parameters...
            </div>
          ) : !data ? (
            <div className="text-center py-12 text-rose-400">Failed to load container details.</div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">State & Status</span>
                      <div className="font-mono text-white flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${data.state?.Running ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                        <span>{data.state?.Status || 'Unknown'} (Exit: {data.state?.ExitCode})</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Created Date</span>
                      <div className="font-mono text-slate-200">
                        {new Date(data.created).toLocaleString()}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 sm:col-span-2">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Image</span>
                      <div className="font-mono text-cyan-300 break-all select-all">
                        {data.image}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 sm:col-span-2">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Full Container ID</span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-slate-300 break-all text-[11px]">{data.fullId}</span>
                        <button
                          onClick={() => handleCopy(data.fullId, 'fullId')}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
                          title="Copy Full ID"
                        >
                          {copiedKey === 'fullId' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 sm:col-span-2">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Command / Entrypoint</span>
                      <div className="font-mono text-slate-300 bg-dark-900 p-2 rounded border border-slate-800/60 overflow-x-auto text-[11px]">
                        {data.cmd?.join(' ') || data.path || 'None'}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Restart Policy</span>
                      <div className="font-mono text-indigo-300">
                        {data.restartPolicy?.Name || 'no'}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Working Dir</span>
                      <div className="font-mono text-slate-300">
                        {data.workingDir || '/'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ENVIRONMENT VARIABLES */}
              {activeTab === 'env' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter environment variables..."
                      value={envFilter}
                      onChange={(e) => setEnvFilter(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div className="border border-slate-800/80 rounded-xl overflow-hidden divide-y divide-slate-800/80 bg-slate-950">
                    {data.env && data.env.length > 0 ? (
                      data.env
                        .filter(item => item.toLowerCase().includes(envFilter.toLowerCase()))
                        .map((item, idx) => {
                          const [key, ...rest] = item.split('=');
                          const val = rest.join('=');
                          return (
                            <div key={idx} className="flex items-start justify-between p-2.5 gap-2 hover:bg-white/5 transition">
                              <div className="flex-1 min-w-0 font-mono text-[11px] break-all">
                                <span className="text-cyan-300 font-semibold">{key}</span>
                                <span className="text-slate-500">=</span>
                                <span className="text-slate-300 select-all">{val}</span>
                              </div>
                              <button
                                onClick={() => handleCopy(item, `env-${idx}`)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 shrink-0"
                                title="Copy Key=Value"
                              >
                                {copiedKey === `env-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          );
                        })
                    ) : (
                      <div className="p-4 text-center text-slate-500 text-xs">No environment variables defined.</div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: NETWORK & PORTS */}
              {activeTab === 'network' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Connected Networks</h4>
                    <div className="space-y-2">
                      {data.networks && data.networks.length > 0 ? (
                        data.networks.map((net, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="flex items-center justify-between font-semibold text-white mb-2">
                              <span>{net.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                                Bridge
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                              <div>IP: <span className="text-cyan-300">{net.ipAddress || 'None'}</span></div>
                              <div>Gateway: <span className="text-slate-300">{net.gateway || 'None'}</span></div>
                              <div className="col-span-2 truncate">MAC: {net.macAddress || 'None'}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-500">No networks connected.</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Port Bindings</h4>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      {data.ports && Object.keys(data.ports).length > 0 ? (
                        <div className="space-y-1.5 font-mono text-xs">
                          {Object.entries(data.ports).map(([containerPort, hostBindings], idx) => (
                            <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-800/60 last:border-0">
                              <span className="text-slate-400">{containerPort}</span>
                              <span className="text-cyan-300">
                                {hostBindings ? hostBindings.map(b => `${b.HostIp || '0.0.0.0'}:${b.HostPort}`).join(', ') : 'Exposed (Not Bound)'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500">No active port bindings.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: MOUNTS / VOLUMES */}
              {activeTab === 'mounts' && (
                <div className="space-y-3">
                  {data.mounts && data.mounts.length > 0 ? (
                    data.mounts.map((m, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-indigo-300 uppercase tracking-wider">{m.type}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            m.rw ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {m.rw ? 'Read/Write' : 'Read-Only'}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] space-y-1">
                          <div className="text-slate-400 break-all">
                            <span className="text-slate-500">Host: </span>{m.source}
                          </div>
                          <div className="text-cyan-300 break-all">
                            <span className="text-slate-500">Container: </span>{m.destination}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-500 text-xs">No volumes or bind mounts attached.</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-dark-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
