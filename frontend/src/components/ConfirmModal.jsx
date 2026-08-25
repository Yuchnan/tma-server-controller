import React, { useState } from 'react';
import { AlertTriangle, Trash2, Square, X, RefreshCw } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

export default function ConfirmModal({ modalState, onClose, onConfirm, loading }) {
  const [forceDelete, setForceDelete] = useState(false);

  if (!modalState) return null;

  const { type, container } = modalState;

  const titles = {
    stop: 'Stop Container',
    delete: 'Delete Container',
    prune: 'Prune System Resources',
  };

  const descriptions = {
    stop: `Are you sure you want to stop container "${container?.name}" (${container?.id})? Any active processes inside will be terminated.`,
    delete: `Are you sure you want to delete container "${container?.name}" (${container?.id})? This action cannot be undone.`,
    prune: 'This will remove all stopped containers, dangling images, and unused networks to reclaim host disk space.',
  };

  const icons = {
    stop: <Square className="w-5 h-5 text-rose-400 fill-current" />,
    delete: <Trash2 className="w-5 h-5 text-rose-400" />,
    prune: <AlertTriangle className="w-5 h-5 text-amber-400" />,
  };

  const handleConfirm = () => {
    triggerHaptic('heavy');
    if (type === 'delete') {
      onConfirm({ id: container.id, force: forceDelete });
    } else if (type === 'stop') {
      onConfirm({ id: container.id });
    } else if (type === 'prune') {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-dark-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              type === 'prune' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-rose-500/10 border-rose-500/30'
            }`}>
              {icons[type]}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{titles[type]}</h3>
              <p className="text-xs text-slate-400">Action confirmation</p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {descriptions[type]}
        </p>

        {/* Force Delete Option */}
        {type === 'delete' && (
          <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={forceDelete}
              onChange={(e) => setForceDelete(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-rose-600 focus:ring-rose-500 focus:ring-offset-0 bg-dark-900 cursor-pointer"
            />
            <span className="text-xs text-slate-300 font-medium">Force delete (even if running)</span>
          </label>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-lg transition ${
              type === 'prune'
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Confirm {type === 'delete' ? 'Delete' : type === 'stop' ? 'Stop' : 'Prune'}</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
