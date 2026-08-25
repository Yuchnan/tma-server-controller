import React from 'react';
import { SearchX, Box } from 'lucide-react';

export default function EmptyState({ isFiltered, onResetFilter }) {
  return (
    <div className="glass-panel rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
        {isFiltered ? <SearchX className="w-7 h-7 text-cyan-400" /> : <Box className="w-7 h-7 text-indigo-400" />}
      </div>
      
      <h3 className="text-base font-bold text-white mb-1">
        {isFiltered ? 'No matching containers found' : 'No containers found'}
      </h3>
      
      <p className="text-xs text-slate-400 mb-5 max-w-xs">
        {isFiltered 
          ? 'Try adjusting your search query or status filter to see other containers.'
          : 'Your Docker daemon has no active or stopped containers at this moment.'}
      </p>

      {isFiltered && (
        <button
          onClick={onResetFilter}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
