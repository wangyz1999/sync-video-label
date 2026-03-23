'use client';

import { useState } from 'react';
import { SceneDistractor, EventType, EventTypeInfo } from '../types';
import { SceneDistractorCard } from './SceneDistractorCard';

interface SceneDistractorGroupProps {
  eventInfo: EventTypeInfo;
  distractors: SceneDistractor[];
  selectedDistractorId: string | null;
  onSelectDistractor: (id: string) => void;
  onUpdateDistractor: (id: string, updates: Partial<SceneDistractor>) => void;
  onDeleteDistractor: (id: string) => void;
  onMarkAsTrueLabel: (distractor: SceneDistractor) => void;
  onAddDistractor?: (type: EventType, videoIndex: number) => void;
  activeVideoIndex?: number; // -1 means "All", 0+ means specific video
  showVideoIndex?: boolean;
}

export function SceneDistractorGroup({
  eventInfo,
  distractors,
  selectedDistractorId,
  onSelectDistractor,
  onUpdateDistractor,
  onDeleteDistractor,
  onMarkAsTrueLabel,
  onAddDistractor,
  activeVideoIndex = 0,
  showVideoIndex = false,
}: SceneDistractorGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (distractors.length === 0) return null;

  // Check if any distractor in this group is missing caption
  const hasMissingCaption = distractors.some((d) => !d.caption || d.caption.trim() === '');
  const missingCount = distractors.filter((d) => !d.caption || d.caption.trim() === '').length;

  return (
    <div className="space-y-2">
      {/* Group header - clickable to fold/unfold */}
      <div
        className={`flex items-center justify-between px-2 py-1.5 rounded-md transition-all ${
          hasMissingCaption
            ? 'bg-red-500/10 hover:bg-red-500/15 ring-1 ring-red-500/30'
            : 'bg-slate-800/40 hover:bg-slate-800/60'
        }`}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2.5 flex-1"
        >
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span
            className="px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm"
            style={{ backgroundColor: eventInfo.color }}
          >
            {eventInfo.code}
          </span>
          <span className="text-sm font-medium text-slate-300">{eventInfo.fullName}</span>
          <span className="text-xs text-slate-500 font-mono">{distractors.length}</span>
          {hasMissingCaption && (
            <span className="text-xs text-red-400 font-medium">⚠ {missingCount} missing</span>
          )}
        </button>
        {/* Add new distractor button */}
        {onAddDistractor && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const videoIdx = activeVideoIndex === -1 ? 0 : activeVideoIndex;
              onAddDistractor(eventInfo.code, videoIdx);
            }}
            className="p-1 rounded text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors"
            title={`Add new ${eventInfo.fullName} distractor`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Group content */}
      {isExpanded && (
        <div className="pl-2 space-y-2">
          {distractors.map((distractor) => (
            <SceneDistractorCard
              key={distractor.id}
              distractor={distractor}
              eventInfo={eventInfo}
              isSelected={selectedDistractorId === distractor.id}
              showVideoIndex={showVideoIndex}
              onSelect={() => onSelectDistractor(distractor.id)}
              onUpdate={(updates) => onUpdateDistractor(distractor.id, updates)}
              onDelete={() => onDeleteDistractor(distractor.id)}
              onMarkAsTrueLabel={() => onMarkAsTrueLabel(distractor)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
