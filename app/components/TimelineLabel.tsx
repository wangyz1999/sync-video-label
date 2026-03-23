'use client';

import { useState, useRef, useEffect, MouseEvent, KeyboardEvent } from 'react';
import { LabelEntry, EventTypeInfo } from '../types';
import { getTimelinePosition } from '../utils/timeline';

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
    return action || '⚠';
  } else if (isStateType(label.type)) {
    // State: "variable is value"
    const variable = label.caption || '';
    const value = label.value || '';
    if (variable && value) {
      return `${variable} is ${value}`;
    }
    return variable || '⚠';
  }
  // World types: just caption
  return label.caption || '⚠';
};

interface TimelineLabelProps {
  label: LabelEntry;
  eventInfo: EventTypeInfo;
  row: number;
  rowHeight: number;
  topOffset: number;
  duration: number;
  isSelected: boolean;
  isEditingExternal: boolean; // Triggered from context menu "Edit here"
  onSelect: () => void;
  onUpdate: (updates: Partial<LabelEntry>) => void;
  onContextMenu: (labelId: string, x: number, y: number) => void;
  onEditingChange: (labelId: string | null) => void;
  onCtrlClick?: (label: LabelEntry) => void; // Ctrl+click to focus label card
  timelineRef: React.RefObject<HTMLDivElement | null>;
}

type DragMode = 'none' | 'move' | 'resize-start' | 'resize-end';

