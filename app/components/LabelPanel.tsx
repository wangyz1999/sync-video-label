'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  LabelEntry,
  EventType,
  EventTypeInfo,
  EVENT_TYPES,
  SceneDistractor,
  CausalRelation,
  CustomQuestion,
} from '../types';
import { LabelGroup } from './LabelGroup';
import { SceneDistractorGroup } from './SceneDistractorGroup';
import { CausalGroup } from './CausalGroup';
import { CustomQuestionCard } from './CustomQuestionCard';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'warning' | 'danger' | 'info';
}

interface LabelPanelProps {
  labels: LabelEntry[];
  selectedLabelId: string | null;
  selectedDistractorId: string | null;
  focusedLabelId?: string | null; // Label to focus and scroll into view
  videoDuration: number;
  hasExported: boolean;
  hasVideo: boolean;
  lastAutoSave: Date | null;
  onSelectLabel: (id: string | null) => void;
  onSelectDistractor: (id: string | null) => void;
  onUpdateLabel: (id: string, updates: Partial<LabelEntry>) => void;
  onDeleteLabel: (id: string) => void;
  onClearLabels: (videoIndex?: number) => void;
  onClearSceneDistractors?: (videoIndex?: number) => void;
  activeVideoIndex?: number; // -1 means "All", 0+ means specific video
  videoCount?: number;
  onFilterChange?: (index: number) => void; // Callback when filter changes
  labelCounts?: number[]; // Number of labels per video
  // Scene distractors props
  sceneDistractors?: SceneDistractor[];
  onUpdateSceneDistractor?: (id: string, updates: Partial<SceneDistractor>) => void;
  onDeleteSceneDistractor?: (id: string) => void;
  onAddSceneDistractor?: (type: EventType, videoIndex: number) => void;
  // Move between labels and distractors
  onMarkAsSceneDistractor?: (label: LabelEntry) => void;
  onMarkAsTrueLabel?: (distractor: SceneDistractor) => void;
  // Causal relations props
  causalRelations?: CausalRelation[];
  selectedCausalId?: string | null;
  onSelectCausal?: (id: string | null) => void;
  onUpdateCausal?: (id: string, updates: Partial<CausalRelation>) => void;
  onDeleteCausal?: (id: string) => void;
  onAddCausal?: (videoIndex: number) => void;
  onClearCausalRelations?: (videoIndex?: number) => void;
  onSelectCauseLabel?: (relationId: string) => void;
  onSelectEffectLabel?: (relationId: string) => void;
  onSetCauseLabel?: (relationId: string, labelId: string) => void;
  onSetEffectLabel?: (relationId: string, labelId: string) => void;
  // Custom questions props
  customQuestions?: CustomQuestion[];
  selectedCustomQuestionId?: string | null;
  onSelectCustomQuestion?: (id: string | null) => void;
  onUpdateCustomQuestion?: (id: string, updates: Partial<CustomQuestion>) => void;
  onDeleteCustomQuestion?: (id: string) => void;
  onAddCustomQuestion?: (videoIndex: number) => void;
  onClearCustomQuestions?: (videoIndex?: number) => void;
  // Confirm modal function
  onConfirm?: (options: ConfirmOptions) => Promise<boolean>;
  // Play segment callback
  onPlaySegment?: (startTime: number) => void;
}

