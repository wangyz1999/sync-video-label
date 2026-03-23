import { useState, useCallback } from 'react';
import { SceneDistractor, EventType, LabelEntry } from '../types';

export function useSceneDistractors() {
  const [sceneDistractors, setSceneDistractors] = useState<SceneDistractor[]>([]);
  const [selectedDistractorId, setSelectedDistractorId] = useState<string | null>(null);

  // Add a new scene distractor
  const addSceneDistractor = useCallback((type: EventType, videoIndex: number) => {
    const newDistractor: SceneDistractor = {
      id: `distractor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      videoIndex,
      caption: '',
    };
    setSceneDistractors((prev) => [...prev, newDistractor]);
  }, []);

  // Update a scene distractor
  const updateSceneDistractor = useCallback((id: string, updates: Partial<SceneDistractor>) => {
    setSceneDistractors((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  }, []);

  // Delete a scene distractor
  const deleteSceneDistractor = useCallback(
    (id: string) => {
      setSceneDistractors((prev) => prev.filter((d) => d.id !== id));
      if (selectedDistractorId === id) {
        setSelectedDistractorId(null);
      }
    },
    [selectedDistractorId]
  );

  // Clear all scene distractors
  const clearSceneDistractors = useCallback(() => {
    setSceneDistractors([]);
    setSelectedDistractorId(null);
  }, []);

  // Clear scene distractors for a specific video or all if videoIndex is undefined
  const clearSceneDistractorsForVideo = useCallback(
    (videoIndex?: number) => {
      if (videoIndex === undefined) {
        setSceneDistractors([]);
        setSelectedDistractorId(null);
      } else {
        setSceneDistractors((prev) => {
          const remaining = prev.filter((d) => d.videoIndex !== videoIndex);
          if (selectedDistractorId && !remaining.find((d) => d.id === selectedDistractorId)) {
            setSelectedDistractorId(null);
          }
          return remaining;
        });
      }
    },
    [selectedDistractorId]
  );

  // Create a scene distractor from a label (strips time range, quantity, lexical distractors)
  const createDistractorFromLabel = useCallback((label: LabelEntry): SceneDistractor => {
    return {
      id: `distractor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: label.type,
      videoIndex: label.videoIndex,
      caption: label.caption,
    };
  }, []);

  // Add a distractor from a label
  const addDistractorFromLabel = useCallback(
    (label: LabelEntry) => {
      const newDistractor = createDistractorFromLabel(label);
      setSceneDistractors((prev) => [...prev, newDistractor]);
    },
    [createDistractorFromLabel]
  );

  // Select distractor
  const selectDistractor = useCallback((id: string | null) => {
    setSelectedDistractorId(id);
  }, []);

  // Load scene distractors from data
  const loadSceneDistractors = useCallback((distractors: SceneDistractor[]) => {
    setSceneDistractors(distractors);
    setSelectedDistractorId(null);
  }, []);

  return {
    sceneDistractors,
    selectedDistractorId,
    addSceneDistractor,
    updateSceneDistractor,
    deleteSceneDistractor,
    clearSceneDistractors,
    clearSceneDistractorsForVideo,
    createDistractorFromLabel,
    addDistractorFromLabel,
    selectDistractor,
    loadSceneDistractors,
    setSceneDistractors,
  };
}
