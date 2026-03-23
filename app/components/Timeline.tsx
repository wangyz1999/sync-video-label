'use client';

import { useRef, useState, useEffect, MouseEvent } from 'react';
import { LabelEntry, EventType, EVENT_TYPES } from '../types';
import { TimelineLabel } from './TimelineLabel';
import { ContextMenu, ContextMenuItem, ContextMenuIcons } from './ContextMenu';
import {
  formatTime,
  getTimelinePosition,
  getTimeFromPosition,
  calculateLabelRows,
  getTotalRows,
  generateTimelineTicks,
} from '../utils/timeline';

interface TimelineProps {
  duration: number;
  currentTime: number;
  labels: LabelEntry[];
  selectedLabelId: string | null;
  selectedEventType: EventType;
  videoCount?: number; // Number of available videos for "Switch Video" feature
  visibleTypes?: Set<EventType>; // Controlled visible types (optional)
  onSeek: (time: number) => void;
  onSelectLabel: (id: string | null) => void;
  onUpdateLabel: (id: string, updates: Partial<LabelEntry>) => void;
  onDeleteLabel: (id: string) => void;
  onDuplicateLabel: (id: string) => void;
  onCreateLabel: (type: EventType, startTime: number, endTime: number) => void;
  onSelectEventType: (type: EventType) => void;
  onPlaySegment?: (startTime: number) => void;
  onLoopPlaySegment?: (startTime: number, endTime: number) => void;
  onSwitchLabelVideo?: (labelId: string, newVideoIndex: number) => void;
  onMarkAsSceneDistractor?: (label: LabelEntry) => void;
  onVisibleTypesChange?: (visibleTypes: Set<EventType>) => void; // Callback when filter changes
  onFocusLabelCard?: (label: LabelEntry) => void; // Callback to focus on label card in panel
}

const TICK_HEIGHT = 28;
const ROW_HEIGHT = 22;
const MIN_TIMELINE_HEIGHT = 80;
const DEFAULT_TIMELINE_HEIGHT = 120;
const MAX_TIMELINE_HEIGHT = 400;

interface LabelContextMenuState {
  type: 'label';
  labelId: string;
  x: number;
  y: number;
}

interface EmptyContextMenuState {
  type: 'empty';
  x: number;
  y: number;
  time: number; // Time position where right-click occurred
}

type ContextMenuState = LabelContextMenuState | EmptyContextMenuState;

