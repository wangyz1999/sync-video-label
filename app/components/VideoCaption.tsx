'use client';

import { useState, useRef, useEffect } from 'react';
import { LabelEntry, EventTypeInfo, EVENT_TYPES, EventType } from '../types';
import type { CaptionAlignment } from './SettingsModal';

interface VideoCaptionProps {
  labels: LabelEntry[];
  currentTime: number;
  videoIndex: number;
  fontSize?: number; // Font size in pixels
  alignment?: CaptionAlignment; // Horizontal alignment
  visibleTypes?: Set<EventType>; // Filter: which label types to show
}

// Get event type info helper
const getEventTypeInfo = (type: string): EventTypeInfo => {
  return EVENT_TYPES.find((e) => e.code === type) || EVENT_TYPES[0];
};

// Check if the event type is an action type (SA or OA)
const isActionType = (type: string) => type === 'SA' || type === 'OA';
// Check if the event type is a state type (SS or OS)
const isStateType = (type: string) => type === 'SS' || type === 'OS';

// Format label display text based on type
const formatLabelDisplay = (label: LabelEntry): string => {
  if (isActionType(label.type)) {
    // Action: "action to intent"
    const action = label.caption || '';
    const intent = label.intent || '';
    if (action && intent) {
      return `${action} to ${intent}`;
    }
    return action;
  } else if (isStateType(label.type)) {
    // State: "variable is value"
    const variable = label.caption || '';
    const value = label.value || '';
    if (variable && value) {
      return `${variable} is ${value}`;
    }
    return variable;
  }
  // World types: just caption
  return label.caption || '';
};

export function VideoCaption({
  labels,
  currentTime,
  videoIndex,
  fontSize = 14,
  alignment = 'center',
  visibleTypes,
}: VideoCaptionProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter labels that are currently active (current time is within their range)
  // and belong to this video, and match visible types filter
  const activeLabels = labels.filter((label) => {
    const belongsToVideo = (label.videoIndex ?? 0) === videoIndex;
    // Add small tolerance (0.2s) to end time to prevent caption flash during loop playback
    const isInTimeRange = currentTime >= label.startTime && currentTime <= label.endTime + 0.2;
    const hasCaption = label.caption && label.caption.trim() !== '';
    const isTypeVisible = !visibleTypes || visibleTypes.has(label.type);
    return belongsToVideo && isInTimeRange && hasCaption && isTypeVisible;
  });

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setPosition({ x: position.x + deltaX, y: position.y + deltaY });
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  if (activeLabels.length === 0) {
    return null;
  }

  const alignmentClass =
    alignment === 'left'
      ? 'items-start pl-4'
      : alignment === 'right'
        ? 'items-end pr-4'
        : 'items-center';

  return (
    <div
      ref={containerRef}
      className={`absolute inset-x-0 bottom-0 flex flex-col gap-1 pb-4 ${alignmentClass}`}
      style={{
        zIndex: 20,
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {activeLabels.map((label) => {
        const eventInfo = getEventTypeInfo(label.type);

        return (
          <div
            key={label.id}
            className="px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm"
            style={{
              backgroundColor: `${eventInfo.color}cc`, // ~80% opacity
              maxWidth: '90%',
              pointerEvents: 'auto',
            }}
          >
            {/* Type badge inline with caption (e.g., SA1, OA2) */}
            <span
              className="font-bold mr-2 px-1.5 py-0.5 rounded bg-black/30 text-white/90"
              style={{ fontSize: fontSize * 0.7 }}
            >
              {label.type}
              {(label.videoIndex ?? 0) + 1}
            </span>

            {/* Caption text */}
            <span className="font-medium text-white leading-tight" style={{ fontSize }}>
              {formatLabelDisplay(label)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
