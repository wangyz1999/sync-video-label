import { useState, useCallback, useRef } from 'react';
import { InstanceAnnotation, LabelEntry, SceneDistractor } from '../types';
import type { LLMSettings, PredictionProgress } from '../components';
import type { VideoInstance } from './useMultiVideoPlayer';
import type { BatchProgress } from '../components/BatchGenerateModal';

interface UsePredictionOptions {
  currentInstance: VideoInstance | null;
  duration: number;
  labels: LabelEntry[];
  sceneDistractors: SceneDistractor[];
  llmSettings: LLMSettings;
  instances: VideoInstance[];
  onLoadLabels: (data: InstanceAnnotation | { labels: LabelEntry[] }) => void;
  onLoadSceneDistractors: (distractors: SceneDistractor[]) => void;
  onResetAutoSave: () => void;
  onConfirm: (config: {
    title: string;
    message: string;
    confirmText: string;
    variant: 'warning' | 'danger' | 'info';
  }) => Promise<boolean>;
  onToast: {
    success: (title: string, message: string, duration?: number) => void;
    error: (title: string, message: string) => void;
    warning: (title: string, message: string) => void;
  };
}

export function usePrediction({
  currentInstance,
  duration,
  labels,
  sceneDistractors,
  llmSettings,
  instances,
  onLoadLabels,
  onLoadSceneDistractors,
  onResetAutoSave,
  onConfirm,
  onToast,
}: UsePredictionOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [predictionProgress, setPredictionProgress] = useState<PredictionProgress>({
    isActive: false,
    videos: [],
  });
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const batchCancelledRef = useRef(false);

  // Import prediction for current instance
  const importPrediction = useCallback(async () => {
    if (!currentInstance) return;

    const projectFolderParam = currentInstance.projectFolder
      ? `&projectFolder=${encodeURIComponent(currentInstance.projectFolder)}`
      : '';

    try {
      const response = await fetch(
        `/api/annotation?instanceId=${encodeURIComponent(currentInstance.id)}&type=prediction${projectFolderParam}`
      );
      if (response.ok) {
        const data = (await response.json()) as InstanceAnnotation;
        if (data.labels && data.labels.length > 0) {
          const shouldLoad = await onConfirm(
            labels.length > 0
              ? {
                  title: 'Load Prediction?',
                  message: `Found prediction with ${data.labels.length} label(s) for "${currentInstance.name}".\n\nThis will replace your current ${labels.length} label(s). Continue?`,
                  confirmText: 'Load',
                  variant: 'warning',
                }
              : {
                  title: 'Load Prediction?',
                  message: `Found prediction with ${data.labels.length} label(s) for "${currentInstance.name}".\n\nWould you like to load it?`,
                  confirmText: 'Load',
                  variant: 'info',
                }
          );
          if (shouldLoad) {
            onLoadLabels(data);
            if (data.sceneDistractors) {
              onLoadSceneDistractors(data.sceneDistractors);
            }
            onResetAutoSave();
            onToast.success('Prediction loaded', `${data.labels.length} label(s) imported`);
          }
        } else {
          onToast.warning(
            'No labels found',
            `Prediction file for "${currentInstance.name}" is empty`
          );
        }
      } else {
        const expectedPath = currentInstance.projectFolder
          ? `${currentInstance.projectFolder}/prediction/${currentInstance.id}.json`
          : `data/prediction/${currentInstance.id}.json`;
        onToast.error('Prediction not found', `Expected: ${expectedPath}`);
      }
    } catch (error) {
      console.error('Import prediction error:', error);
      onToast.error('Import failed', 'Failed to load prediction file');
    }
  }, [
    currentInstance,
    labels.length,
    onConfirm,
    onLoadLabels,
    onLoadSceneDistractors,
    onResetAutoSave,
    onToast,
  ]);

  // Generate AI prediction for current instance using SSE for real-time progress
  const generatePrediction = useCallback(async () => {
    if (!currentInstance) return;

    // Confirm if there are existing labels
    if (labels.length > 0 || sceneDistractors.length > 0) {
      const confirmed = await onConfirm({
        title: 'Replace Existing Labels?',
        message: `You have ${labels.length} existing label(s) and ${sceneDistractors.length} scene distractor(s). Generating a new prediction will replace them.\n\nContinue?`,
        confirmText: 'Generate',
        variant: 'warning',
      });
      if (!confirmed) return;
    }

    const totalVideos = currentInstance.videos.length;

    // Initialize progress state:
    // - Steps 1-4 (action, state, world, sceneDistractors) start as loading (parallel)
    // - Step 5 (lexicalDistractors) starts as pending (waits for action, state, AND world)
    const initialVideoProgress = Array.from({ length: totalVideos }, () => ({
      action: 'loading' as const,
      state: 'loading' as const,
      world: 'loading' as const,
      sceneDistractors: 'loading' as const,
      lexicalDistractors: 'pending' as const,
    }));

    setIsGenerating(true);
    setPredictionProgress({
      isActive: true,
      videos: initialVideoProgress,
    });

    try {
      // Use fetch with SSE to get real-time progress
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: currentInstance.id,
          instanceName: currentInstance.name,
          videoPaths: currentInstance.videos.map((v) => v.path),
          videoDuration: duration,
          model: llmSettings.model,
          temperature: llmSettings.temperature,
          provider: llmSettings.provider,
          projectFolder: currentInstance.projectFolder,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start prediction');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === 'progress') {
                // Update specific step for specific video
                setPredictionProgress((prev) => {
                  const newVideos = [...prev.videos];
                  if (newVideos[event.videoIndex]) {
                    newVideos[event.videoIndex] = {
                      ...newVideos[event.videoIndex],
                      [event.step]: event.status,
                    };
                  }
                  return { ...prev, videos: newVideos };
                });
              } else if (event.type === 'complete') {
                // All done - load results
                const { prediction, usage } = event;

                onLoadLabels(prediction);
                if (prediction.sceneDistractors) {
                  onLoadSceneDistractors(prediction.sceneDistractors);
                }
                onResetAutoSave();

                // Build usage info string
                const labelCount = prediction.labels?.length || 0;
                const distractorCount = prediction.sceneDistractors?.length || 0;
                const lexicalCount = (prediction.labels || []).reduce(
                  (sum: number, l: { lexicalDistractors?: string[] }) =>
                    sum + (l.lexicalDistractors?.length || 0),
                  0
                );
                let usageInfo = `${labelCount} labels, ${distractorCount} scene, ${lexicalCount} lexical`;
                if (usage) {
                  const { prompt_tokens, completion_tokens, cost } = usage;
                  const costStr = typeof cost === 'number' ? `$${cost.toFixed(4)}` : 'N/A';
                  usageInfo += ` • ${prompt_tokens?.toLocaleString() || '?'} in / ${completion_tokens?.toLocaleString() || '?'} out tokens • Cost: ${costStr}`;
                }

                onToast.success('Prediction generated', usageInfo, 8000);
              } else if (event.type === 'error') {
                throw new Error(event.error);
              }
            } catch {
              // Ignore parse errors for incomplete data
              if (line.trim() && !line.startsWith('data: ')) {
                console.warn('Failed to parse SSE event:', line);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Generate prediction error:', error);
      setPredictionProgress((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      onToast.error('Generation failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      // Brief delay to show completion state, then hide modal
      setTimeout(() => {
        setIsGenerating(false);
        setPredictionProgress({
          isActive: false,
          videos: [],
        });
      }, 500);
    }
  }, [
    currentInstance,
    duration,
    labels.length,
    sceneDistractors.length,
    llmSettings.model,
    llmSettings.temperature,
    llmSettings.provider,
    onConfirm,
    onLoadLabels,
    onLoadSceneDistractors,
    onResetAutoSave,
    onToast,
  ]);

  // Generate predictions for multiple instances (batch mode)
  const generateBatchPredictions = useCallback(
    async (selectedInstanceIds: string[]) => {
      const selectedInstances = instances.filter((inst) => selectedInstanceIds.includes(inst.id));

      if (selectedInstances.length === 0) return;

      batchCancelledRef.current = false;

      // Initialize batch progress
      setBatchProgress({
        isActive: true,
        currentInstanceIndex: 0,
        totalInstances: selectedInstances.length,
        currentInstanceName: selectedInstances[0].name,
        completedInstances: [],
        failedInstances: [],
        videoProgress: [],
      });

      for (let i = 0; i < selectedInstances.length; i++) {
        if (batchCancelledRef.current) {
          break;
        }

        const instance = selectedInstances[i];

        // Update batch progress for current instance
        const initialVideoProgress = Array.from({ length: instance.videos.length }, () => ({
          action: 'loading' as const,
          state: 'loading' as const,
          world: 'loading' as const,
          sceneDistractors: 'loading' as const,
          lexicalDistractors: 'pending' as const,
        }));

        setBatchProgress((prev) =>
          prev
            ? {
                ...prev,
                currentInstanceIndex: i,
                currentInstanceName: instance.name,
                videoProgress: initialVideoProgress,
              }
            : null
        );

        try {
          // Get video duration from first video (we need to fetch it)
          // For batch mode, we'll use a default duration or fetch it from metadata
          const videoDuration = instance.duration || 60; // fallback to 60s

          const response = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instanceId: instance.id,
              instanceName: instance.name,
              videoPaths: instance.videos.map((v) => v.path),
              videoDuration,
              model: llmSettings.model,
              temperature: llmSettings.temperature,
              provider: llmSettings.provider,
              projectFolder: instance.projectFolder,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to start prediction');
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          const decoder = new TextDecoder();
          let buffer = '';
          let completed = false;

          while (!completed && !batchCancelledRef.current) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const event = JSON.parse(line.slice(6));

                  if (event.type === 'progress') {
                    setBatchProgress((prev) => {
                      if (!prev) return null;
                      const newVideoProgress = [...prev.videoProgress];
                      if (newVideoProgress[event.videoIndex]) {
                        newVideoProgress[event.videoIndex] = {
                          ...newVideoProgress[event.videoIndex],
                          [event.step]: event.status,
                        };
                      }
                      return { ...prev, videoProgress: newVideoProgress };
                    });
                  } else if (event.type === 'complete') {
                    completed = true;
                    setBatchProgress((prev) =>
                      prev
                        ? {
                            ...prev,
                            completedInstances: [...prev.completedInstances, instance.id],
                          }
                        : null
                    );
                  } else if (event.type === 'error') {
                    throw new Error(event.error);
                  }
                } catch (parseError) {
                  // Ignore parse errors for incomplete data
                }
              }
            }
          }

          if (!completed && !batchCancelledRef.current) {
            throw new Error('Connection closed unexpectedly');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setBatchProgress((prev) =>
            prev
              ? {
                  ...prev,
                  failedInstances: [
                    ...prev.failedInstances,
                    { id: instance.id, error: errorMessage },
                  ],
                }
              : null
          );
        }
      }

      // Mark batch as complete (keep modal open for user to see results)
      setBatchProgress((prev) => (prev ? { ...prev, videoProgress: [] } : null));
    },
    [instances, llmSettings.model, llmSettings.temperature, llmSettings.provider]
  );

  // Cancel batch generation
  const cancelBatchGeneration = useCallback(() => {
    batchCancelledRef.current = true;
  }, []);

  // Close batch modal
  const closeBatchModal = useCallback(() => {
    setBatchProgress(null);
    batchCancelledRef.current = false;
  }, []);

  return {
    isGenerating,
    predictionProgress,
    importPrediction,
    generatePrediction,
    batchProgress,
    generateBatchPredictions,
    cancelBatchGeneration,
    closeBatchModal,
  };
}
