import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/40 bg-emerald-950/80 text-emerald-100',
    error: 'border-rose-500/40 bg-rose-950/80 text-rose-100',
    info: 'border-cyan-500/40 bg-cyan-950/80 text-cyan-100',
  };

  return (
    <div className="fixed bottom-5 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-slide-up pointer-events-auto">
      <div className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl ${borders[toast.type || 'info']}`}>
        {icons[toast.type || 'info']}
        <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed break-words">
          {toast.message}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 transition text-slate-400 hover:text-white shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
