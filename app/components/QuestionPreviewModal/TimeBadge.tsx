'use client';

import { TimeBadgeProps } from './types';
import { formatTime } from './utils';

/**
 * Clickable time badge component that allows jumping to specific timestamps
 * Now supports end time for auto-stop functionality
 */
export function TimeBadge({ 
  start, 
  end, 
  videoIndex, 
  onJump, 
  className = '' 
}: TimeBadgeProps) {
  if (start === undefined && end === undefined) return null;
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (start !== undefined) {
      onJump(start, end, videoIndex);
    }
  };
  
  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-700/50 hover:bg-violet-600/50 transition-colors cursor-pointer group ${className}`}
      title="Click to play this time range"
    >
      <svg className="w-3 h-3 text-slate-400 group-hover:text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      </svg>
      <span className="text-slate-300 group-hover:text-violet-200">
        {start !== undefined ? formatTime(start) : '?'} - {end !== undefined ? formatTime(end) : '?'}
      </span>
    </button>
  );
}