export function Timeline({
  duration,
  currentTime,
  labels,
  selectedLabelId,
  selectedEventType,
  videoCount = 1,
  visibleTypes: controlledVisibleTypes,
  onSeek,
  onSelectLabel,
  onUpdateLabel,
  onDeleteLabel,
  onDuplicateLabel,
  onCreateLabel,
  onSelectEventType,
  onPlaySegment,
  onLoopPlaySegment,
  onSwitchLabelVideo,
  onMarkAsSceneDistractor,
  onVisibleTypesChange,
  onFocusLabelCard,
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [isDraggingRange, setIsDraggingRange] = useState(false);
  const [isDraggingResize, setIsDraggingResize] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [timelineHeight, setTimelineHeight] = useState(DEFAULT_TIMELINE_HEIGHT);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);

  // Filter state: which label types are visible (all visible by default)
  // Can be controlled externally or managed internally
  const [internalVisibleTypes, setInternalVisibleTypes] = useState<Set<EventType>>(
    new Set(EVENT_TYPES.map((e) => e.code))
  );

  // Use controlled value if provided, otherwise use internal state
  const visibleTypes = controlledVisibleTypes ?? internalVisibleTypes;

  // Update visible types (handles both controlled and uncontrolled modes)
  const updateVisibleTypes = (newTypes: Set<EventType>) => {
    if (onVisibleTypesChange) {
      onVisibleTypesChange(newTypes);
    }
    if (!controlledVisibleTypes) {
      setInternalVisibleTypes(newTypes);
    }
  };

  // Toggle visibility of a label type
  const toggleTypeVisibility = (type: EventType) => {
    const next = new Set(visibleTypes);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    updateVisibleTypes(next);
  };

  // Show all / hide all helpers
  const showAllTypes = () => updateVisibleTypes(new Set(EVENT_TYPES.map((e) => e.code)));
  const hideAllTypes = () => updateVisibleTypes(new Set());

  // Filter labels based on visible types
  const filteredLabels = labels.filter((l) => visibleTypes.has(l.type));

  // Calculate row assignments for filtered labels
  const rowMap = calculateLabelRows(filteredLabels);
  const totalRows = Math.max(getTotalRows(rowMap), 1);
  const minHeightForRows = TICK_HEIGHT + totalRows * ROW_HEIGHT + 16;

  const ticks = generateTimelineTicks(duration);

  const getEventTypeInfo = (type: EventType) => {
    return EVENT_TYPES.find((e) => e.code === type) || EVENT_TYPES[0];
  };

  const handleTimelineMouseDown = (e: MouseEvent) => {
    if (!timelineRef.current || !duration || editingLabelId) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;

    // Check if clicking on playhead area (top part)
    if (y < TICK_HEIGHT) {
      setIsDraggingPlayhead(true);
      const time = getTimeFromPosition(e.clientX, rect, duration, false);
      onSeek(time);
    } else {
      // Clicking in labels area - deselect any selected label first
      onSelectLabel(null);

      // Start creating a new label
      setIsDraggingRange(true);
      const time = getTimeFromPosition(e.clientX, rect, duration, true);
      setDragStart(time);
      setDragEnd(time);
    }
  };

  const handleTimelineMouseMove = (e: MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();

    if (isDraggingPlayhead) {
      const time = getTimeFromPosition(e.clientX, rect, duration, false);
      onSeek(time);
    } else if (isDraggingRange && dragStart !== null) {
      const time = getTimeFromPosition(e.clientX, rect, duration, true);
      setDragEnd(time);
    }
  };

  const handleTimelineMouseUp = () => {
    if (isDraggingRange && dragStart !== null && dragEnd !== null) {
      const start = Math.min(dragStart, dragEnd);
      const end = Math.max(dragStart, dragEnd);

      if (end > start) {
        onCreateLabel(selectedEventType, start, end);
      }
    }

    setIsDraggingPlayhead(false);
    setIsDraggingRange(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // Handle context menu for labels
  const handleLabelContextMenu = (labelId: string, x: number, y: number) => {
    setContextMenu({ type: 'label', labelId, x, y });
  };

  // Handle context menu for empty timeline area
  const handleEmptyContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    if (!timelineRef.current || !duration) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;

    // Only show context menu if clicking in the labels area (below tick marks)
    if (y >= TICK_HEIGHT) {
      const time = getTimeFromPosition(e.clientX, rect, duration, true);
      setContextMenu({ type: 'empty', x: e.clientX, y: e.clientY, time });
    }
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Handle editing state change from TimelineLabel
  const handleEditingChange = (labelId: string | null) => {
    setEditingLabelId(labelId);
  };

  // Trigger edit for a specific label (from context menu)
  const triggerEditLabel = (labelId: string) => {
    onSelectLabel(labelId);
    // Set the editing label ID - the TimelineLabel will pick this up via isEditingExternal prop
    setEditingLabelId(labelId);
  };

  // Get context menu items for a label
  const getLabelContextMenuItems = (labelId: string): ContextMenuItem[] => {
    const label = labels.find((l) => l.id === labelId);
    if (!label) return [];

    const currentVideoIndex = label.videoIndex ?? 0;

    // Generate submenu items for "Switch Video" (exclude current video)
    const switchVideoSubmenu =
      videoCount > 1
        ? Array.from({ length: videoCount }, (_, i) => i)
            .filter((i) => i !== currentVideoIndex)
            .map((i) => ({
              label: `Video ${i + 1}`,
              value: i,
            }))
        : [];

    // Generate submenu items for "Change Label Type" (exclude current type)
    const changeLabelTypeSubmenu = EVENT_TYPES.filter((evt) => evt.code !== label.type).map(
      (evt) => ({
        label: evt.fullName,
        value: evt.code,
        color: evt.color,
      })
    );

    const items: ContextMenuItem[] = [
      {
        label: 'Play segment',
        icon: ContextMenuIcons.play,
        onClick: () => onPlaySegment?.(label.startTime),
      },
      {
        label: 'Loop Play',
        icon: ContextMenuIcons.loop,
        onClick: () => onLoopPlaySegment?.(label.startTime, label.endTime),
      },
      {
        label: 'Edit here',
        icon: ContextMenuIcons.edit,
        onClick: () => triggerEditLabel(labelId),
      },
      {
        label: 'Focus Label Card',
        icon: ContextMenuIcons.focus,
        onClick: () => onFocusLabelCard?.(label),
      },
      {
        label: 'Duplicate',
        icon: ContextMenuIcons.duplicate,
        onClick: () => onDuplicateLabel(labelId),
      },
      {
        label: 'Change Label Type',
        icon: ContextMenuIcons.changeType,
        onClick: () => {},
        submenu: changeLabelTypeSubmenu,
        onSubmenuSelect: (value) => {
          onUpdateLabel(labelId, { type: value as EventType });
        },
      },
    ];

    // Add "Switch Video" option if there are multiple videos
    if (videoCount > 1 && onSwitchLabelVideo) {
      items.push({
        label: 'Switch Video',
        icon: ContextMenuIcons.switchVideo,
        onClick: () => {},
        submenu: switchVideoSubmenu,
        onSubmenuSelect: (value) => {
          onSwitchLabelVideo(labelId, value as number);
        },
      });
    }

    // Add "Mark as Scene Distractor" option
    if (onMarkAsSceneDistractor) {
      items.push({
        label: 'Mark as Scene Distractor',
        icon: ContextMenuIcons.distractor,
        onClick: () => onMarkAsSceneDistractor(label),
      });
    }

    items.push(
      { label: '', divider: true, onClick: () => {} },
      {
        label: 'Delete',
        icon: ContextMenuIcons.delete,
        onClick: () => onDeleteLabel(labelId),
        danger: true,
      }
    );

    return items;
  };

  // Get context menu items for empty timeline area (add label)
  const getEmptyContextMenuItems = (time: number): ContextMenuItem[] => {
    // Generate submenu items for all label types
    const addLabelSubmenu = EVENT_TYPES.map((evt) => ({
      label: evt.fullName,
      value: evt.code,
      color: evt.color,
    }));

    return [
      {
        label: 'Add Label',
        icon: ContextMenuIcons.addLabel,
        onClick: () => {},
        submenu: addLabelSubmenu,
        onSubmenuSelect: (value) => {
          // Create a 1-second label at the clicked position
          const startTime = time;
          const endTime = Math.min(time + 1, Math.floor(duration));
          if (endTime > startTime) {
            onCreateLabel(value as EventType, startTime, endTime);
          }
        },
      },
    ];
  };

  // Get context menu items based on menu state
  const getContextMenuItems = (): ContextMenuItem[] => {
    if (!contextMenu) return [];
    if (contextMenu.type === 'label') {
      return getLabelContextMenuItems(contextMenu.labelId);
    } else {
      return getEmptyContextMenuItems(contextMenu.time);
    }
  };

  // Handle resize drag
  const handleResizeMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingResize(true);
  };

  useEffect(() => {
    if (!isDraggingResize) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const newHeight = e.clientY - rect.top;
      setTimelineHeight(Math.max(MIN_TIMELINE_HEIGHT, Math.min(MAX_TIMELINE_HEIGHT, newHeight)));
    };

    const handleMouseUp = () => {
      setIsDraggingResize(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingResize]);

  // Global mouse up handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDraggingPlayhead || isDraggingRange) {
        if (isDraggingRange && dragStart !== null && dragEnd !== null) {
          const start = Math.min(dragStart, dragEnd);
          const end = Math.max(dragStart, dragEnd);

          if (end > start) {
            onCreateLabel(selectedEventType, start, end);
          }
        }

        setIsDraggingPlayhead(false);
        setIsDraggingRange(false);
        setDragStart(null);
        setDragEnd(null);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDraggingPlayhead, isDraggingRange, dragStart, dragEnd, selectedEventType, onCreateLabel]);

  // Render drag preview
  const renderDragPreview = () => {
    if (!isDraggingRange || dragStart === null || dragEnd === null) return null;
    const start = Math.min(dragStart, dragEnd);
    const end = Math.max(dragStart, dragEnd);
    if (end <= start) return null;

    const eventInfo = getEventTypeInfo(selectedEventType);

    return (
      <div
        className="absolute rounded opacity-50 pointer-events-none"
        style={{
          left: getTimelinePosition(start, duration),
          width: `${((end - start) / duration) * 100}%`,
          backgroundColor: eventInfo.color,
          height: ROW_HEIGHT - 4,
          top: TICK_HEIGHT,
        }}
      />
    );
  };

  if (!duration) {
    return (
      <div className="h-24 bg-slate-900 rounded-lg flex items-center justify-center text-slate-500">
        Load a video to see the timeline
      </div>
    );
  }

  const effectiveHeight = Math.max(timelineHeight, minHeightForRows);

  return (
    <div className="space-y-3">
      {/* Timeline */}
      <div className="relative">
        <div
          ref={timelineRef}
          className="relative bg-slate-900 rounded-lg overflow-y-auto overflow-x-hidden select-none"
          style={{ height: effectiveHeight }}
          onMouseDown={handleTimelineMouseDown}
          onMouseMove={handleTimelineMouseMove}
          onMouseUp={handleTimelineMouseUp}
          onContextMenu={handleEmptyContextMenu}
          onMouseLeave={() => {
            if (isDraggingPlayhead) {
              setIsDraggingPlayhead(false);
            }
          }}
        >
          {/* Tick marks */}
          <div className="absolute inset-x-0 top-0 h-7 cursor-pointer z-10 bg-slate-900">
            {ticks.map(({ time, isMajor }) => (
              <div
                key={time}
                className="absolute top-0"
                style={{ left: getTimelinePosition(time, duration) }}
              >
                <div className={`w-px ${isMajor ? 'h-4 bg-slate-400' : 'h-2 bg-slate-600'}`} />
                {isMajor && (
                  <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap">
                    {formatTime(time)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Label bars */}
          {filteredLabels.map((label) => {
            const eventInfo = getEventTypeInfo(label.type);
            const row = rowMap.get(label.id) ?? 0;

            return (
              <TimelineLabel
                key={label.id}
                label={label}
                eventInfo={eventInfo}
                row={row}
                rowHeight={ROW_HEIGHT}
                topOffset={TICK_HEIGHT}
                duration={duration}
                isSelected={selectedLabelId === label.id}
                isEditingExternal={editingLabelId === label.id}
                onSelect={() => onSelectLabel(label.id)}
                onUpdate={(updates) => onUpdateLabel(label.id, updates)}
                onContextMenu={handleLabelContextMenu}
                onEditingChange={handleEditingChange}
                onCtrlClick={onFocusLabelCard}
                timelineRef={timelineRef}
              />
            );
          })}

          {/* Drag preview */}
          {renderDragPreview()}

          {/* Playhead */}
          <div
            className={`absolute top-0 w-0.5 bg-amber-400 z-20 ${
              isDraggingPlayhead ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              left: getTimelinePosition(currentTime, duration),
              height: Math.max(effectiveHeight, minHeightForRows),
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingPlayhead(true);
            }}
          >
            {/* Half triangle / downward arrow indicator */}
            <svg
              className="absolute -top-0.5 -left-[5px]"
              width="12"
              height="10"
              viewBox="0 0 12 10"
            >
              <path d="M6 10L0 0h12L6 10z" fill="#fbbf24" />
            </svg>
          </div>
        </div>

        {/* Resize handle */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-slate-800 hover:bg-slate-700 rounded-b-lg flex items-center justify-center transition-colors"
          onMouseDown={handleResizeMouseDown}
        >
          <div className="w-12 h-1 bg-slate-600 rounded" />
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems()}
          onClose={closeContextMenu}
        />
      )}

      {/* Event type selector and filter */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Label type selector (for creating new labels) */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-400 mr-2">Add Label:</span>
          {EVENT_TYPES.map((evt) => (
            <button
              key={evt.code}
              onClick={() => onSelectEventType(evt.code)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedEventType === evt.code
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950'
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: evt.color }}
              title={`${evt.fullName}: ${evt.description}`}
            >
              {evt.code}
            </button>
          ))}
        </div>

        {/* Filter visibility toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-400 mr-1">Filter:</span>
          {EVENT_TYPES.map((evt) => {
            const isVisible = visibleTypes.has(evt.code);
            const count = labels.filter((l) => l.type === evt.code).length;
            return (
              <button
                key={evt.code}
                onClick={() => toggleTypeVisibility(evt.code)}
                className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                  isVisible ? 'text-white' : 'text-white/40 opacity-40'
                }`}
                style={{ backgroundColor: isVisible ? evt.color : `${evt.color}40` }}
                title={`${isVisible ? 'Hide' : 'Show'} ${evt.fullName} (${count})`}
              >
                {evt.code}
                {count > 0 && <span className="ml-1 text-[10px] opacity-75">{count}</span>}
              </button>
            );
          })}
          <div className="flex gap-1 ml-1">
            <button
              onClick={showAllTypes}
              className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
              title="Show all label types"
            >
              All
            </button>
            <button
              onClick={hideAllTypes}
              className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
              title="Hide all label types"
            >
              None
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="text-xs text-slate-600 flex gap-4 flex-wrap">
        <span>← → : Move 1 second</span>
        <span>Ctrl + ← → : Move 1 frame</span>
        <span>Space : Play/Pause</span>
        <span>Del : Delete selected</span>
        <span>Double-click : Edit caption</span>
        <span>Ctrl + Click : Focus card</span>
        <span>Right-click : Context menu</span>
      </div>
    </div>
  );
}
