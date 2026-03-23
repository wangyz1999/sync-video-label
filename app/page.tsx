'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { EventType, InstanceAnnotation, ProjectFile, LabelEntry, EVENT_TYPES } from './types';
import {
  Header,
  VideoGrid,
  VideoTabs,
  Timeline,
  LabelPanel,
  InstructionModal,
  SettingsModal,
  DEFAULT_LLM_SETTINGS,
  ToastContainer,
  useToast,
  PredictionProgressModal,
  ConfirmModal,
  useConfirmModal,
  QuestionPreviewModal,
  CustomPromptModal,
  BatchGenerateModal,
} from './components';
import type { LLMSettings } from './components';
import {
  useMultiVideoPlayer,
  useLabels,
  useKeyboardControls,
  useSceneDistractors,
  useCausalRelations,
  useCustomQuestions,
  useAutoSave,
  useInstanceData,
  useLoopPlayback,
  usePrediction,
  useResizablePanel,
} from './hooks';
import {
  generateQuestions,
  getQuestionStats,
  ExportedQuestions,
  GeneratedQuestion,
  QuestionStats,
} from './utils/questionGenerator/index';
import { transformLabelsForSave } from './utils/labelTransform';

export default function Home() {
  // Multi-video player state
  const {
    videoRefs,
    instances,
    currentInstance,
    currentInstanceIndex,
    duration,
    currentTime,
    isPlaying,
    activeVideoIndex,
    layout,
    setIsPlaying,
    setActiveVideoIndex,
    setLayout,
    loadProject,
    handleLoadedMetadata,
    handleTimeUpdate,
    togglePlay,
    seekTo,
    moveBySeconds,
    moveByFrames,
    prevFrame,
    nextFrame,
    prevSecond,
    nextSecond,
    goToStart,
    goToEnd,
    moveToPrevInstance,
    moveToNextInstance,
    canMoveToPrevInstance,
    canMoveToNextInstance,
    setCurrentInstanceIndex,
    resetForNewInstance,
  } = useMultiVideoPlayer();

  // Labels state
  const {
    labels,
    selectedLabelId,
    selectedLabel,
    hasExported,
    isDirty,
    createLabel,
    updateLabel,
    deleteLabel,
    duplicateLabel,
    selectLabel,
    moveSelectedLabel,
    clearLabels,
    clearLabelsForVideo,
    loadLabels,
    markExported,
    getLabelsForVideo,
    getLabelCountsPerVideo,
  } = useLabels();

  // Scene distractors state
  const {
    sceneDistractors,
    selectedDistractorId,
    addSceneDistractor,
    updateSceneDistractor,
    deleteSceneDistractor,
    clearSceneDistractors,
    clearSceneDistractorsForVideo,
    addDistractorFromLabel,
    selectDistractor: selectDistractorBase,
    loadSceneDistractors,
  } = useSceneDistractors();

  // Causal relations state
  const {
    causalRelations,
    selectedCausalId,
    addCausalRelation,
    updateCausalRelation,
    deleteCausalRelation,
    clearCausalRelations,
    clearCausalRelationsForVideo,
    selectCausalRelation,
    loadCausalRelations,
    setCauseLabel,
    setEffectLabel,
  } = useCausalRelations();

  // Custom questions state
  const {
    customQuestions,
    selectedCustomQuestionId,
    addCustomQuestion,
    updateCustomQuestion,
    deleteCustomQuestion,
    clearCustomQuestions,
    clearCustomQuestionsForVideo,
    selectQuestion,
    loadCustomQuestions,
  } = useCustomQuestions();

  // Selected event type for new labels
  const [selectedEventType, setSelectedEventType] = useState<EventType>('SA');

  // Visible label types filter (for timeline and captions sync)
  const [visibleTypes, setVisibleTypes] = useState<Set<EventType>>(
    new Set(EVENT_TYPES.map((e) => e.code))
  );

  // Focused label state (for "Focus Label Card" from context menu)
  const [focusedLabelId, setFocusedLabelId] = useState<string | null>(null);

  // Toast notifications
  const toast = useToast();

  // Confirm modal
  const confirmModal = useConfirmModal();

  // Modal states
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInstanceSelector, setShowInstanceSelector] = useState(false);

  // LLM settings
  const [llmSettings, setLLMSettings] = useState<LLMSettings>(DEFAULT_LLM_SETTINGS);

  // Question preview state
  const [showQuestionPreview, setShowQuestionPreview] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [questionStats, setQuestionStats] = useState<QuestionStats | null>(null);

  // Custom prompt modal state
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);

  // Resizable panel
  const { panelWidth, isDragging, handleResizeStart } = useResizablePanel();

  // Timeline visibility state
  const [isTimelineVisible, setIsTimelineVisible] = useState(true);

  // File input refs
  const projectInputRef = useRef<HTMLInputElement>(null);

  // Check if an input is focused (for keyboard controls)
  const isInputFocused = useCallback(() => {
    const active = document.activeElement;
    return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
  }, []);

  // Instance data loading and status tracking
  const { instanceStatuses, fetchInstanceStatuses, updateInstanceStatus, setInstanceStatuses } =
    useInstanceData({
      currentInstance,
      onLoadLabels: loadLabels,
      onLoadSceneDistractors: loadSceneDistractors,
      onLoadCausalRelations: loadCausalRelations,
      onLoadCustomQuestions: loadCustomQuestions,
    });

  // Auto-save
  const { lastAutoSave, isAutoSaving, autoSave, resetAutoSave } = useAutoSave({
    currentInstance,
    duration,
    labels,
    sceneDistractors,
    causalRelations,
    customQuestions,
    onStatusUpdate: (instanceId, status) => {
      if (status === 'in-progress') {
        updateInstanceStatus(instanceId, status);
      }
    },
  });

  // Loop playback
  const { loopSegment, handleLoopPlaySegment, stopLoopPlayback } = useLoopPlayback({
    currentTime,
    isPlaying,
    seekTo,
    setIsPlaying,
  });

  // Prediction
  const {
    isGenerating,
    predictionProgress,
    importPrediction,
    generatePrediction,
    batchProgress,
    generateBatchPredictions,
    cancelBatchGeneration,
    closeBatchModal,
  } = usePrediction({
    currentInstance,
    duration,
    labels,
    sceneDistractors,
    llmSettings,
    instances,
    onLoadLabels: loadLabels,
    onLoadSceneDistractors: loadSceneDistractors,
    onResetAutoSave: resetAutoSave,
    onConfirm: confirmModal.confirm,
    onToast: toast,
  });

  // Batch generate modal state
  const [showBatchGenerateModal, setShowBatchGenerateModal] = useState(false);

  // Move a label to scene distractors (strips time range, quantity, lexical distractors)
  const markLabelAsSceneDistractor = useCallback(
    (label: LabelEntry) => {
      addDistractorFromLabel(label);
      deleteLabel(label.id);
    },
    [addDistractorFromLabel, deleteLabel]
  );

  // Move a scene distractor to labels (full time range, qty 1, no lexical distractors)
  const markDistractorAsTrueLabel = useCallback(
    (distractor: { id: string; type: EventType; videoIndex: number; caption: string }) => {
      createLabel(
        distractor.type,
        0,
        Math.floor(duration),
        distractor.videoIndex,
        distractor.caption
      );
      deleteSceneDistractor(distractor.id);
    },
    [createLabel, deleteSceneDistractor, duration]
  );

  // Select distractor (and deselect label)
  const selectDistractor = useCallback(
    (id: string | null) => {
      selectDistractorBase(id);
      if (id) {
        selectLabel(null);
      }
    },
    [selectDistractorBase, selectLabel]
  );

  // Override selectLabel to also deselect distractor
  const handleSelectLabel = useCallback(
    (id: string | null) => {
      selectLabel(id);
      if (id) {
        selectDistractorBase(null);
      }
    },
    [selectLabel, selectDistractorBase]
  );

  // Check if any label is missing caption
  const hasMissingCaptions = useCallback(() => {
    return labels.some((l) => !l.caption || l.caption.trim() === '');
  }, [labels]);

  // Get count of labels with missing captions
  const getMissingCaptionCount = useCallback(() => {
    return labels.filter((l) => !l.caption || l.caption.trim() === '').length;
  }, [labels]);

  // Keyboard controls
  useKeyboardControls({
    onMoveSecond: moveBySeconds,
    onMoveFrame: moveByFrames,
    onMoveSelectedLabel: (seconds) => moveSelectedLabel(seconds, duration),
    onDeleteSelectedLabel: () => {
      if (selectedLabelId) deleteLabel(selectedLabelId);
    },
    onTogglePlay: togglePlay,
    onGoToStart: goToStart,
    onGoToEnd: goToEnd,
    hasSelectedLabel: !!selectedLabelId,
    isInputFocused,
  });

  // Fetch statuses when dropdown is opened
  useEffect(() => {
    if (showInstanceSelector) {
      fetchInstanceStatuses(instances);
    }
  }, [showInstanceSelector, fetchInstanceStatuses, instances]);

  // Also fetch statuses when project is loaded
  useEffect(() => {
    if (instances.length > 0) {
      fetchInstanceStatuses(instances);
    }
  }, [instances.length, fetchInstanceStatuses, instances]);

  // Load the built-in example project
  const loadExampleProject = async () => {
    try {
      const res = await fetch('/api/example-project');
      if (!res.ok) throw new Error('Failed to fetch example project');
      const projectData = (await res.json()) as ProjectFile;
      if (!projectData.instances || projectData.instances.length === 0) {
        toast.error('Invalid example project', 'No instances found');
        return;
      }
      await loadProject(projectData, '/api/video?path=');
      clearLabels();
      clearSceneDistractors();
      clearCausalRelations();
      clearCustomQuestions();
      resetAutoSave();
      toast.success(
        'Example project loaded',
        `${projectData.instances.length} instance(s) ready for labeling`
      );
    } catch (error) {
      console.error('Example project load error:', error);
      toast.error('Load failed', 'Could not load the example project');
    }
  };

  // Import project JSON file
  const importProject = async (file: File) => {
    try {
      const text = await file.text();
      const projectData = JSON.parse(text) as ProjectFile;

      // Validate project structure
      if (!projectData.instances || projectData.instances.length === 0) {
        toast.error('Invalid project file', 'No instances found in the project file');
        return;
      }

      // Load the project - videos will be loaded via API
      await loadProject(projectData, '/api/video?path=');
      clearLabels();
      clearSceneDistractors();
      clearCausalRelations();
      clearCustomQuestions();
      resetAutoSave();
      toast.success(
        'Project loaded',
        `${projectData.instances.length} instance(s) ready for labeling`
      );
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed', 'Please check the JSON format');
    }
  };

  // Handle project file input
  const handleProjectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importProject(file);
    }
    e.target.value = '';
  };

  // Save annotation
  const saveAnnotation = async () => {
    if (!currentInstance) return;

    // Check for missing captions
    if (hasMissingCaptions()) {
      const missingCount = getMissingCaptionCount();
      toast.warning(
        'Missing captions',
        `${missingCount} label${missingCount !== 1 ? 's are' : ' is'} missing caption(s)`
      );
      return;
    }

    const annotation: InstanceAnnotation = {
      instanceId: currentInstance.id,
      instanceName: currentInstance.name,
      videoPaths: currentInstance.videos.map((v) => v.path),
      videoDuration: duration,
      labels: transformLabelsForSave(labels),
      sceneDistractors: sceneDistractors,
      causalRelations: causalRelations,
      customQuestions: customQuestions,
      lastModified: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/annotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...annotation,
          projectFolder: currentInstance.projectFolder,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        markExported();
        setInstanceStatuses((prev) => ({ ...prev, [currentInstance.id]: 'completed' }));
        toast.success('Annotation saved', result.filePath);
        // Also trigger autosave to keep the autosave file in sync
        await autoSave();
      } else if (response.status === 503) {
        const result = await response.json().catch(() => ({}));
        if (result.readonly) {
          toast.info(
            'Demo mode — read-only',
            'This is a public demo. Clone the repo and run locally to save annotations.'
          );
        } else {
          throw new Error('Failed to save');
        }
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Save failed', 'Could not save annotation file');
    }
  };

  // Move to previous instance
  const handlePrevInstance = async () => {
    if (isDirty && !hasExported) {
      const confirmed = await confirmModal.confirm({
        title: 'Unsaved Changes',
        message:
          'You have unsaved changes! If you proceed, your progress will be lost.\n\nDo you want to continue?',
        confirmText: 'Continue',
        variant: 'warning',
      });
      if (!confirmed) return;
    }

    if (moveToPrevInstance()) {
      clearLabels();
      clearSceneDistractors();
      clearCausalRelations();
      clearCustomQuestions();
      resetForNewInstance();
      resetAutoSave();
    }
  };

  // Move to next instance
  const handleNextInstance = async () => {
    if (isDirty && !hasExported) {
      const confirmed = await confirmModal.confirm({
        title: 'Unsaved Changes',
        message:
          'You have unsaved changes! If you proceed, your progress will be lost.\n\nDo you want to continue?',
        confirmText: 'Continue',
        variant: 'warning',
      });
      if (!confirmed) return;
    }

    if (moveToNextInstance()) {
      clearLabels();
      clearSceneDistractors();
      clearCausalRelations();
      clearCustomQuestions();
      resetForNewInstance();
      resetAutoSave();
    }
  };

  // Jump to specific instance
  const handleJumpToInstance = async (index: number) => {
    if (index === currentInstanceIndex) {
      setShowInstanceSelector(false);
      return;
    }

    if (isDirty && !hasExported) {
      const confirmed = await confirmModal.confirm({
        title: 'Unsaved Changes',
        message:
          'You have unsaved changes! If you proceed, your progress will be lost.\n\nDo you want to continue?',
        confirmText: 'Continue',
        variant: 'warning',
      });
      if (!confirmed) return;
    }

    setCurrentInstanceIndex(index);
    clearLabels();
    clearSceneDistractors();
    clearCausalRelations();
    clearCustomQuestions();
    resetForNewInstance();
    resetAutoSave();
    setShowInstanceSelector(false);
  };

  // Play segment from timeline context menu
  const handlePlaySegment = (startTime: number) => {
    stopLoopPlayback();
    seekTo(startTime);
    setIsPlaying(true);
  };

  // Generate and preview questions
  const handlePreviewQuestions = useCallback(() => {
    if (!currentInstance || labels.length === 0) {
      toast.warning('No labels', 'Add some labels before generating questions');
      return;
    }

    const questions = generateQuestions(
      labels,
      sceneDistractors,
      currentInstance.videos.length,
      duration,
      causalRelations,
      customQuestions
    );

    if (questions.length === 0) {
      toast.warning(
        'No questions generated',
        'Add more labels or distractors to generate questions'
      );
      return;
    }

    const stats = getQuestionStats(questions);
    setGeneratedQuestions(questions);
    setQuestionStats(stats);
    setShowQuestionPreview(true);
  }, [currentInstance, labels, sceneDistractors, causalRelations, toast, duration]);

  // Export questions to file
  const handleExportQuestions = useCallback(
    async (data: ExportedQuestions) => {
      try {
        const response = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            projectFolder: currentInstance?.projectFolder,
          }),
        });

        if (response.status === 503) {
          const result = await response.json().catch(() => ({}));
          if (result.readonly) {
            toast.info(
              'Demo mode — read-only',
              'This is a public demo. Clone the repo and run locally to save files.'
            );
            return;
          }
          throw new Error('Failed to save questions');
        }

        if (!response.ok) {
          throw new Error('Failed to save questions');
        }

        const result = await response.json();
        toast.success(
          'Questions exported',
          `${result.questionCount} questions saved to ${result.filePath}`
        );
      } catch (error) {
        console.error('Export questions error:', error);
        toast.error('Export failed', 'Could not save questions file');
        throw error;
      }
    },
    [toast, currentInstance?.projectFolder]
  );

  // Focus on a label card in the panel (from timeline context menu)
  const handleFocusLabelCard = useCallback(
    (label: LabelEntry) => {
      if (activeVideoIndex !== -1 && activeVideoIndex !== label.videoIndex) {
        setActiveVideoIndex(label.videoIndex);
      }
      setFocusedLabelId(label.id);
      handleSelectLabel(label.id);
      setTimeout(() => {
        setFocusedLabelId(null);
      }, 2000);
    },
    [activeVideoIndex, setActiveVideoIndex, handleSelectLabel]
  );

  // Create label with current active video index
  const handleCreateLabel = (type: EventType, startTime: number, endTime: number) => {
    const videoIdx = activeVideoIndex === -1 ? 0 : activeVideoIndex;
    createLabel(type, startTime, endTime, videoIdx);
  };

  // Switch a label to a different video
  const handleSwitchLabelVideo = (labelId: string, newVideoIndex: number) => {
    updateLabel(labelId, { videoIndex: newVideoIndex });
  };

  // Get labels for current active video or all labels
  const labelsForTimeline = activeVideoIndex === -1 ? labels : getLabelsForVideo(activeVideoIndex);
  const labelCounts = currentInstance ? getLabelCountsPerVideo(currentInstance.videos.length) : [];

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <Header
        onImportPrediction={importPrediction}
        onGeneratePrediction={generatePrediction}
        onBatchGenerate={() => setShowBatchGenerateModal(true)}
        onSaveAnnotation={saveAnnotation}
        onPreviewQuestions={handlePreviewQuestions}
        onShowInstructions={() => setShowInstructions(true)}
        onShowSettings={() => setShowSettings(true)}
        onAskAI={() => setShowCustomPrompt(true)}
        canSave={!!currentInstance && labels.length > 0 && !hasMissingCaptions()}
        canImportPrediction={!!currentInstance}
        canGeneratePrediction={!!currentInstance && duration > 0}
        canBatchGenerate={instances.length > 0}
        canAskAI={!!currentInstance && duration > 0 && llmSettings.provider === 'google-ai-studio'}
        isGenerating={isGenerating}
      />

      {/* Instruction Modal */}
      <InstructionModal isOpen={showInstructions} onClose={() => setShowInstructions(false)} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={llmSettings}
        onSaveSettings={setLLMSettings}
      />

      {/* Prediction Progress Modal */}
      <PredictionProgressModal
        progress={predictionProgress}
        instanceName={currentInstance?.name || ''}
      />

      {/* Batch Generate Modal */}
      <BatchGenerateModal
        isOpen={showBatchGenerateModal || (batchProgress?.isActive ?? false)}
        onClose={() => {
          setShowBatchGenerateModal(false);
          closeBatchModal();
        }}
        instances={instances}
        instanceStatuses={instanceStatuses}
        onStartBatchGeneration={generateBatchPredictions}
        batchProgress={batchProgress}
        onCancelBatch={cancelBatchGeneration}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        {...confirmModal.config}
        onConfirm={confirmModal.handleConfirm}
        onCancel={confirmModal.handleCancel}
      />

      {/* Custom Prompt Modal */}
      {currentInstance && (
        <CustomPromptModal
          isOpen={showCustomPrompt}
          onClose={() => setShowCustomPrompt(false)}
          videoPath={
            activeVideoIndex >= 0
              ? currentInstance.videos[activeVideoIndex].path
              : currentInstance.videos[0].path
          }
          videoUrl={
            activeVideoIndex >= 0
              ? currentInstance.videos[activeVideoIndex].url
              : currentInstance.videos[0].url
          }
          videoDuration={duration}
          currentTime={currentTime}
          selectedRange={
            selectedLabel
              ? { startTime: selectedLabel.startTime, endTime: selectedLabel.endTime }
              : null
          }
          llmSettings={llmSettings}
          onSeek={seekTo}
        />
      )}

      {/* Question Preview Modal */}
      {questionStats && (
        <QuestionPreviewModal
          isOpen={showQuestionPreview}
          onClose={() => setShowQuestionPreview(false)}
          questions={generatedQuestions}
          stats={questionStats}
          instanceId={currentInstance?.id || ''}
          instanceName={currentInstance?.name || ''}
          videos={
            currentInstance?.videos.map((v) => ({ path: v.path, name: v.name, url: v.url })) || []
          }
          projectFolder={currentInstance?.projectFolder}
          onExport={handleExportQuestions}
          onRegenerate={async () => {
            if (!currentInstance || labels.length === 0) {
              toast.warning('No labels', 'Add some labels before regenerating questions');
              return null;
            }

            const questions = generateQuestions(
              labels,
              sceneDistractors,
              currentInstance.videos.length,
              duration,
              causalRelations,
              customQuestions
            );

            if (questions.length === 0) {
              toast.warning(
                'No questions generated',
                'Add more labels or distractors to generate questions'
              );
              return null;
            }

            const stats = getQuestionStats(questions);
            setGeneratedQuestions(questions);
            setQuestionStats(stats);

            toast.success('Questions regenerated', `Generated ${questions.length} new questions`);
            return { questions, stats };
          }}
        />
      )}

      {/* Hidden file input for project import */}
      <input
        ref={projectInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleProjectFile}
      />

      {/* Main content */}
      <div
        className={`flex-1 flex overflow-hidden ${isDragging ? 'select-none cursor-col-resize' : ''}`}
      >
        {/* Left side - Video grid and timeline */}
        <div className="flex-1 flex flex-col p-3 overflow-hidden gap-3">
          {/* Video grid - with constrained height */}
          <div className="flex-1 min-h-0 flex flex-col">
            {currentInstance ? (
              <div className="w-full h-full">
                <VideoGrid
                  videos={currentInstance.videos}
                  videoRefs={videoRefs}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  activeVideoIndex={activeVideoIndex}
                  layout={layout}
                  labels={labels}
                  showCaptions={llmSettings.showCaptions}
                  captionFontSize={llmSettings.captionFontSize}
                  captionAlignment={llmSettings.captionAlignment}
                  visibleTypes={visibleTypes}
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onVideoClick={setActiveVideoIndex}
                  onLayoutChange={setLayout}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-slate-900 rounded-xl border-2 border-dashed border-slate-700">
                <div className="flex gap-6 p-8">
                  {/* Import project */}
                  <div
                    className="flex flex-col items-center justify-center gap-3 px-10 py-8 rounded-xl border-2 border-slate-700 bg-slate-800 cursor-pointer hover:border-blue-500 hover:bg-slate-750 transition-all group"
                    onClick={() => projectInputRef.current?.click()}
                  >
                    <svg
                      className="w-14 h-14 text-slate-400 group-hover:text-blue-400 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div className="text-center">
                      <p className="text-base font-medium text-slate-300 group-hover:text-white transition-colors">
                        Import a Project
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Select a project JSON file</p>
                    </div>
                  </div>

                  <div className="flex items-center text-slate-600 font-medium text-sm select-none">
                    or
                  </div>

                  {/* Load example */}
                  <div
                    className="flex flex-col items-center justify-center gap-3 px-10 py-8 rounded-xl border-2 border-slate-700 bg-slate-800 cursor-pointer hover:border-emerald-500 hover:bg-slate-750 transition-all group"
                    onClick={loadExampleProject}
                  >
                    <svg
                      className="w-14 h-14 text-slate-400 group-hover:text-emerald-400 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-center">
                      <p className="text-base font-medium text-slate-300 group-hover:text-white transition-colors">
                        Load Demo Project
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Try the app without any setup</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Video controls */}
          {currentInstance && (
            <div className="relative flex items-center justify-center gap-3 shrink-0">
              <button
                onClick={goToStart}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm transition-colors flex items-center gap-1"
                title="Go to start (Home)"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
                </svg>
                Start
              </button>
              <button
                onClick={prevSecond}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm transition-colors"
                title="Previous second (Left arrow)"
              >
                ← 1s
              </button>
              <button
                onClick={prevFrame}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm transition-colors"
                title="Previous frame (Ctrl+Left)"
              >
                ← Frame
              </button>
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 flex items-center justify-center transition-colors"
                title="Play/Pause (Space)"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5.14v14l11-7z" />
                  </svg>
                )}
              </button>
              <button
                onClick={nextFrame}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm transition-colors"
                title="Next frame (Ctrl+Right)"
              >
                Frame →
              </button>
              <button
                onClick={nextSecond}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm transition-colors"
                title="Next second (Right arrow)"
              >
                1s →
              </button>
              <button
                onClick={goToEnd}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm transition-colors flex items-center gap-1"
                title="Go to end (End)"
              >
                End
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 18h2V6h-2v12zM6 18l8.5-6L6 6v12z" />
                </svg>
              </button>
              {/* Play Selection and Loop Play - absolutely positioned to not affect centering */}
              {selectedLabel && (
                <div className="absolute left-[calc(50%+263px)] flex items-center gap-2">
                  <button
                    onClick={() => handlePlaySegment(selectedLabel.startTime)}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm transition-colors"
                    title="Play selected segment"
                  >
                    Play Selection
                  </button>
                  <button
                    onClick={() => {
                      if (
                        loopSegment &&
                        loopSegment.startTime === selectedLabel.startTime &&
                        loopSegment.endTime === selectedLabel.endTime
                      ) {
                        stopLoopPlayback();
                        setIsPlaying(false);
                      } else {
                        handleLoopPlaySegment(selectedLabel.startTime, selectedLabel.endTime);
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5 ${
                      loopSegment &&
                      loopSegment.startTime === selectedLabel.startTime &&
                      loopSegment.endTime === selectedLabel.endTime
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-900'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                    title={loopSegment ? 'Stop loop playback' : 'Loop play selected segment'}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {loopSegment &&
                    loopSegment.startTime === selectedLabel.startTime &&
                    loopSegment.endTime === selectedLabel.endTime
                      ? 'Stop Loop'
                      : 'Loop'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Video tabs and Timeline */}
          {currentInstance && (
            <>
              <div className="flex items-center gap-2">
                <VideoTabs
                  videos={currentInstance.videos}
                  activeIndex={activeVideoIndex}
                  onTabClick={setActiveVideoIndex}
                  labelCounts={labelCounts}
                  totalLabelCount={labels.length}
                />
                <button
                  onClick={() => setIsTimelineVisible(!isTimelineVisible)}
                  className={`px-2.5 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5 ${
                    isTimelineVisible
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                      : 'bg-amber-600 hover:bg-amber-500 text-white'
                  }`}
                  title={isTimelineVisible ? 'Hide timeline (expand video)' : 'Show timeline'}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isTimelineVisible ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    )}
                    {!isTimelineVisible && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    )}
                  </svg>
                  {isTimelineVisible ? 'Hide Timeline' : 'Show Timeline'}
                </button>
              </div>
              {isTimelineVisible && (
                <Timeline
                  duration={duration}
                  currentTime={currentTime}
                  labels={labelsForTimeline}
                  selectedLabelId={selectedLabelId}
                  selectedEventType={selectedEventType}
                  videoCount={currentInstance.videos.length}
                  visibleTypes={visibleTypes}
                  onSeek={seekTo}
                  onSelectLabel={selectLabel}
                  onUpdateLabel={updateLabel}
                  onDeleteLabel={deleteLabel}
                  onDuplicateLabel={duplicateLabel}
                  onCreateLabel={handleCreateLabel}
                  onSelectEventType={setSelectedEventType}
                  onPlaySegment={handlePlaySegment}
                  onLoopPlaySegment={handleLoopPlaySegment}
                  onSwitchLabelVideo={handleSwitchLabelVideo}
                  onMarkAsSceneDistractor={markLabelAsSceneDistractor}
                  onVisibleTypesChange={setVisibleTypes}
                  onFocusLabelCard={handleFocusLabelCard}
                />
              )}
            </>
          )}

          {/* Instance navigation and status */}
          {currentInstance && (
            <div className="flex items-center justify-between text-sm shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">
                  Instance {currentInstanceIndex + 1} of {instances.length}:{' '}
                  <span className="text-slate-200">{currentInstance.name}</span>
                </span>
                <span className="text-slate-500">
                  ({currentInstance.videos.length} video
                  {currentInstance.videos.length !== 1 ? 's' : ''})
                </span>
                {isAutoSaving && <span className="text-slate-500 text-xs">Saving...</span>}
              </div>
              <div className="flex items-center gap-2">
                {instances.length > 1 && canMoveToPrevInstance && (
                  <button
                    onClick={handlePrevInstance}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-sm"
                  >
                    ← Prev
                  </button>
                )}
                {/* Instance selector dropdown */}
                {instances.length > 1 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowInstanceSelector(!showInstanceSelector)}
                      className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-sm flex items-center gap-1.5"
                      title="Jump to instance"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 10h16M4 14h16M4 18h16"
                        />
                      </svg>
                      All
                      <svg
                        className={`w-3 h-3 transition-transform ${showInstanceSelector ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {showInstanceSelector && (
                      <>
                        {/* Backdrop to close dropdown */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowInstanceSelector(false)}
                        />
                        {/* Dropdown menu */}
                        <div className="absolute bottom-full right-0 mb-2 w-80 max-h-80 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                          <div className="sticky top-0 bg-slate-800 px-3 py-2 border-b border-slate-700 flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-medium">
                              Select Instance ({instances.length} total)
                            </span>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Saved
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                In Progress
                              </span>
                            </div>
                          </div>
                          <div className="py-1">
                            {instances.map((instance, idx) => {
                              const status = instanceStatuses[instance.id] || 'not-started';
                              return (
                                <button
                                  key={instance.id}
                                  onClick={() => handleJumpToInstance(idx)}
                                  className={`w-full px-3 py-2 text-left hover:bg-slate-700 transition-colors flex items-center gap-2 ${
                                    idx === currentInstanceIndex
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : 'text-slate-200'
                                  }`}
                                >
                                  {/* Status indicator */}
                                  <span
                                    className="w-4 flex justify-center shrink-0"
                                    title={
                                      status === 'completed'
                                        ? 'Saved'
                                        : status === 'in-progress'
                                          ? 'In Progress'
                                          : 'Not Started'
                                    }
                                  >
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
                                  <span className="w-7 text-right text-slate-500 text-xs font-mono shrink-0">
                                    {idx + 1}.
                                  </span>
                                  <span className="flex-1 truncate text-sm">{instance.name}</span>
                                  {idx === currentInstanceIndex && (
                                    <svg
                                      className="w-4 h-4 text-amber-400 shrink-0"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                      />
                                    </svg>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                <button
                  onClick={handleNextInstance}
                  disabled={!canMoveToNextInstance}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Resizable divider */}
        <div
          className={`w-1.5 bg-slate-800 hover:bg-amber-500/70 cursor-col-resize transition-colors shrink-0 group relative ${
            isDragging ? 'bg-amber-500' : ''
          }`}
          onMouseDown={handleResizeStart}
          title="Drag to resize panel"
        >
          {/* Wider hit area for easier grabbing */}
          <div className="absolute inset-y-0 -left-1 -right-1" />
          {/* Visual grip indicator */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isDragging ? 'opacity-100' : ''}`}
          >
            <div className="w-0.5 h-0.5 rounded-full bg-slate-400" />
            <div className="w-0.5 h-0.5 rounded-full bg-slate-400" />
            <div className="w-0.5 h-0.5 rounded-full bg-slate-400" />
          </div>
        </div>

        {/* Right side - Labels panel */}
        <div style={{ width: panelWidth }} className="shrink-0">
          <LabelPanel
            labels={labels}
            selectedLabelId={selectedLabelId}
            selectedDistractorId={selectedDistractorId}
            focusedLabelId={focusedLabelId}
            videoDuration={duration}
            hasExported={hasExported}
            hasVideo={!!currentInstance}
            lastAutoSave={lastAutoSave}
            onSelectLabel={handleSelectLabel}
            onSelectDistractor={selectDistractor}
            onUpdateLabel={updateLabel}
            onDeleteLabel={deleteLabel}
            onClearLabels={clearLabelsForVideo}
            onClearSceneDistractors={clearSceneDistractorsForVideo}
            activeVideoIndex={activeVideoIndex}
            videoCount={currentInstance?.videos.length || 1}
            onFilterChange={setActiveVideoIndex}
            labelCounts={labelCounts}
            sceneDistractors={sceneDistractors}
            onUpdateSceneDistractor={updateSceneDistractor}
            onDeleteSceneDistractor={deleteSceneDistractor}
            onAddSceneDistractor={addSceneDistractor}
            onMarkAsSceneDistractor={markLabelAsSceneDistractor}
            onMarkAsTrueLabel={markDistractorAsTrueLabel}
            causalRelations={causalRelations}
            selectedCausalId={selectedCausalId}
            onSelectCausal={selectCausalRelation}
            onUpdateCausal={updateCausalRelation}
            onDeleteCausal={deleteCausalRelation}
            onAddCausal={addCausalRelation}
            onClearCausalRelations={clearCausalRelationsForVideo}
            onSelectCauseLabel={(relationId) => {
              selectCausalRelation(relationId);
            }}
            onSelectEffectLabel={(relationId) => {
              selectCausalRelation(relationId);
            }}
            onSetCauseLabel={(relationId, labelId) => {
              setCauseLabel(relationId, labelId);
            }}
            onSetEffectLabel={(relationId, labelId) => {
              setEffectLabel(relationId, labelId);
            }}
            customQuestions={customQuestions}
            selectedCustomQuestionId={selectedCustomQuestionId}
            onSelectCustomQuestion={selectQuestion}
            onUpdateCustomQuestion={updateCustomQuestion}
            onDeleteCustomQuestion={deleteCustomQuestion}
            onAddCustomQuestion={addCustomQuestion}
            onClearCustomQuestions={clearCustomQuestionsForVideo}
            onConfirm={confirmModal.confirm}
            onPlaySegment={handlePlaySegment}
          />
        </div>
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismissToast} />
    </div>
  );
}
