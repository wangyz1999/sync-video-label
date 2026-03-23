import { useState, useCallback, useEffect } from 'react';
import {
  InstanceAnnotation,
  LabelEntry,
  SceneDistractor,
  CausalRelation,
  CustomQuestion,
} from '../types';
import type { VideoInstance } from './useMultiVideoPlayer';
import { transformLabelsForSave } from '../utils/labelTransform';

// Auto-save interval in milliseconds
const AUTOSAVE_INTERVAL = 30000; // 30 seconds
const DEBOUNCE_DELAY = 5000; // 5 seconds

interface UseAutoSaveOptions {
  currentInstance: VideoInstance | null;
  duration: number;
  labels: LabelEntry[];
  sceneDistractors: SceneDistractor[];
  causalRelations: CausalRelation[];
  customQuestions?: CustomQuestion[];
  onStatusUpdate?: (instanceId: string, status: 'in-progress') => void;
}

export function useAutoSave({
  currentInstance,
  duration,
  labels,
  sceneDistractors,
  causalRelations,
  customQuestions = [],
  onStatusUpdate,
}: UseAutoSaveOptions) {
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Auto-save function
  const autoSave = useCallback(async () => {
    if (
      !currentInstance ||
      (labels.length === 0 &&
        sceneDistractors.length === 0 &&
        causalRelations.length === 0 &&
        customQuestions.length === 0)
    )
      return;

    setIsAutoSaving(true);
    const annotation: InstanceAnnotation = {
      instanceId: currentInstance.id,
      instanceName: currentInstance.name,
      videoPaths: currentInstance.videos.map((v) => v.path),
      videoDuration: duration,
      labels: transformLabelsForSave(labels),
      sceneDistractors: sceneDistractors.length > 0 ? sceneDistractors : undefined,
      causalRelations: causalRelations.length > 0 ? causalRelations : undefined,
      customQuestions: customQuestions.length > 0 ? customQuestions : undefined,
      lastModified: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/annotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...annotation,
          isAutosave: true,
          projectFolder: currentInstance.projectFolder,
        }),
      });

      if (response.ok) {
        setLastAutoSave(new Date());
        // Update status to in-progress if callback provided
        if (onStatusUpdate) {
          onStatusUpdate(currentInstance.id, 'in-progress');
        }
      } else if (response.status === 503) {
        // Read-only filesystem (e.g. Vercel demo deployment) — silently skip
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [
    currentInstance,
    duration,
    labels,
    sceneDistractors,
    causalRelations,
    customQuestions,
    onStatusUpdate,
  ]);

  // Periodic auto-save effect
  useEffect(() => {
    if (
      !currentInstance ||
      (labels.length === 0 &&
        sceneDistractors.length === 0 &&
        causalRelations.length === 0 &&
        customQuestions.length === 0)
    )
      return;

    const interval = setInterval(autoSave, AUTOSAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [
    autoSave,
    currentInstance,
    labels.length,
    sceneDistractors.length,
    causalRelations.length,
    customQuestions.length,
  ]);

  // Debounced auto-save when labels, scene distractors, causal relations, or custom questions change
  useEffect(() => {
    if (
      !currentInstance ||
      (labels.length === 0 &&
        sceneDistractors.length === 0 &&
        causalRelations.length === 0 &&
        customQuestions.length === 0)
    )
      return;

    const timeout = setTimeout(autoSave, DEBOUNCE_DELAY);
    return () => clearTimeout(timeout);
  }, [labels, sceneDistractors, causalRelations, customQuestions, autoSave, currentInstance]);

  // Reset auto-save state
  const resetAutoSave = useCallback(() => {
    setLastAutoSave(null);
  }, []);

  return {
    lastAutoSave,
    isAutoSaving,
    autoSave,
    resetAutoSave,
  };
}
