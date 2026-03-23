'use client';

import { useState, useCallback, useEffect } from 'react';
import type { VideoInstance } from '../hooks/useMultiVideoPlayer';

export interface BatchProgress {
  isActive: boolean;
  currentInstanceIndex: number;
  totalInstances: number;
  currentInstanceName: string;
  completedInstances: string[];
  failedInstances: { id: string; error: string }[];
  videoProgress: {
    action: 'pending' | 'loading' | 'done';
    state: 'pending' | 'loading' | 'done';
    world: 'pending' | 'loading' | 'done';
    sceneDistractors: 'pending' | 'loading' | 'done';
    lexicalDistractors: 'pending' | 'loading' | 'done';
  }[];
}

interface BatchGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  instances: VideoInstance[];
  instanceStatuses: Record<string, 'completed' | 'in-progress' | 'not-started'>;
  onStartBatchGeneration: (selectedInstanceIds: string[]) => void;
  batchProgress: BatchProgress | null;
  onCancelBatch?: () => void;
}

const STEPS = [
  { id: 'action', label: 'Actions' },
  { id: 'state', label: 'States' },
  { id: 'world', label: 'World' },
  { id: 'sceneDistractors', label: 'Scene' },
  { id: 'lexicalDistractors', label: 'Lexical' },
] as const;

