'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  QuestionPreviewModalProps,
  QuestionLevel,
  ExportedQuestions,
  EditableQuestion,
  AutosaveQuestionData,
} from './types';
import { LEVEL_COLORS } from './constants';
import { QuestionCard } from './QuestionCard';
import { VideoPreview } from './VideoPreview';
import { QuestionFilters } from './QuestionFilters';

// Autosave interval in milliseconds
const AUTOSAVE_INTERVAL = 15000; // 15 seconds

/**
 * Question Editor Modal - Preview, edit, validate, and export questions
 */
export function QuestionPreviewModal({
  isOpen,
  onClose,
  questions,
  stats,
  instanceId,
  instanceName,
  videos,
  projectFolder,
  onExport,
  onRegenerate,
}: QuestionPreviewModalProps) {
  // Editable questions state (initialized from questions prop)
  const [editableQuestions, setEditableQuestions] = useState<EditableQuestion[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutosave, setLastAutosave] = useState<Date | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  // Filter states
  const [filterLevel, setFilterLevel] = useState<QuestionLevel | 'all'>('all');
  const [filterCode, setFilterCode] = useState<string>('all');
  const [filterValidation, setFilterValidation] = useState<
    'all' | 'valid' | 'invalid' | 'unreviewed'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Shuffle state
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  // Video preview state
  const [previewVideoIndex, setPreviewVideoIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [playbackStartTime, setPlaybackStartTime] = useState<number | null>(null);
  const [playbackEndTime, setPlaybackEndTime] = useState<number | null>(null);
  const [videoContextStart, setVideoContextStart] = useState<number | null>(null);
  const [videoContextEnd, setVideoContextEnd] = useState<number | null>(null);
  const [showVideoPreview, setShowVideoPreview] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Resizable split view state
  const [splitPosition, setSplitPosition] = useState(45); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load autosave data
  const loadAutosave = useCallback(async (): Promise<AutosaveQuestionData | null> => {
    const projectFolderParam = projectFolder
      ? `&projectFolder=${encodeURIComponent(projectFolder)}`
      : '';
    try {
      const response = await fetch(
        `/api/questions/autosave?instanceId=${encodeURIComponent(instanceId)}${projectFolderParam}`
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to load autosave:', error);
    }
    return null;
  }, [instanceId, projectFolder]);

  // Initialize editable questions when questions prop changes or modal opens
  useEffect(() => {
    if (isOpen && questions.length > 0) {
      // Try to load autosave first
      loadAutosave().then((autosaveData) => {
        if (autosaveData && autosaveData.instanceId === instanceId) {
          setEditableQuestions(autosaveData.questions);
          setLastAutosave(new Date(autosaveData.lastSaved));
        } else {
          // Initialize from props
          setEditableQuestions(
            questions.map((q) => ({ ...q, isValid: undefined, isEdited: false }))
          );
        }
      });
    }
  }, [isOpen, questions, instanceId, loadAutosave]);

  // Perform autosave - must be defined before use in useEffect
  // Can optionally accept questions to save (for immediate saves after state updates)
  const performAutosave = useCallback(
    async (questionsToSave?: EditableQuestion[]) => {
      const questions = questionsToSave || editableQuestions;
      if (isAutosaving || questions.length === 0) return;

      setIsAutosaving(true);
      try {
        const autosaveData: AutosaveQuestionData = {
          instanceId,
          instanceName,
          lastSaved: new Date().toISOString(),
          questions: questions,
        };

        const response = await fetch('/api/questions/autosave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...autosaveData,
            projectFolder,
          }),
        });

        if (response.ok) {
          setLastAutosave(new Date());
          setHasUnsavedChanges(false);
        }
      } catch (error) {
        console.error('Autosave failed:', error);
      } finally {
        setIsAutosaving(false);
      }
    },
    [editableQuestions, instanceId, instanceName, isAutosaving, projectFolder]
  );

  // Autosave effect
  useEffect(() => {
    if (!isOpen || editableQuestions.length === 0) return;

    const autosaveTimer = setInterval(() => {
      if (hasUnsavedChanges) {
        performAutosave();
      }
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(autosaveTimer);
  }, [isOpen, editableQuestions.length, hasUnsavedChanges, performAutosave]);

  // Shuffle function using Fisher-Yates algorithm
  const shuffleQuestions = useCallback(() => {
    if (isShuffled) {
      // Restore original order
      setShuffledIndices([]);
      setIsShuffled(false);
    } else {
      // Create shuffled indices
      const indices = Array.from({ length: editableQuestions.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledIndices(indices);
      setIsShuffled(true);
    }
  }, [isShuffled, editableQuestions.length]);

  // Get unique codes
  const uniqueCodes = useMemo(() => {
    return [...new Set(editableQuestions.map((q) => q.code))].sort();
  }, [editableQuestions]);

  // Calculate validation counts
  const validationCounts = useMemo(() => {
    return {
      valid: editableQuestions.filter((q) => q.isValid === true).length,
      invalid: editableQuestions.filter((q) => q.isValid === false).length,
      unreviewed: editableQuestions.filter((q) => q.isValid === undefined).length,
    };
  }, [editableQuestions]);

  // Helper function to check if a code matches a category
  const codeMatchesCategory = (code: string, category: string): boolean => {
    if (category === 'CAUSAL') return code === 'CAUSAL';
    if (category === 'INTENT') return code.includes('-INTENT');
    if (category === 'COUNT') return code.includes('-COUNT');
    if (category === 'TIME') return code.includes('-TIME');
    if (category === 'ABSENT') return code.includes('-ABSENT');
    if (category === 'EXIST') return code.includes('-EXIST');
    if (category === 'IDENT')
      return code.includes('-IDENT') || (code.includes('2') && code.endsWith('-IDENT'));
    if (category === 'TR') return code.startsWith('TR2');
    if (category === 'POV-ID') return code.includes('-POV-ID');
    if (category === 'ORDER') return code.includes('-ORDER');
    return false;
  };

  // Filter questions and track original indices
  const filteredQuestionsWithIndices = useMemo(() => {
    // First, create array with original indices
    const questionsWithIndices = editableQuestions.map((q, originalIndex) => ({
      question: q,
      originalIndex,
    }));

    // Apply filters
    const filtered = questionsWithIndices.filter(({ question: q }) => {
      if (filterLevel !== 'all' && q.level !== filterLevel) return false;

      // Handle category-based filtering (e.g., "category:INTENT")
      if (filterCode !== 'all') {
        if (filterCode.startsWith('category:')) {
          const category = filterCode.replace('category:', '');
          if (!codeMatchesCategory(q.code, category)) return false;
        } else if (q.code !== filterCode) {
          return false;
        }
      }

      // Validation filter
      if (filterValidation === 'valid' && q.isValid !== true) return false;
      if (filterValidation === 'invalid' && q.isValid !== false) return false;
      if (filterValidation === 'unreviewed' && q.isValid !== undefined) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          q.question.toLowerCase().includes(query) ||
          q.answer.option.toLowerCase().includes(query) ||
          q.distractors.some((d) => d.option.toLowerCase().includes(query))
        );
      }
      return true;
    });

    // Apply shuffle if active
    if (isShuffled && shuffledIndices.length > 0) {
      // Create a map of original index to filtered position
      const filteredOriginalIndices = new Set(filtered.map((f) => f.originalIndex));

      // Sort by shuffled order, keeping only items that pass filter
      const shuffledFiltered = shuffledIndices
        .filter((idx) => filteredOriginalIndices.has(idx))
        .map((idx) => filtered.find((f) => f.originalIndex === idx)!)
        .filter(Boolean);

      return shuffledFiltered;
    }

    return filtered;
  }, [
    editableQuestions,
    filterLevel,
    filterCode,
    filterValidation,
    searchQuery,
    isShuffled,
    shuffledIndices,
  ]);

  // Handle question change
  const handleQuestionChange = useCallback(
    (questionId: string, updates: Partial<EditableQuestion>) => {
      setEditableQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, ...updates } : q))
      );
      setHasUnsavedChanges(true);
    },
    []
  );

  // Handle export
  // Handle regenerate questions
  const handleRegenerateConfirm = useCallback(async () => {
    if (!onRegenerate) return;

    setIsRegenerating(true);
    setShowRegenerateConfirm(false);

    try {
      const result = await onRegenerate();
      if (result) {
        // Replace questions with newly generated ones
        const newQuestions = result.questions.map((q) => ({
          ...q,
          isValid: undefined,
          isEdited: false,
        }));
        setEditableQuestions(newQuestions);
        setHasUnsavedChanges(false); // Will be saved immediately

        // Immediately save the new questions to autosave
        await performAutosave(newQuestions);
      }
    } catch (error) {
      console.error('Failed to regenerate questions:', error);
    } finally {
      setIsRegenerating(false);
    }
  }, [onRegenerate, performAutosave]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      // Calculate updated stats based on editable questions
      const updatedStats = {
        ...stats,
        total: editableQuestions.length,
      };

      const exportData: ExportedQuestions = {
        instanceId,
        instanceName,
        generatedAt: new Date().toISOString(),
        stats: updatedStats,
        questions: editableQuestions,
      };

      await onExport(exportData);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [instanceId, instanceName, stats, editableQuestions, onExport]);

  // Toggle question expansion and update video context
  const toggleExpand = useCallback(
    (id: string) => {
      setExpandedQuestionId((prev) => {
        const newExpandedId = prev === id ? null : id;

        // Update video context when expanding a question
        if (newExpandedId) {
          const question = editableQuestions.find((q) => q.id === newExpandedId);
          if (question?.videoContext) {
            setVideoContextStart(question.videoContext.start);
            setVideoContextEnd(question.videoContext.end);
            // Switch to the question's video if needed
            if (question.videoIndex !== undefined && question.videoIndex !== previewVideoIndex) {
              setPreviewVideoIndex(question.videoIndex);
            }
          } else {
            setVideoContextStart(null);
            setVideoContextEnd(null);
          }
        } else {
          // Clear context when collapsing
          setVideoContextStart(null);
          setVideoContextEnd(null);
        }

        return newExpandedId;
      });
    },
    [editableQuestions, previewVideoIndex]
  );

  // Jump to time in video with end time for auto-stop
  const jumpToTime = useCallback(
    (time: number, endTime?: number, videoIndex?: number) => {
      // Set start and end time for playback range
      setPlaybackStartTime(time);
      setPlaybackEndTime(endTime ?? null);

      if (
        videoIndex !== undefined &&
        videoIndex !== previewVideoIndex &&
        videoIndex < videos.length
      ) {
        setPreviewVideoIndex(videoIndex);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.currentTime = time;
            setIsVideoPlaying(true);
            videoRef.current.play();
          }
        }, 100);
      } else if (videoRef.current) {
        videoRef.current.currentTime = time;
        setIsVideoPlaying(true);
        videoRef.current.play();
      }
      setShowVideoPreview(true);
    },
    [previewVideoIndex, videos.length]
  );

  // Clear playback range
  const clearPlaybackRange = useCallback(() => {
    setPlaybackStartTime(null);
    setPlaybackEndTime(null);
  }, []);

  // Handle video context change from timeline dragging
  const handleVideoContextChange = useCallback(
    (start: number, end: number) => {
      setVideoContextStart(start);
      setVideoContextEnd(end);

      // Also update the corresponding question if one is expanded
      if (expandedQuestionId) {
        handleQuestionChange(expandedQuestionId, {
          videoContext: { start, end },
          isEdited: true,
        });
      }
    },
    [expandedQuestionId, handleQuestionChange]
  );

  // Video event handlers
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setVideoCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  }, [isVideoPlaying]);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setVideoCurrentTime(time);
    }
  }, []);

  // Reset video state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPreviewVideoIndex(0);
      setIsVideoPlaying(false);
      setVideoCurrentTime(0);
      setPlaybackStartTime(null);
      setPlaybackEndTime(null);
    }
  }, [isOpen]);

  // Handle close with autosave
  const handleClose = useCallback(async () => {
    if (hasUnsavedChanges) {
      await performAutosave();
    }
    onClose();
  }, [hasUnsavedChanges, performAutosave, onClose]);

  // Handle resize drag
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleResizeMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100;

      // Constrain between 20% and 80%
      setSplitPosition(Math.max(20, Math.min(80, newPosition)));
    },
    [isResizing]
  );

  const handleResizeMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add/remove resize event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleResizeMouseMove);
        document.removeEventListener('mouseup', handleResizeMouseUp);
      };
    }
  }, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-7xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Question Editor</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{instanceName}</span>
                {lastAutosave && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400">
                      {isAutosaving ? 'Saving...' : `Saved ${lastAutosave.toLocaleTimeString()}`}
                    </span>
                  </>
                )}
                {hasUnsavedChanges && !isAutosaving && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400">Unsaved changes</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Regenerate button */}
            {onRegenerate && (
              <button
                onClick={() => setShowRegenerateConfirm(true)}
                disabled={isRegenerating}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-orange-600 text-white hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Regenerate questions from current labels"
              >
                {isRegenerating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                    Regenerating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Regenerate
                  </>
                )}
              </button>
            )}

            {/* Shuffle button */}
            <button
              onClick={shuffleQuestions}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isShuffled
                  ? 'bg-fuchsia-600 text-white hover:bg-fuchsia-500'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {isShuffled ? 'Restore Order' : 'Shuffle'}
            </button>

            {/* Manual save button */}
            <button
              onClick={() => performAutosave()}
              disabled={isAutosaving || !hasUnsavedChanges}
              className={`p-2 rounded-lg transition-colors ${
                hasUnsavedChanges
                  ? 'bg-amber-600 text-white hover:bg-amber-500'
                  : 'bg-slate-800 text-slate-400'
              }`}
              title="Save now"
            >
              <svg
                className={`w-5 h-5 ${isAutosaving ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
            </button>

            {/* Toggle video preview button */}
            <button
              onClick={() => setShowVideoPreview(!showVideoPreview)}
              className={`p-2 rounded-lg transition-colors ${showVideoPreview ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
              title={showVideoPreview ? 'Hide video preview' : 'Show video preview'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
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
          </div>
        </div>

        {/* Stats Summary */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-800/30 shrink-0">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Total:</span>
              <span className="font-bold text-slate-100">{editableQuestions.length}</span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            {([1, 2, 3] as QuestionLevel[]).map((level) => (
              <div key={level} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${LEVEL_COLORS[level]}`} />
                <span className="text-slate-400">L{level}:</span>
                <span className="font-medium text-slate-200">
                  {editableQuestions.filter((q) => q.level === level).length}
                </span>
              </div>
            ))}
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-400">{validationCounts.valid}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-red-400">{validationCounts.invalid}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span className="text-slate-400">{validationCounts.unreviewed}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <QuestionFilters
          filterLevel={filterLevel}
          filterCode={filterCode}
          filterValidation={filterValidation}
          searchQuery={searchQuery}
          uniqueCodes={uniqueCodes}
          stats={stats}
          filteredCount={filteredQuestionsWithIndices.length}
          totalCount={editableQuestions.length}
          validCount={validationCounts.valid}
          invalidCount={validationCounts.invalid}
          unreviewedCount={validationCounts.unreviewed}
          onFilterLevelChange={setFilterLevel}
          onFilterCodeChange={setFilterCode}
          onFilterValidationChange={setFilterValidation}
          onSearchChange={setSearchQuery}
        />

        {/* Main Content - Split view */}
        <div className="flex-1 flex overflow-hidden" ref={containerRef}>
          {/* Questions List */}
          <div
            className="overflow-y-auto px-5 py-4 space-y-3"
            style={{ width: showVideoPreview ? `${splitPosition}%` : '100%' }}
          >
            {/* Shuffle indicator */}
            {isShuffled && (
              <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-xs">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
                Questions are shuffled • Original indices preserved • Click shuffle button to
                restore order
              </div>
            )}

            {filteredQuestionsWithIndices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <svg
                  className="w-12 h-12 mb-3 opacity-50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm">No questions match your filters</p>
              </div>
            ) : (
              filteredQuestionsWithIndices.map(({ question, originalIndex }) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={originalIndex}
                  isExpanded={expandedQuestionId === question.id}
                  onToggle={() => toggleExpand(question.id)}
                  onJumpToTime={jumpToTime}
                  onQuestionChange={(updates) => handleQuestionChange(question.id, updates)}
                />
              ))
            )}
          </div>

          {/* Draggable Separator */}
          {showVideoPreview && videos.length > 0 && (
            <div
              className={`w-1 bg-slate-700 hover:bg-violet-500 transition-colors cursor-col-resize flex-shrink-0 ${isResizing ? 'bg-violet-500' : ''}`}
              onMouseDown={handleResizeMouseDown}
            />
          )}

          {/* Video Preview Panel */}
          {showVideoPreview && videos.length > 0 && (
            <VideoPreview
              videos={videos}
              previewVideoIndex={previewVideoIndex}
              onVideoIndexChange={setPreviewVideoIndex}
              videoRef={videoRef}
              isPlaying={isVideoPlaying}
              currentTime={videoCurrentTime}
              duration={videoDuration}
              playbackStartTime={playbackStartTime}
              playbackEndTime={playbackEndTime}
              videoContextStart={videoContextStart}
              videoContextEnd={videoContextEnd}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlayStateChange={setIsVideoPlaying}
              onClearPlaybackRange={clearPlaybackRange}
              onVideoContextChange={expandedQuestionId ? handleVideoContextChange : undefined}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Valid: {validationCounts.valid}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Invalid: {validationCounts.invalid}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              Unreviewed: {validationCounts.unreviewed}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Edited: {editableQuestions.filter((q) => q.isEdited).length}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || editableQuestions.length === 0}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                exportSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isExporting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                  Exporting...
                </>
              ) : exportSuccess ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Exported!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export JSON
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Regenerate Confirmation Modal */}
      {showRegenerateConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 max-w-md mx-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <svg
                  className="w-6 h-6 text-orange-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Regenerate Questions?</h3>
                <p className="text-sm text-slate-300 mb-3">
                  This will regenerate all questions based on the current labels and scene
                  distractors.
                </p>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-3">
                  <p className="text-xs text-orange-300 font-medium mb-1">⚠️ Warning:</p>
                  <ul className="text-xs text-orange-200 space-y-1 list-disc list-inside">
                    <li>All current questions will be replaced</li>
                    <li>Any edits or validations will be lost</li>
                    <li>Autosave data will be overwritten</li>
                  </ul>
                </div>
                <p className="text-xs text-slate-400">
                  This action cannot be undone. Make sure you've exported your current questions if
                  needed.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowRegenerateConfirm(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerateConfirm}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-500 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Regenerate Questions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