export function TimelineLabel({
  label,
  eventInfo,
  row,
  rowHeight,
  topOffset,
  duration,
  isSelected,
  isEditingExternal,
  onSelect,
  onUpdate,
  onContextMenu,
  onEditingChange,
  onCtrlClick,
  timelineRef,
}: TimelineLabelProps) {
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [dragStartX, setDragStartX] = useState(0);
  const [originalStart, setOriginalStart] = useState(0);
  const [originalEnd, setOriginalEnd] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  // For action types: editValue = caption (action), editValue2 = intent
  // For state types: editValue = caption (variable), editValue2 = value
  // For world types: editValue = caption
  const [editValue, setEditValue] = useState(label.caption);
  const [editValue2, setEditValue2] = useState(
    isActionType(label.type) ? label.intent || '' : label.value || ''
  );

  const labelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);

  // Check if caption is missing
  const isMissingCaption = !label.caption || label.caption.trim() === '';

  const startEditing = () => {
    setIsEditing(true);
    setEditValue(label.caption);
    setEditValue2(isActionType(label.type) ? label.intent || '' : label.value || '');
    onEditingChange(label.id);
  };

  // Sync edit values with label when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditValue(label.caption);
      setEditValue2(isActionType(label.type) ? label.intent || '' : label.value || '');
    }
  }, [label.caption, label.intent, label.value, label.type, isEditing]);

  // Start editing when triggered externally (from context menu "Edit here")
  useEffect(() => {
    if (isEditingExternal && !isEditing) {
      startEditing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditingExternal, isEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 10);
    }
  }, [isEditing]);

  const handleMouseDown = (e: MouseEvent, mode: DragMode) => {
    if (isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    setDragMode(mode);
    setDragStartX(e.clientX);
    setOriginalStart(label.startTime);
    setOriginalEnd(label.endTime);
  };

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    onContextMenu(label.id, e.clientX, e.clientY);
  };

  const handleDoubleClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startEditing();
  };

  const finishEditing = () => {
    setIsEditing(false);
    if (isActionType(label.type)) {
      onUpdate({ caption: editValue, intent: editValue2 || undefined });
    } else if (isStateType(label.type)) {
      onUpdate({ caption: editValue, value: editValue2 || undefined });
    } else {
      onUpdate({ caption: editValue });
    }
    onEditingChange(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditValue(label.caption);
    setEditValue2(isActionType(label.type) ? label.intent || '' : label.value || '');
    onEditingChange(null);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Don't finish editing if focus is moving to the other input in the same label
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget && labelRef.current?.contains(relatedTarget)) {
      return;
    }
    finishEditing();
  };

  useEffect(() => {
    if (dragMode === 'none') return;

    const getTimeFromX = (clientX: number): number => {
      if (!timelineRef.current) return 0;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const ratio = x / rect.width;
      return Math.max(0, Math.min(Math.round(ratio * duration), Math.floor(duration)));
    };

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const curTime = getTimeFromX(e.clientX);
      const deltaTime = curTime - getTimeFromX(dragStartX);

      switch (dragMode) {
        case 'move': {
          const labelDuration = originalEnd - originalStart;
          let newStart = originalStart + deltaTime;
          let newEnd = originalEnd + deltaTime;

          // Clamp to bounds
          if (newStart < 0) {
            newStart = 0;
            newEnd = labelDuration;
          }
          if (newEnd > Math.floor(duration)) {
            newEnd = Math.floor(duration);
            newStart = newEnd - labelDuration;
          }

          onUpdate({ startTime: newStart, endTime: newEnd });
          break;
        }
        case 'resize-start': {
          const newStart = Math.max(0, Math.min(originalStart + deltaTime, originalEnd - 1));
          onUpdate({ startTime: newStart });
          break;
        }
        case 'resize-end': {
          const newEnd = Math.max(
            originalStart + 1,
            Math.min(originalEnd + deltaTime, Math.floor(duration))
          );
          onUpdate({ endTime: newEnd });
          break;
        }
      }
    };

    const handleMouseUp = () => {
      setDragMode('none');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragMode, dragStartX, originalStart, originalEnd, duration, onUpdate, timelineRef]);

  const left = getTimelinePosition(label.startTime, duration);
  const width = `${((label.endTime - label.startTime) / duration) * 100}%`;
  const top = topOffset + row * rowHeight;

  return (
    <div
      ref={labelRef}
      className={`absolute flex items-center rounded cursor-pointer transition-shadow ${
        isSelected
          ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 z-10'
          : isMissingCaption
            ? 'ring-2 ring-red-500 ring-offset-1 ring-offset-slate-900'
            : 'hover:brightness-110'
      }`}
      style={{
        left,
        width,
        height: rowHeight - 4,
        top,
        backgroundColor: eventInfo.color,
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (isEditing) return;

        // Ctrl+click to focus label card
        if (e.ctrlKey && onCtrlClick) {
          onCtrlClick(label);
        } else {
          onSelect();
        }
      }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      title={
        isEditing
          ? ''
          : `${label.type}${(label.videoIndex ?? 0) + 1} (Video ${(label.videoIndex ?? 0) + 1}): ${formatLabelDisplay(label) || '(no caption - double-click to edit)'}\nRight-click for options`
      }
    >
      {/* Resize handle - start */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-l"
        onMouseDown={(e) => handleMouseDown(e, 'resize-start')}
      />

      {/* Label content */}
      {isEditing ? (
        isActionType(label.type) ? (
          // Action types (SA/OA): action "to" intent
          <div className="flex-1 flex items-center gap-0.5 mx-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onBlur={handleInputBlur}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 px-1 text-[10px] bg-white/90 text-slate-900 rounded outline-none"
              placeholder="action..."
            />
            <span className="text-[9px] text-white/80 font-medium px-0.5 shrink-0">to</span>
            <input
              ref={input2Ref}
              type="text"
              value={editValue2}
              onChange={(e) => setEditValue2(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onBlur={handleInputBlur}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 px-1 text-[10px] bg-white/90 text-slate-900 rounded outline-none"
              placeholder="intent..."
            />
          </div>
        ) : isStateType(label.type) ? (
          // State types (SS/OS): variable "is" value
          <div className="flex-1 flex items-center gap-0.5 mx-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onBlur={handleInputBlur}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 px-1 text-[10px] bg-white/90 text-slate-900 rounded outline-none"
              placeholder="variable..."
            />
            <span className="text-[9px] text-white/80 font-medium px-0.5 shrink-0">is</span>
            <input
              ref={input2Ref}
              type="text"
              value={editValue2}
              onChange={(e) => setEditValue2(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onBlur={handleInputBlur}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 px-1 text-[10px] bg-white/90 text-slate-900 rounded outline-none"
              placeholder="value..."
            />
          </div>
        ) : (
          // World types (WO/WE): single caption
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex-1 mx-2 px-1 text-[10px] bg-white/90 text-slate-900 rounded outline-none"
            placeholder="Enter caption..."
          />
        )
      ) : (
        <span className="text-[10px] text-white px-2 truncate flex-1 pointer-events-none select-none">
          {label.type}
          {(label.videoIndex ?? 0) + 1}
          {label.caption ? `: ${formatLabelDisplay(label)}` : ' ⚠'}
        </span>
      )}

      {/* Resize handle - end */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-r"
        onMouseDown={(e) => handleMouseDown(e, 'resize-end')}
      />
    </div>
  );
}
