import React, { useEffect, useState } from 'react';

export default function App() {
    const [containers, setContainers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchContainers = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/containers');
            const data = await res.json();
            setContainers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const restartContainer = async (id) => {
        try {
            await fetch(`/api/containers/${id}/restart`, { method: 'POST' });
            fetchContainers();
        } catch (err) {
            alert(`Failed to restart: ${err.message}`);
        }
    };

    useEffect(() => {
        // Inisialisasi TMA SDK jika ada di window
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
        }
        fetchContainers();
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-4 font-sans">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-bold">Homelab Control</h1>
                    <p className="text-xs text-slate-400">Manage Docker Containers</p>
                </div>
                <button
                    onClick={fetchContainers}
                    className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 rounded-md font-medium"
                >
                    Refresh
                </button>
            </header>

            {loading ? (
                <div className="text-center py-10 text-slate-400 text-sm">Loading containers...</div>
            ) : (
                <div className="space-y-3">
                    {containers.map((c) => (
                        <div key={c.id} className="bg-slate-800 p-3.5 rounded-xl border border-slate-700/60 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h2 className="font-semibold text-sm text-slate-200">{c.name}</h2>
                                    <p className="text-[11px] text-slate-400">{c.image}</p>
                                </div>
                                <span className={`px-2 py-0.5 text-[10px] rounded-full uppercase font-bold tracking-wider ${c.state === 'running' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                    }`}>
                                    {c.state}
                                </span>
                            </div>
                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-700/40">
                                <span className="text-[11px] text-slate-400 truncate max-w-[160px]">{c.status}</span>
                                <button
                                    onClick={() => restartContainer(c.id)}
                                    className="px-2.5 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition"
                                >
                                    Restart
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}