'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { LabelEntry, EventTypeInfo } from '../types';
import { LabelCard } from './LabelCard';

interface LabelGroupProps {
  eventInfo: EventTypeInfo;
  labels: LabelEntry[];
  selectedLabelId: string | null;
  focusedLabelId?: string | null; // Label to focus and scroll into view
  videoDuration: number;
  onSelectLabel: (id: string) => void;
  onUpdateLabel: (id: string, updates: Partial<LabelEntry>) => void;
  onDeleteLabel: (id: string) => void;
  onMarkAsSceneDistractor?: (label: LabelEntry) => void;
  onPlaySegment?: (startTime: number) => void;
  showVideoIndex?: boolean;
}

export function LabelGroup({
  eventInfo,
  labels,
  selectedLabelId,
  focusedLabelId,
  videoDuration,
  onSelectLabel,
  onUpdateLabel,
  onDeleteLabel,
  onMarkAsSceneDistractor,
  onPlaySegment,
  showVideoIndex = false,
}: LabelGroupProps) {
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null);
  const labelRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevFocusedLabelIdRef = useRef<string | null>(null);

  // Check if this group contains the focused label
  const containsFocusedLabel = useMemo(() => {
    return focusedLabelId ? labels.some((l) => l.id === focusedLabelId) : false;
  }, [focusedLabelId, labels]);

  // Compute expanded state: auto-expand if focused, otherwise use manual state
  const isExpanded = manualExpanded !== null ? manualExpanded : containsFocusedLabel || true;

  // Handle manual toggle - this resets auto-expand behavior
  const handleToggle = () => {
    setManualExpanded((prev) => (prev === null ? false : !prev));
  };

  // Reset manual state and scroll to focused label when focus changes
  useEffect(() => {
    if (
      focusedLabelId &&
      focusedLabelId !== prevFocusedLabelIdRef.current &&
      containsFocusedLabel
    ) {
      // Reset manual state to allow auto-expansion
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setManualExpanded(null);

      // Scroll to the label card after expansion
      setTimeout(() => {
        const labelElement = labelRefs.current.get(focusedLabelId);
        if (labelElement) {
          labelElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    }
    prevFocusedLabelIdRef.current = focusedLabelId ?? null;
  }, [focusedLabelId, containsFocusedLabel]);

  if (labels.length === 0) return null;

  // Check if any label in this group is missing required fields (only caption is required)
  const hasMissingFields = labels.some((l) => !l.caption || l.caption.trim() === '');
  const missingCount = labels.filter((l) => !l.caption || l.caption.trim() === '').length;

  return (
    <div className="space-y-2">
      {/* Group header - clickable to fold/unfold */}
      <button
        onClick={handleToggle}
        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-all ${
          hasMissingFields
            ? 'bg-red-500/10 hover:bg-red-500/15 ring-1 ring-red-500/30'
            : 'bg-slate-800/40 hover:bg-slate-800/60'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm"
            style={{ backgroundColor: eventInfo.color }}
          >
            {eventInfo.code}
          </span>
          <span className="text-sm font-medium text-slate-300">{eventInfo.fullName}</span>
          <span className="text-xs text-slate-500 font-mono">{labels.length}</span>
          {hasMissingFields && (
            <span className="text-xs text-red-400 font-medium">⚠ {missingCount} missing</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Group content */}
      {isExpanded && (
        <div className="pl-2 space-y-2">
          {labels.map((label) => (
            <div
              key={label.id}
              ref={(el) => {
                if (el) labelRefs.current.set(label.id, el);
                else labelRefs.current.delete(label.id);
              }}
            >
              <LabelCard
                label={label}
                eventInfo={eventInfo}
                isSelected={selectedLabelId === label.id}
                isFocused={focusedLabelId === label.id}
                videoDuration={videoDuration}
                showVideoIndex={showVideoIndex}
                onSelect={() => onSelectLabel(label.id)}
                onUpdate={(updates) => onUpdateLabel(label.id, updates)}
                onDelete={() => onDeleteLabel(label.id)}
                onMarkAsSceneDistractor={
                  onMarkAsSceneDistractor ? () => onMarkAsSceneDistractor(label) : undefined
                }
                onPlaySegment={onPlaySegment}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