function StepIndicator({ status }: { status: 'pending' | 'loading' | 'done' }) {
  if (status === 'loading') {
    return (
      <div className="w-4 h-4 flex items-center justify-center">
        <svg className="w-3 h-3 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }
  if (status === 'done') {
    return (
      <div className="w-4 h-4 flex items-center justify-center text-emerald-400">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-4 h-4 flex items-center justify-center">
      <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
    </div>
  );
}

export function BatchGenerateModal({
  isOpen,
  onClose,
  instances,
  instanceStatuses,
  onStartBatchGeneration,
  batchProgress,
  onCancelBatch,
}: BatchGenerateModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'not-started' | 'in-progress'>('all');

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen && !batchProgress?.isActive) {
      setSelectedIds(new Set());
    }
  }, [isOpen, batchProgress?.isActive]);

  const toggleInstance = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const filtered = instances.filter((inst) => {
      if (filterStatus === 'all') return true;
      const status = instanceStatuses[inst.id] || 'not-started';
      return status === filterStatus;
    });
    setSelectedIds(new Set(filtered.map((i) => i.id)));
  }, [instances, instanceStatuses, filterStatus]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleStart = useCallback(() => {
    if (selectedIds.size > 0) {
      onStartBatchGeneration(Array.from(selectedIds));
    }
  }, [selectedIds, onStartBatchGeneration]);

  if (!isOpen) return null;

  const filteredInstances = instances.filter((inst) => {
    if (filterStatus === 'all') return true;
    const status = instanceStatuses[inst.id] || 'not-started';
    return status === filterStatus;
  });

  const isGenerating = batchProgress?.isActive ?? false;
  const allDone =
    batchProgress &&
    batchProgress.completedInstances.length + batchProgress.failedInstances.length >=
      batchProgress.totalInstances;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                allDone
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
              }`}
            >
              {allDone ? (
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-slate-100">
                {isGenerating
                  ? allDone
                    ? 'Batch Generation Complete'
                    : 'Batch Generating...'
                  : 'Batch Generate Predictions'}
              </h2>
              <p className="text-xs text-slate-400">
                {isGenerating
                  ? `Processing ${batchProgress?.currentInstanceIndex ?? 0 + 1} of ${batchProgress?.totalInstances ?? 0}`
                  : `Select instances to generate predictions for`}
              </p>
            </div>
            {!isGenerating && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isGenerating ? (
            // Generation progress view
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Overall progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Overall Progress</span>
                  <span className="text-violet-400 font-mono">
                    {batchProgress?.completedInstances.length ?? 0}/
                    {batchProgress?.totalInstances ?? 0}
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      allDone
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                    }`}
                    style={{
                      width: `${
                        batchProgress
                          ? ((batchProgress.completedInstances.length +
                              batchProgress.failedInstances.length) /
                              batchProgress.totalInstances) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Current instance progress */}
              {batchProgress && !allDone && (
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-200">
                      {batchProgress.currentInstanceName}
                    </span>
                    <span className="text-xs text-slate-500">
                      Instance {batchProgress.currentInstanceIndex + 1} of{' '}
                      {batchProgress.totalInstances}
                    </span>
                  </div>

                  {/* Video progress cards */}
                  <div
                    className={`grid gap-3 ${batchProgress.videoProgress.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
                  >
                    {batchProgress.videoProgress.map((vp, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50"
                      >
                        <div className="text-xs text-slate-500 mb-2">Video {idx + 1}</div>
                        <div className="flex flex-wrap gap-2">
                          {STEPS.map((step) => (
                            <div
                              key={step.id}
                              className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                vp[step.id] === 'done'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : vp[step.id] === 'loading'
                                    ? 'bg-violet-500/10 text-violet-400'
                                    : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              <StepIndicator status={vp[step.id]} />
                              <span>{step.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed instances */}
              {batchProgress && batchProgress.completedInstances.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Completed ({batchProgress.completedInstances.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {batchProgress.completedInstances.map((id) => {
                      const inst = instances.find((i) => i.id === id);
                      return (
                        <div
                          key={id}
                          className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-1"
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {inst?.name || id}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Failed instances */}
              {batchProgress && batchProgress.failedInstances.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-red-400 uppercase tracking-wider">
                    Failed ({batchProgress.failedInstances.length})
                  </h3>
                  <div className="space-y-1">
                    {batchProgress.failedInstances.map(({ id, error }) => {
                      const inst = instances.find((i) => i.id === id);
                      return (
                        <div
                          key={id}
                          className="px-3 py-2 rounded bg-red-500/10 border border-red-500/30 text-xs"
                        >
                          <span className="text-red-400 font-medium">{inst?.name || id}</span>
                          <span className="text-red-300/70 ml-2">{error}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Selection view
            <>
              {/* Filter and selection controls */}
              <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Filter:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                    className="px-2 py-1 text-xs rounded bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:border-violet-500"
                  >
                    <option value="all">All ({instances.length})</option>
                    <option value="not-started">
                      Not Started (
                      {
                        instances.filter(
                          (i) => (instanceStatuses[i.id] || 'not-started') === 'not-started'
                        ).length
                      }
                      )
                    </option>
                    <option value="in-progress">
                      In Progress (
                      {instances.filter((i) => instanceStatuses[i.id] === 'in-progress').length})
                    </option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAll}
                    className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAll}
                    className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Instance list */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="space-y-1">
                  {filteredInstances.map((instance, idx) => {
                    const status = instanceStatuses[instance.id] || 'not-started';
                    const isSelected = selectedIds.has(instance.id);

                    return (
                      <button
                        key={instance.id}
                        onClick={() => toggleInstance(instance.id)}
                        className={`w-full px-3 py-2.5 rounded-lg text-left transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-violet-500/20 border border-violet-500/40'
                            : 'bg-slate-800/50 border border-transparent hover:bg-slate-800'
                        }`}
                      >
                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-violet-500 border-violet-500'
                              : 'border-slate-600 hover:border-slate-500'
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>

                        {/* Status indicator */}
                        <span className="w-4 flex justify-center shrink-0">
                          {status === 'completed' && (
                            <svg
                              className="w-4 h-4 text-emerald-500"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                            </svg>
                          )}
                          {status === 'in-progress' && (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          )}
                          {status === 'not-started' && (
                            <span className="w-2 h-2 rounded-full bg-slate-600" />
                          )}
                        </span>

                        {/* Index */}
                        <span className="w-8 text-right text-slate-500 text-xs font-mono shrink-0">
                          {instances.indexOf(instance) + 1}.
                        </span>

                        {/* Name */}
                        <span className="flex-1 truncate text-sm text-slate-200">
                          {instance.name}
                        </span>

                        {/* Video count */}
                        <span className="text-xs text-slate-500 shrink-0">
                          {instance.videos.length} video{instance.videos.length !== 1 ? 's' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0">
          <div className="text-sm text-slate-400">
            {isGenerating ? (
              allDone ? (
                <span className="text-emerald-400">
                  Completed {batchProgress?.completedInstances.length} of{' '}
                  {batchProgress?.totalInstances} instances
                  {batchProgress?.failedInstances.length
                    ? ` (${batchProgress.failedInstances.length} failed)`
                    : ''}
                </span>
              ) : (
                <span>Processing...</span>
              )
            ) : (
              <span>
                {selectedIds.size} instance{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isGenerating ? (
              allDone ? (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors"
                >
                  Done
                </button>
              ) : (
                onCancelBatch && (
                  <button
                    onClick={onCancelBatch}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                )
              )
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStart}
                  disabled={selectedIds.size === 0}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-600 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Generate {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
