import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
    Search,
    Layers,
    PlayCircle,
    StopCircle,
    PauseCircle,
    AlertCircle,
    X,
    Server,
    RefreshCw
} from 'lucide-react';
import Navbar from './components/Navbar';
import SystemStats from './components/SystemStats';
import ContainerCard from './components/ContainerCard';
import LogModal from './components/LogModal';
import InspectModal from './components/InspectModal';
import ConfirmModal from './components/ConfirmModal';
import EmptyState from './components/EmptyState';
import Toast from './components/Toast';
import { initTelegramApp, getTelegramUser, triggerHaptic } from './utils/telegram';

export default function App() {
    const [containers, setContainers] = useState([]);
    const [serverStats, setServerStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'running', 'stopped', 'paused'

    // Auto-refresh interval (5000ms default)
    const [autoRefreshInterval, setAutoRefreshInterval] = useState(5000);

    // Action Loading State per container
    const [actionLoading, setActionLoading] = useState({});
    const [modalLoading, setModalLoading] = useState(false);

    // Modals state
    const [logContainer, setLogContainer] = useState(null);
    const [inspectContainer, setInspectContainer] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null); // { type: 'stop'|'delete'|'prune', container: ... }

    // Toast notifications
    const [toast, setToast] = useState(null);
    const toastTimeoutRef = useRef(null);

    // Telegram User
    const [telegramUser, setTelegramUser] = useState(null);

    const showToast = (toastObj) => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToast(toastObj);
        toastTimeoutRef.current = setTimeout(() => {
            setToast(null);
        }, 3500);
    };

    // Fetch containers and server stats
    const fetchData = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        setError(null);

        try {
            const [containersRes, statsRes] = await Promise.all([
                fetch('/api/containers'),
                fetch('/api/system/stats')
            ]);

            if (!containersRes.ok) {
                throw new Error(`Containers endpoint returned ${containersRes.status}`);
            }

            const containersData = await containersRes.json();
            setContainers(Array.isArray(containersData) ? containersData : []);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setServerStats(statsData);
            }
        } catch (err) {
            console.error('Failed to load homelab data:', err);
            setError(err.message || 'Could not connect to Docker backend');
            if (!isBackground) {
                showToast({ type: 'error', message: `Backend connection error: ${err.message}` });
            }
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    // Initialize Telegram WebApp SDK and load initial data
    useEffect(() => {
        initTelegramApp();
        const user = getTelegramUser();
        if (user) setTelegramUser(user);

        fetchData();
    }, []);

    // Auto-refresh interval effect
    useEffect(() => {
        if (!autoRefreshInterval || autoRefreshInterval <= 0) return;
        const interval = setInterval(() => {
            fetchData(true);
        }, autoRefreshInterval);
        return () => clearInterval(interval);
    }, [autoRefreshInterval]);

    // Container Counts
    const containerCounts = useMemo(() => {
        let running = 0;
        let stopped = 0;
        let paused = 0;

        containers.forEach(c => {
            if (c.state === 'running') running++;
            else if (c.state === 'paused') paused++;
            else stopped++;
        });

        return {
            total: containers.length,
            running,
            stopped,
            paused
        };
    }, [containers]);

    // Filtered Containers
    const filteredContainers = useMemo(() => {
        return containers.filter(c => {
            // Status filter
            if (statusFilter === 'running' && c.state !== 'running') return false;
            if (statusFilter === 'stopped' && (c.state === 'running' || c.state === 'paused')) return false;
            if (statusFilter === 'paused' && c.state !== 'paused') return false;

            // Search filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                const matchName = c.name.toLowerCase().includes(query);
                const matchImage = c.image.toLowerCase().includes(query);
                const matchId = c.id.toLowerCase().includes(query);
                const matchPorts = (c.ports || []).some(p => p.toLowerCase().includes(query));
                return matchName || matchImage || matchId || matchPorts;
            }

            return true;
        });
    }, [containers, statusFilter, searchQuery]);

    // Container Action Handler (Start, Restart, Pause, Unpause)
    const handleAction = async (id, action) => {
        setActionLoading(prev => ({ ...prev, [id]: action }));
        try {
            const res = await fetch(`/api/containers/${id}/${action}`, { method: 'POST' });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || `Failed to ${action} container`);
            }

            triggerHaptic('success');
            showToast({ type: 'success', message: data.message || `Container ${action}ed successfully!` });
            await fetchData(true);
        } catch (err) {
            console.error(`Action ${action} error:`, err);
            triggerHaptic('error');
            showToast({ type: 'error', message: err.message });
        } finally {
            setActionLoading(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
    };

    // Stop Container Confirmation Handler
    const handleStopConfirm = async ({ id }) => {
        setModalLoading(true);
        try {
            const res = await fetch(`/api/containers/${id}/stop`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to stop container');

            triggerHaptic('success');
            showToast({ type: 'success', message: `Container ${id} stopped` });
            setConfirmModal(null);
            await fetchData(true);
        } catch (err) {
            triggerHaptic('error');
            showToast({ type: 'error', message: err.message });
        } finally {
            setModalLoading(false);
        }
    };

    // Delete Container Confirmation Handler
    const handleDeleteConfirm = async ({ id, force }) => {
        setModalLoading(true);
        try {
            const res = await fetch(`/api/containers/${id}?force=${force ? 'true' : 'false'}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete container');

            triggerHaptic('success');
            showToast({ type: 'success', message: `Container ${id} deleted` });
            setConfirmModal(null);
            await fetchData(true);
        } catch (err) {
            triggerHaptic('error');
            showToast({ type: 'error', message: err.message });
        } finally {
            setModalLoading(false);
        }
    };

    // Prune System Confirmation Handler
    const handlePruneConfirm = async () => {
        setModalLoading(true);
        try {
            const res = await fetch('/api/system/prune', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to prune system');

            const containersCount = data.results?.containersPruned?.ContainersDeleted?.length || 0;
            const imagesCount = data.results?.imagesPruned?.ImagesDeleted?.length || 0;

            triggerHaptic('success');
            showToast({
                type: 'success',
                message: `Prune complete: Removed ${containersCount} stopped containers & ${imagesCount} dangling images.`
            });
            setConfirmModal(null);
            await fetchData(true);
        } catch (err) {
            triggerHaptic('error');
            showToast({ type: 'error', message: err.message });
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">

            {/* Toast Notification Container */}
            <Toast toast={toast} onClose={() => setToast(null)} />

            {/* Top Navbar */}
            <Navbar
                serverStats={serverStats}
                loading={loading}
                onRefresh={() => fetchData(false)}
                autoRefreshInterval={autoRefreshInterval}
                onAutoRefreshChange={setAutoRefreshInterval}
                onOpenPruneModal={() => setConfirmModal({ type: 'prune' })}
                telegramUser={telegramUser}
            />

            {/* Main Container */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 sm:px-6 sm:py-6">

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 flex items-start gap-3 shadow-lg">
                        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        <div className="flex-1 text-xs sm:text-sm">
                            <div className="font-bold text-white mb-0.5">Connection Warning</div>
                            <div>{error}</div>
                        </div>
                        <button
                            onClick={() => fetchData(false)}
                            className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition shrink-0"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* System & Resource Overview Stats */}
                <SystemStats
                    stats={serverStats}
                    containerCounts={containerCounts}
                    loading={loading}
                />

                {/* Search & Status Filter Controls */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5">

                    {/* Status Filter Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                        {[
                            { id: 'all', label: 'All', count: containerCounts.total, icon: Layers, color: 'text-slate-300' },
                            { id: 'running', label: 'Running', count: containerCounts.running, icon: PlayCircle, color: 'text-emerald-400' },
                            { id: 'stopped', label: 'Stopped', count: containerCounts.stopped, icon: StopCircle, color: 'text-rose-400' },
                            { id: 'paused', label: 'Paused', count: containerCounts.paused, icon: PauseCircle, color: 'text-amber-400' },
                        ].map(tab => {
                            const Icon = tab.icon;
                            const isActive = statusFilter === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        triggerHaptic('selection');
                                        setStatusFilter(tab.id);
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${isActive
                                        ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                                        : 'bg-dark-900/80 text-slate-400 hover:text-slate-200 hover:bg-dark-850 border border-slate-800/80'
                                        }`}
                                >
                                    <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                                    <span>{tab.label}</span>
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Search Box */}
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search container, image, port..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 rounded-xl bg-dark-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 transition shadow-inner"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                </div>

                {/* Containers Grid */}
                {loading && containers.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="glass-panel p-5 rounded-2xl h-44 animate-pulse bg-slate-800/40 border border-slate-800"></div>
                        ))}
                    </div>
                ) : filteredContainers.length === 0 ? (
                    <EmptyState
                        isFiltered={Boolean(searchQuery || statusFilter !== 'all')}
                        onResetFilter={() => {
                            setSearchQuery('');
                            setStatusFilter('all');
                        }}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredContainers.map(container => (
                            <ContainerCard
                                key={container.id}
                                container={container}
                                actionLoading={actionLoading}
                                onAction={handleAction}
                                onOpenLogs={(c) => setLogContainer(c)}
                                onOpenInspect={(c) => setInspectContainer(c)}
                                onOpenStopConfirm={(c) => setConfirmModal({ type: 'stop', container: c })}
                                onOpenDeleteConfirm={(c) => setConfirmModal({ type: 'delete', container: c })}
                            />
                        ))}
                    </div>
                )}

            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800/60 py-4 px-6 text-center text-slate-500 text-xs">
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <span>TMA Server Controller</span>
                    <span>•</span>
                    <span>github.com/Yuchnan</span>
                </div>
            </footer>

            {/* MODAL 1: LOG VIEWER */}
            {logContainer && (
                <LogModal
                    container={logContainer}
                    onClose={() => setLogContainer(null)}
                    onShowToast={showToast}
                />
            )}

            {/* MODAL 2: INSPECT DETAILS */}
            {inspectContainer && (
                <InspectModal
                    container={inspectContainer}
                    onClose={() => setInspectContainer(null)}
                    onShowToast={showToast}
                />
            )}

            {/* MODAL 3: CONFIRMATION (STOP / DELETE / PRUNE) */}
            {confirmModal && (
                <ConfirmModal
                    modalState={confirmModal}
                    loading={modalLoading}
                    onClose={() => setConfirmModal(null)}
                    onConfirm={(payload) => {
                        if (confirmModal.type === 'stop') handleStopConfirm(payload);
                        else if (confirmModal.type === 'delete') handleDeleteConfirm(payload);
                        else if (confirmModal.type === 'prune') handlePruneConfirm();
                    }}
                />
            )}

        </div>
    );
}