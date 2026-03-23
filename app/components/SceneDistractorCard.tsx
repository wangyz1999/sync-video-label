'use client';

import { SceneDistractor, EventTypeInfo } from '../types';

interface SceneDistractorCardProps {
  distractor: SceneDistractor;
  eventInfo: EventTypeInfo;
  isSelected: boolean;
  showVideoIndex?: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<SceneDistractor>) => void;
  onDelete: () => void;
  onMarkAsTrueLabel: () => void;
}

export function SceneDistractorCard({
  distractor,
  eventInfo,
  isSelected,
  showVideoIndex = false,
  onSelect,
  onUpdate,
  onDelete,
  onMarkAsTrueLabel,
}: SceneDistractorCardProps) {
  // Check if caption is missing
  const isMissingCaption = !distractor.caption || distractor.caption.trim() === '';

  return (
    <div
      className={`rounded-lg transition-all cursor-pointer ${
        isSelected
          ? 'bg-slate-800 ring-2 ring-amber-500 shadow-lg shadow-amber-500/20'
          : isMissingCaption
            ? 'bg-slate-800/80 ring-2 ring-red-500 shadow-lg shadow-red-500/20'
            : 'bg-slate-800/60 hover:bg-slate-800/80 ring-1 ring-slate-600'
      }`}
      onClick={onSelect}
    >
      <div className="p-2.5 space-y-1.5">
        {/* Header row: Type badge, delete */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {showVideoIndex && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300 ring-1 ring-slate-600">
                V{(distractor.videoIndex ?? 0) + 1}
              </span>
            )}
            {/* Scene Distractor badge */}
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500 text-white ring-1 ring-orange-600 flex items-center gap-0.5"
              title="Scene Distractor"
            >
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              SD
            </span>
            <span
              className="px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: eventInfo.color }}
            >
              {distractor.type}
            </span>
            {isMissingCaption && (
              <span className="text-xs text-red-400 font-medium">⚠ Required</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Mark as True Label button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsTrueLabel();
              }}
              className="p-1 rounded text-slate-500 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
              title="Mark as True Label"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
              title="Delete distractor"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Caption - single line */}
        <div>
          <input
            type="text"
            value={distractor.caption}
            onChange={(e) => onUpdate({ caption: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder={`${eventInfo.fullName} distractor...`}
            className={`w-full px-2 py-1 rounded bg-slate-700/50 border text-slate-200 text-xs placeholder-slate-500 focus:outline-none ${
              isMissingCaption
                ? 'border-red-500 focus:border-red-400'
                : 'border-slate-600 focus:border-amber-500'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
