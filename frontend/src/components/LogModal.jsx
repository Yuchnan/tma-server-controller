import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  RefreshCw, 
  Copy, 
  Check, 
  Download, 
  Search, 
  ArrowDown, 
  Terminal,
  Clock,
  SlidersHorizontal
} from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

export default function LogModal({ container, onClose, onShowToast }) {
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(true);
  const [tail, setTail] = useState(100);
  const [timestamps, setTimestamps] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const logContainerRef = useRef(null);

  const fetchLogs = async (isBackground = false) => {
    if (!container) return;
    if (!isBackground) setLoading(true);

    try {
      const res = await fetch(`/api/containers/${container.id}/logs?tail=${tail}&timestamps=${timestamps}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setLogs(data.logs || 'No logs available for this container.');
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      if (!isBackground) {
        setLogs(`[Error fetching logs: ${err.message}]`);
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [container?.id, tail, timestamps]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || !container) return;
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [autoRefresh, container?.id, tail, timestamps]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      triggerHaptic('light');
    }
  };

  const handleCopyLogs = () => {
    if (!logs) return;
    navigator.clipboard.writeText(logs);
    setCopied(true);
    triggerHaptic('success');
    if (onShowToast) onShowToast({ type: 'success', message: 'Logs copied to clipboard!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!logs) return;
    const blob = new Blob([logs], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${container.name}_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    triggerHaptic('light');
  };

  if (!container) return null;

  // Filter logs by search term
  const filteredLines = logs.split('\n').filter(line => {
    if (!filterText) return true;
    return line.toLowerCase().includes(filterText.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-dark-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl h-[90vh] max-h-[750px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-dark-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Terminal className="w-4 h-4" />
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
                fetchLogs();
              }}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Manual Refresh Logs"
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

        {/* Control Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-dark-850 border-b border-slate-800/80 text-xs">
          
          {/* Left Controls: Search filter & Tail select */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter logs..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-8 pr-3 py-1 rounded-lg bg-dark-900 border border-slate-700/80 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Tail count selector */}
            <div className="flex items-center bg-dark-900 border border-slate-700/80 rounded-lg px-2 py-1">
              <SlidersHorizontal className="w-3 h-3 text-slate-400 mr-1.5" />
              <select
                value={tail}
                onChange={(e) => setTail(Number(e.target.value))}
                className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
              >
                <option value="50" className="bg-dark-900">50 lines</option>
                <option value="100" className="bg-dark-900">100 lines</option>
                <option value="250" className="bg-dark-900">250 lines</option>
                <option value="500" className="bg-dark-900">500 lines</option>
                <option value="1000" className="bg-dark-900">1000 lines</option>
              </select>
            </div>
          </div>

          {/* Right Controls: Auto-refresh, Timestamps, Copy, Download, Scroll */}
          <div className="flex items-center gap-1.5 flex-wrap">
            
            {/* Timestamps toggle */}
            <button
              onClick={() => {
                triggerHaptic('selection');
                setTimestamps(!timestamps);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium transition ${
                timestamps ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-dark-900 text-slate-400 border-slate-700/80'
              }`}
              title="Toggle Timestamps"
            >
              <Clock className="w-3 h-3" />
              <span className="hidden sm:inline">Time</span>
            </button>

            {/* Auto refresh toggle */}
            <button
              onClick={() => {
                triggerHaptic('selection');
                setAutoRefresh(!autoRefresh);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium transition ${
                autoRefresh ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-dark-900 text-slate-400 border-slate-700/80'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`}></span>
              <span>Live Stream</span>
            </button>

            {/* Copy button */}
            <button
              onClick={handleCopyLogs}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-dark-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition"
              title="Copy All Logs"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="p-1 rounded-lg bg-dark-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition"
              title="Download Logs"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Scroll bottom button */}
            <button
              onClick={scrollToBottom}
              className="p-1 rounded-lg bg-dark-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition"
              title="Scroll to Bottom"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Terminal Body */}
        <div 
          ref={logContainerRef}
          className="flex-1 p-4 bg-dark-950 overflow-y-auto font-mono text-[11px] sm:text-xs leading-relaxed select-text space-y-0.5 text-slate-300"
        >
          {loading && !logs ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
              Fetching container stream...
            </div>
          ) : filteredLines.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              No log output matched your search criteria.
            </div>
          ) : (
            filteredLines.map((line, idx) => (
              <div 
                key={idx} 
                className={`py-0.5 px-1 rounded hover:bg-white/5 break-all ${
                  line.includes('ERROR') || line.includes('Error') || line.includes('ERR') || line.includes('fatal')
                    ? 'text-rose-400 bg-rose-950/20'
                    : line.includes('WARN') || line.includes('Warning')
                    ? 'text-amber-300 bg-amber-950/20'
                    : line.includes('INFO')
                    ? 'text-cyan-300'
                    : 'text-slate-300'
                }`}
              >
                {line}
              </div>
            ))
          )}
        </div>

        {/* Terminal Footer */}
        <div className="px-4 py-2 bg-dark-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <div>
            Showing <span className="text-slate-300 font-mono">{filteredLines.length}</span> lines
            {filterText && ` (filtered from ${logs.split('\n').length})`}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>UTF-8 Stream</span>
          </div>
        </div>

      </div>
    </div>
  );
}