export function LabelPanel({
  labels,
  selectedLabelId,
  selectedDistractorId,
  focusedLabelId,
  videoDuration,
  hasExported,
  hasVideo,
  lastAutoSave,
  onSelectLabel,
  onSelectDistractor,
  onUpdateLabel,
  onDeleteLabel,
  onClearLabels,
  onClearSceneDistractors,
  activeVideoIndex = 0, // -1 means "All", 0+ means specific video
  videoCount = 1,
  onFilterChange,
  labelCounts = [],
  sceneDistractors = [],
  onUpdateSceneDistractor,
  onDeleteSceneDistractor,
  onAddSceneDistractor,
  onMarkAsSceneDistractor,
  onMarkAsTrueLabel,
  causalRelations = [],
  selectedCausalId,
  onSelectCausal,
  onUpdateCausal,
  onDeleteCausal,
  onAddCausal,
  onClearCausalRelations,
  onSelectCauseLabel,
  onSelectEffectLabel,
  onSetCauseLabel,
  onSetEffectLabel,
  customQuestions = [],
  selectedCustomQuestionId,
  onSelectCustomQuestion,
  onUpdateCustomQuestion,
  onDeleteCustomQuestion,
  onAddCustomQuestion,
  onClearCustomQuestions,
  onConfirm,
  onPlaySegment,
}: LabelPanelProps) {
  // Collapsed state for sections - use manual state + auto-expand logic
  const [manualLabelsCollapsed, setManualLabelsCollapsed] = useState<boolean | null>(null);
  const [isDistractorsCollapsed, setIsDistractorsCollapsed] = useState(false);
  const [isCausalCollapsed, setIsCausalCollapsed] = useState(false);
  const [isCustomQuestionsCollapsed, setIsCustomQuestionsCollapsed] = useState(false);
  const prevFocusedLabelIdRef = useRef<string | null>(null);

  // Check if focused label exists in current labels
  const containsFocusedLabel = useMemo(() => {
    return focusedLabelId ? labels.some((l) => l.id === focusedLabelId) : false;
  }, [focusedLabelId, labels]);

  // Compute collapsed state: auto-expand when focused, otherwise use manual state
  const isLabelsCollapsed =
    manualLabelsCollapsed !== null ? manualLabelsCollapsed : containsFocusedLabel ? false : false;

  // Handle manual toggle
  const handleLabelsToggle = () => {
    setManualLabelsCollapsed((prev) => (prev === null ? true : !prev));
  };

  // Reset manual state when focus changes to allow auto-expansion
  useEffect(() => {
    if (
      focusedLabelId &&
      focusedLabelId !== prevFocusedLabelIdRef.current &&
      containsFocusedLabel
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setManualLabelsCollapsed(null);
    }
    prevFocusedLabelIdRef.current = focusedLabelId ?? null;
  }, [focusedLabelId, containsFocusedLabel]);
  // Filter labels based on activeVideoIndex (-1 = all, 0+ = specific video)
  const isAllFilter = activeVideoIndex === -1;
  const filteredLabels = isAllFilter
    ? labels
    : labels.filter((l) => l.videoIndex === activeVideoIndex);

  // Filter scene distractors based on activeVideoIndex
  const filteredDistractors = isAllFilter
    ? sceneDistractors
    : sceneDistractors.filter((d) => d.videoIndex === activeVideoIndex);

  // Filter causal relations based on activeVideoIndex
  const filteredCausalRelations = isAllFilter
    ? causalRelations
    : causalRelations.filter((c) => c.videoIndex === activeVideoIndex);

  // Filter custom questions based on activeVideoIndex
  const filteredCustomQuestions = isAllFilter
    ? customQuestions
    : customQuestions.filter((q) => q.videoIndex === activeVideoIndex);

  // Group labels by type
  const labelsByType: Record<EventType, LabelEntry[]> = {
    SA: [],
    SS: [],
    OA: [],
    OS: [],
    WO: [],
    WE: [],
  };
  filteredLabels.forEach((l) => {
    labelsByType[l.type].push(l);
  });

  // Group scene distractors by type
  const distractorsByType: Record<EventType, SceneDistractor[]> = {
    SA: [],
    SS: [],
    OA: [],
    OS: [],
    WO: [],
    WE: [],
  };
  filteredDistractors.forEach((d) => {
    distractorsByType[d.type].push(d);
  });

  // Sort labels within each group by start time
  Object.keys(labelsByType).forEach((type) => {
    labelsByType[type as EventType].sort((a, b) => a.startTime - b.startTime);
  });

  // Sort distractors within each group by caption (alphabetically)
  Object.keys(distractorsByType).forEach((type) => {
    distractorsByType[type as EventType].sort((a, b) => a.caption.localeCompare(b.caption));
  });

  // Determine status message
  const getStatusMessage = () => {
    if (hasExported) {
      return { text: '✓ Annotation exported', color: 'text-emerald-400' };
    }
    if (lastAutoSave) {
      return {
        text: `Auto saved at ${lastAutoSave.toLocaleTimeString()}`,
        color: 'text-slate-400',
      };
    }
    return { text: '⚠ Unsaved changes', color: 'text-amber-400' };
  };

  const status = getStatusMessage();

  return (
    <div className="w-full h-full bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-200">Frame Labels</h2>
          {(filteredLabels.length > 0 ||
            filteredDistractors.length > 0 ||
            filteredCustomQuestions.length > 0) && (
            <button
              onClick={async () => {
                const targetLabels =
                  !isAllFilter && videoCount > 1 ? filteredLabels.length : labels.length;
                const targetDistractors =
                  !isAllFilter && videoCount > 1
                    ? filteredDistractors.length
                    : sceneDistractors.length;
                const targetCustomQuestions =
                  !isAllFilter && videoCount > 1
                    ? filteredCustomQuestions.length
                    : customQuestions.length;
                const targetDesc =
                  !isAllFilter && videoCount > 1
                    ? `Video ${activeVideoIndex + 1}`
                    : 'this instance';
                const confirmed = onConfirm
                  ? await onConfirm({
                      title: 'Clear All Labels?',
                      message: `Are you sure you want to delete all ${targetLabels} label(s), ${targetDistractors} scene distractor(s), and ${targetCustomQuestions} custom question(s) for ${targetDesc}?\n\nThis action cannot be undone.`,
                      confirmText: 'Delete All',
                      variant: 'danger',
                    })
                  : window.confirm(
                      `Are you sure you want to delete all ${targetLabels} label(s), ${targetDistractors} scene distractor(s), and ${targetCustomQuestions} custom question(s) for ${targetDesc}?\n\nThis action cannot be undone.`
                    );
                if (confirmed) {
                  const videoIndexArg =
                    !isAllFilter && videoCount > 1 ? activeVideoIndex : undefined;
                  onClearLabels(videoIndexArg);
                  onClearSceneDistractors?.(videoIndexArg);
                  onClearCustomQuestions?.(videoIndexArg);
                }
              }}
              className="px-2 py-1 rounded text-xs font-medium bg-red-900/50 text-red-400 hover:bg-red-900 hover:text-red-300 transition-colors flex items-center gap-1"
              title="Clear all labels and scene distractors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Clear All
            </button>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-1">
          {filteredLabels.length} label{filteredLabels.length !== 1 ? 's' : ''}
          {!isAllFilter && videoCount > 1 && ` for Video ${activeVideoIndex + 1}`}
          {labels.length !== filteredLabels.length && ` (${labels.length} total)`}
        </p>

        {/* Filter tabs for multi-video - matches Timeline's VideoTabs */}
        {videoCount > 1 && (
          <div className="flex items-center gap-1 mt-3 flex-wrap">
            {/* All Videos tab */}
            <button
              onClick={() => onFilterChange?.(-1)}
              className={`px-2 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                isAllFilter
                  ? 'bg-slate-700 text-amber-400 ring-1 ring-amber-400/50'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              <span>All</span>
              {labels.length > 0 && (
                <span
                  className={`px-1 py-0.5 rounded text-[10px] ${
                    isAllFilter ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-500'
                  }`}
                >
                  {labels.length}
                </span>
              )}
            </button>

            {/* Individual video tabs */}
            {Array.from({ length: videoCount }, (_, index) => {
              const labelCount = labelCounts[index] || 0;
              const isActive = activeVideoIndex === index;

              return (
                <button
                  key={index}
                  onClick={() => onFilterChange?.(index)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-700 text-amber-400 ring-1 ring-amber-400/50'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <span>Video {index + 1}</span>
                  {labelCount > 0 && (
                    <span
                      className={`px-1 py-0.5 rounded text-[10px] ${
                        isActive ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-500'
                      }`}
                    >
                      {labelCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Scrollable content area with two sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Section 1: Frame Labels (SA, SS, OA, OS, WO, WE) */}
        <div className="border-b border-slate-800">
          {/* Section header - collapsible */}
          <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors">
            <button onClick={handleLabelsToggle} className="flex items-center gap-2">
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform ${isLabelsCollapsed ? '' : 'rotate-90'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span className="text-sm font-medium text-slate-300">True Labels</span>
              <span className="text-xs text-slate-500">({filteredLabels.length})</span>
            </button>
            {filteredLabels.length > 0 && (
              <button
                onClick={async () => {
                  const targetLabels =
                    !isAllFilter && videoCount > 1 ? filteredLabels.length : labels.length;
                  const targetDesc =
                    !isAllFilter && videoCount > 1
                      ? `Video ${activeVideoIndex + 1}`
                      : 'this instance';
                  const confirmed = onConfirm
                    ? await onConfirm({
                        title: 'Clear True Labels?',
                        message: `Are you sure you want to delete all ${targetLabels} true label(s) for ${targetDesc}?\n\nThis action cannot be undone.`,
                        confirmText: 'Delete',
                        variant: 'danger',
                      })
                    : window.confirm(
                        `Are you sure you want to delete all ${targetLabels} true label(s) for ${targetDesc}?\n\nThis action cannot be undone.`
                      );
                  if (confirmed) {
                    onClearLabels(!isAllFilter && videoCount > 1 ? activeVideoIndex : undefined);
                  }
                }}
                className="p-1 rounded text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                title="Clear all true labels"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Section content */}
          {!isLabelsCollapsed && (
            <div className="px-4 pb-4 space-y-3">
              {filteredLabels.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <svg
                    className="w-10 h-10 mx-auto mb-3 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  <p className="text-sm font-medium">No labels yet</p>
                  <p className="text-xs mt-1">
                    {hasVideo
                      ? !isAllFilter && videoCount > 1
                        ? `No labels for Video ${activeVideoIndex + 1}`
                        : 'Select a label type and drag on the timeline'
                      : 'Import a project to start labeling'}
                  </p>
                </div>
              ) : (
                <>
                  {EVENT_TYPES.map((eventInfo) => (
                    <LabelGroup
                      key={eventInfo.code}
                      eventInfo={eventInfo}
                      labels={labelsByType[eventInfo.code]}
                      selectedLabelId={selectedLabelId}
                      focusedLabelId={focusedLabelId}
                      videoDuration={videoDuration}
                      onSelectLabel={onSelectLabel}
                      onUpdateLabel={onUpdateLabel}
                      onDeleteLabel={onDeleteLabel}
                      onMarkAsSceneDistractor={onMarkAsSceneDistractor}
                      onPlaySegment={onPlaySegment}
                      showVideoIndex={isAllFilter && videoCount > 1}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Scene Distractors */}
        <div className="border-b border-slate-800">
          {/* Section header - collapsible */}
          <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors">
            <button
              onClick={() => setIsDistractorsCollapsed(!isDistractorsCollapsed)}
              className="flex items-center gap-2"
            >
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform ${isDistractorsCollapsed ? '' : 'rotate-90'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span className="text-sm font-medium text-slate-300">Scene Distractors</span>
              <span className="text-xs text-slate-500">({filteredDistractors.length})</span>
              {filteredDistractors.length !== sceneDistractors.length && (
                <span className="text-xs text-slate-600">({sceneDistractors.length} total)</span>
              )}
            </button>
            {filteredDistractors.length > 0 && (
              <button
                onClick={async () => {
                  const targetDistractors =
                    !isAllFilter && videoCount > 1
                      ? filteredDistractors.length
                      : sceneDistractors.length;
                  const targetDesc =
                    !isAllFilter && videoCount > 1
                      ? `Video ${activeVideoIndex + 1}`
                      : 'this instance';
                  const confirmed = onConfirm
                    ? await onConfirm({
                        title: 'Clear Scene Distractors?',
                        message: `Are you sure you want to delete all ${targetDistractors} scene distractor(s) for ${targetDesc}?\n\nThis action cannot be undone.`,
                        confirmText: 'Delete',
                        variant: 'danger',
                      })
                    : window.confirm(
                        `Are you sure you want to delete all ${targetDistractors} scene distractor(s) for ${targetDesc}?\n\nThis action cannot be undone.`
                      );
                  if (confirmed) {
                    onClearSceneDistractors?.(
                      !isAllFilter && videoCount > 1 ? activeVideoIndex : undefined
                    );
                  }
                }}
                className="p-1 rounded text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                title="Clear all scene distractors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Section content - grouped by type (same as frame labels) */}
          {!isDistractorsCollapsed && (
            <div className="px-4 pb-4 space-y-3">
              {filteredDistractors.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center py-4 text-slate-500">
                    <svg
                      className="w-8 h-8 mx-auto mb-2 text-slate-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <p className="text-sm font-medium">No scene distractors yet</p>
                    <p className="text-xs mt-1">
                      {hasVideo
                        ? 'Add a distractor below or use "Mark as Scene Distractor" on frame labels'
                        : 'Import a project to start'}
                    </p>
                  </div>
                  {/* Add new distractor buttons for each type */}
                  {hasVideo && onAddSceneDistractor && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 font-medium">Add new distractor:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {EVENT_TYPES.map((evt) => (
                          <button
                            key={evt.code}
                            onClick={() => {
                              const videoIdx = activeVideoIndex === -1 ? 0 : activeVideoIndex;
                              onAddSceneDistractor(evt.code, videoIdx);
                            }}
                            className="px-2 py-1 rounded text-xs font-medium text-white hover:opacity-80 transition-opacity flex items-center gap-1"
                            style={{ backgroundColor: evt.color }}
                            title={`Add ${evt.fullName} distractor`}
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                            {evt.code}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {EVENT_TYPES.map((eventInfo) => (
                    <SceneDistractorGroup
                      key={eventInfo.code}
                      eventInfo={eventInfo}
                      distractors={distractorsByType[eventInfo.code]}
                      selectedDistractorId={selectedDistractorId}
                      onSelectDistractor={onSelectDistractor}
                      onUpdateDistractor={(id, updates) => onUpdateSceneDistractor?.(id, updates)}
                      onDeleteDistractor={(id) => onDeleteSceneDistractor?.(id)}
                      onMarkAsTrueLabel={(distractor) => onMarkAsTrueLabel?.(distractor)}
                      onAddDistractor={onAddSceneDistractor}
                      activeVideoIndex={activeVideoIndex}
                      showVideoIndex={isAllFilter && videoCount > 1}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Section 3: Causal Relations */}
        <div className="border-b border-slate-800">
          {/* Section header - collapsible */}
          <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors">
            <button
              onClick={() => setIsCausalCollapsed(!isCausalCollapsed)}
              className="flex items-center gap-2"
            >
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform ${isCausalCollapsed ? '' : 'rotate-90'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span className="text-sm font-medium text-slate-300">Causal Relations</span>
              <span className="text-xs text-slate-500">({filteredCausalRelations.length})</span>
              {filteredCausalRelations.length !== causalRelations.length && (
                <span className="text-xs text-slate-600">({causalRelations.length} total)</span>
              )}
            </button>
            <div className="flex items-center gap-1">
              {hasVideo && onAddCausal && (
                <button
                  onClick={() => {
                    const videoIdx = activeVideoIndex === -1 ? 0 : activeVideoIndex;
                    onAddCausal(videoIdx);
                  }}
                  className="p-1 rounded text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors"
                  title="Add causal relation"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              )}
              {filteredCausalRelations.length > 0 && (
                <button
                  onClick={async () => {
                    const targetRelations =
                      !isAllFilter && videoCount > 1
                        ? filteredCausalRelations.length
                        : causalRelations.length;
                    const targetDesc =
                      !isAllFilter && videoCount > 1
                        ? `Video ${activeVideoIndex + 1}`
                        : 'this instance';
                    const confirmed = onConfirm
                      ? await onConfirm({
                          title: 'Clear Causal Relations?',
                          message: `Are you sure you want to delete all ${targetRelations} causal relation(s) for ${targetDesc}?\n\nThis action cannot be undone.`,
                          confirmText: 'Delete',
                          variant: 'danger',
                        })
                      : window.confirm(
                          `Are you sure you want to delete all ${targetRelations} causal relation(s) for ${targetDesc}?\n\nThis action cannot be undone.`
                        );
                    if (confirmed) {
                      onClearCausalRelations?.(
                        !isAllFilter && videoCount > 1 ? activeVideoIndex : undefined
                      );
                    }
                  }}
                  className="p-1 rounded text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  title="Clear all causal relations"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Section content */}
          {!isCausalCollapsed && (
            <div className="px-4 pb-4 space-y-3">
              {filteredCausalRelations.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center py-4 text-slate-500">
                    <svg
                      className="w-8 h-8 mx-auto mb-2 text-slate-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <p className="text-sm font-medium">No causal relations yet</p>
                    <p className="text-xs mt-1">
                      {hasVideo
                        ? 'Click + to add a causal relation between two labels'
                        : 'Import a project to start'}
                    </p>
                  </div>
                  {/* Add new causal relation button */}
                  {hasVideo && onAddCausal && (
                    <div className="flex justify-center">
                      <button
                        onClick={() => {
                          const videoIdx = activeVideoIndex === -1 ? 0 : activeVideoIndex;
                          onAddCausal(videoIdx);
                        }}
                        className="px-3 py-1.5 rounded text-xs font-medium text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:opacity-80 transition-opacity flex items-center gap-1.5"
                        title="Add causal relation"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Add Causal Relation
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <CausalGroup
                  relations={filteredCausalRelations}
                  labels={filteredLabels}
                  selectedRelationId={selectedCausalId ?? null}
                  showVideoIndex={isAllFilter && videoCount > 1}
                  onSelectRelation={(id) => onSelectCausal?.(id)}
                  onUpdateRelation={(id, updates) => onUpdateCausal?.(id, updates)}
                  onDeleteRelation={(id) => onDeleteCausal?.(id)}
                  onSelectCauseLabel={(relationId) => onSelectCauseLabel?.(relationId)}
                  onSelectEffectLabel={(relationId) => onSelectEffectLabel?.(relationId)}
                  onSetCauseLabel={(relationId, labelId) => onSetCauseLabel?.(relationId, labelId)}
                  onSetEffectLabel={(relationId, labelId) =>
                    onSetEffectLabel?.(relationId, labelId)
                  }
                />
              )}
            </div>
          )}
        </div>

        {/* Section 4: Custom Questions */}
        <div className="border-b border-slate-800">
          {/* Section header - collapsible */}
          <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors">
            <button
              onClick={() => setIsCustomQuestionsCollapsed(!isCustomQuestionsCollapsed)}
              className="flex items-center gap-2"
            >
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform ${isCustomQuestionsCollapsed ? '' : 'rotate-90'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span className="text-sm font-medium text-slate-300">Custom Questions</span>
              <span className="text-xs text-slate-500">({filteredCustomQuestions.length})</span>
              {filteredCustomQuestions.length !== customQuestions.length && (
                <span className="text-xs text-slate-600">({customQuestions.length} total)</span>
              )}
            </button>
            <div className="flex items-center gap-1">
              {hasVideo && onAddCustomQuestion && (
                <button
                  onClick={() => {
                    const videoIdx = activeVideoIndex === -1 ? 0 : activeVideoIndex;
                    onAddCustomQuestion(videoIdx);
                  }}
                  className="p-1 rounded text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 transition-colors"
                  title="Add custom question"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              )}
              {filteredCustomQuestions.length > 0 && (
                <button
                  onClick={async () => {
                    const targetQuestions =
                      !isAllFilter && videoCount > 1
                        ? filteredCustomQuestions.length
                        : customQuestions.length;
                    const targetDesc =
                      !isAllFilter && videoCount > 1
                        ? `Video ${activeVideoIndex + 1}`
                        : 'this instance';
                    const confirmed = onConfirm
                      ? await onConfirm({
                          title: 'Clear Custom Questions?',
                          message: `Are you sure you want to delete all ${targetQuestions} custom question(s) for ${targetDesc}?\n\nThis action cannot be undone.`,
                          confirmText: 'Delete',
                          variant: 'danger',
                        })
                      : window.confirm(
                          `Are you sure you want to delete all ${targetQuestions} custom question(s) for ${targetDesc}?\n\nThis action cannot be undone.`
                        );
                    if (confirmed) {
                      onClearCustomQuestions?.(
                        !isAllFilter && videoCount > 1 ? activeVideoIndex : undefined
                      );
                    }
                  }}
                  className="p-1 rounded text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  title="Clear all custom questions"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Section content */}
          {!isCustomQuestionsCollapsed && (
            <div className="px-4 pb-4 space-y-3">
              {filteredCustomQuestions.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center py-4 text-slate-500">
                    <svg
                      className="w-8 h-8 mx-auto mb-2 text-slate-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm font-medium">No custom questions yet</p>
                    <p className="text-xs mt-1">
                      {hasVideo
                        ? 'Click + to add a custom question with manual question text, correct option, and distractors'
                        : 'Import a project to start'}
                    </p>
                  </div>
                  {/* Add new custom question button */}
                  {hasVideo && onAddCustomQuestion && (
                    <div className="flex justify-center">
                      <button
                        onClick={() => {
                          const videoIdx = activeVideoIndex === -1 ? 0 : activeVideoIndex;
                          onAddCustomQuestion(videoIdx);
                        }}
                        className="px-3 py-1.5 rounded text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-80 transition-opacity flex items-center gap-1.5"
                        title="Add custom question"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Add Custom Question
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCustomQuestions.map((question) => (
                    <CustomQuestionCard
                      key={question.id}
                      question={question}
                      isSelected={selectedCustomQuestionId === question.id}
                      showVideoIndex={isAllFilter && videoCount > 1}
                      videoDuration={videoDuration}
                      onSelect={() => onSelectCustomQuestion?.(question.id)}
                      onUpdate={(updates) => onUpdateCustomQuestion?.(question.id, updates)}
                      onDelete={() => onDeleteCustomQuestion?.(question.id)}
                      onPlaySegment={onPlaySegment}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Export status */}
      {hasVideo &&
        (labels.length > 0 ||
          sceneDistractors.length > 0 ||
          causalRelations.length > 0 ||
          customQuestions.length > 0) && (
          <div className={`p-3 border-t border-slate-800 text-sm shrink-0 ${status.color}`}>
            {status.text}
          </div>
        )}
    </div>
  );
}
