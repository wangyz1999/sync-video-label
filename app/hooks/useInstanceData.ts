import { useCallback, useEffect, useState } from 'react';
import {
  InstanceAnnotation,
  LabelEntry,
  SceneDistractor,
  CausalRelation,
  CustomQuestion,
} from '../types';
import type { VideoInstance } from './useMultiVideoPlayer';

interface UseInstanceDataOptions {
  currentInstance: VideoInstance | null;
  onLoadLabels: (data: InstanceAnnotation | { labels: LabelEntry[] }) => void;
  onLoadSceneDistractors: (distractors: SceneDistractor[]) => void;
  onLoadCausalRelations?: (relations: CausalRelation[]) => void;
  onLoadCustomQuestions?: (questions: CustomQuestion[]) => void;
}

export function useInstanceData({
  currentInstance,
  onLoadLabels,
  onLoadSceneDistractors,
  onLoadCausalRelations,
  onLoadCustomQuestions,
}: UseInstanceDataOptions) {
  const [instanceStatuses, setInstanceStatuses] = useState<
    Record<string, 'completed' | 'in-progress' | 'not-started'>
  >({});

  // Load autosave or prediction on instance change (auto-import without asking)
  useEffect(() => {
    if (!currentInstance) return;

    const loadSavedData = async (instance: typeof currentInstance) => {
      const projectFolderParam = instance.projectFolder
        ? `&projectFolder=${encodeURIComponent(instance.projectFolder)}`
        : '';

      // First, try to load autosave - auto-import without asking
      try {
        const autosaveResponse = await fetch(
          `/api/annotation?instanceId=${encodeURIComponent(instance.id)}&type=autosave${projectFolderParam}`
        );
        if (autosaveResponse.ok) {
          const data = (await autosaveResponse.json()) as InstanceAnnotation;
          if (
            (data.labels && data.labels.length > 0) ||
            (data.sceneDistractors && data.sceneDistractors.length > 0) ||
            (data.causalRelations && data.causalRelations.length > 0) ||
            (data.customQuestions && data.customQuestions.length > 0)
          ) {
            onLoadLabels(data);
            if (data.sceneDistractors) {
              onLoadSceneDistractors(data.sceneDistractors);
            }
            if (data.causalRelations && onLoadCausalRelations) {
              onLoadCausalRelations(data.causalRelations);
            }
            if (data.customQuestions && onLoadCustomQuestions) {
              onLoadCustomQuestions(data.customQuestions);
            }
            console.log(
              `Auto-restored ${data.labels?.length || 0} labels, ${data.sceneDistractors?.length || 0} scene distractors, ${data.causalRelations?.length || 0} causal relations, and ${data.customQuestions?.length || 0} custom questions for "${instance.name}" from ${new Date(data.lastModified).toLocaleString()}`
            );
            return; // Don't load prediction if autosave was loaded
          }
        }
      } catch {
        // No autosave found, continue to check prediction
      }

      // If no autosave loaded and instance has a prediction path, load it automatically
      if (instance.predictionPath) {
        try {
          // Extract instanceId from prediction path (e.g., "instance-002.json" -> "instance-002")
          const predictionId = instance.predictionPath.replace(/\.json$/, '');
          const predResponse = await fetch(
            `/api/annotation?instanceId=${encodeURIComponent(predictionId)}&type=prediction${projectFolderParam}`
          );
          if (predResponse.ok) {
            const data = (await predResponse.json()) as InstanceAnnotation;
            if (
              (data.labels && data.labels.length > 0) ||
              (data.sceneDistractors && data.sceneDistractors.length > 0) ||
              (data.causalRelations && data.causalRelations.length > 0) ||
              (data.customQuestions && data.customQuestions.length > 0)
            ) {
              onLoadLabels(data);
              if (data.sceneDistractors) {
                onLoadSceneDistractors(data.sceneDistractors);
              }
              if (data.causalRelations && onLoadCausalRelations) {
                onLoadCausalRelations(data.causalRelations);
              }
              if (data.customQuestions && onLoadCustomQuestions) {
                onLoadCustomQuestions(data.customQuestions);
              }
              console.log(
                `Loaded ${data.labels?.length || 0} prediction labels, ${data.sceneDistractors?.length || 0} scene distractors, ${data.causalRelations?.length || 0} causal relations, and ${data.customQuestions?.length || 0} custom questions for "${instance.name}"`
              );
            }
          }
        } catch {
          console.warn(`Failed to load prediction for "${instance.name}"`);
        }
      }
    };

    loadSavedData(currentInstance);
  }, [
    currentInstance,
    onLoadLabels,
    onLoadSceneDistractors,
    onLoadCausalRelations,
    onLoadCustomQuestions,
  ]);

  // Fetch instance statuses
  const fetchInstanceStatuses = useCallback(async (instances: VideoInstance[]) => {
    if (instances.length === 0) return;

    try {
      const instanceIds = instances.map((i) => i.id).join(',');
      // Use projectFolder from first instance (all instances in same project share folder)
      const projectFolder = instances[0]?.projectFolder;
      const projectFolderParam = projectFolder
        ? `&projectFolder=${encodeURIComponent(projectFolder)}`
        : '';
      const response = await fetch(
        `/api/annotation?type=status&instanceIds=${encodeURIComponent(instanceIds)}${projectFolderParam}`
      );
      if (response.ok) {
        const data = await response.json();
        setInstanceStatuses(data.statuses);
      }
    } catch (error) {
      console.error('Failed to fetch instance statuses:', error);
    }
  }, []);

  // Update instance status
  const updateInstanceStatus = useCallback(
    (instanceId: string, status: 'completed' | 'in-progress' | 'not-started') => {
      setInstanceStatuses((prev) => {
        // Only update if not already completed (for in-progress updates)
        if (status === 'in-progress' && prev[instanceId] === 'completed') {
          return prev;
        }
        return { ...prev, [instanceId]: status };
      });
    },
    []
  );

  return {
    instanceStatuses,
    fetchInstanceStatuses,
    updateInstanceStatus,
    setInstanceStatuses,
  };
}
