import { useState, useCallback } from 'react';
import { LabelEntry, EventType, InstanceAnnotation } from '../types';
import { transformLabelsForLoad } from '../utils/labelTransform';

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useLabels() {
  const [labels, setLabels] = useState<LabelEntry[]>([]);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [hasExported, setHasExported] = useState(false);
  const [isDirty, setIsDirty] = useState(false); // Track if user made any changes

  // Get selected label
  const selectedLabel = labels.find((l) => l.id === selectedLabelId) || null;

  // Create new label with videoIndex support
  const createLabel = useCallback(
    (
      type: EventType,
      startTime: number,
      endTime: number,
      videoIndex: number = 0,
      caption: string = ''
    ): LabelEntry => {
      const newLabel: LabelEntry = {
        id: generateId(),
        type,
        videoIndex,
        startTime: Math.min(startTime, endTime),
        endTime: Math.max(startTime, endTime),
        caption,
        quantity: type === 'WO' ? 1 : undefined,
        isCountable: type === 'WO' ? true : undefined,
      };
      setLabels((prev) => [...prev, newLabel]);
      setSelectedLabelId(newLabel.id);
      setHasExported(false);
      setIsDirty(true);
      return newLabel;
    },
    []
  );

  // Update label
  const updateLabel = useCallback((id: string, updates: Partial<LabelEntry>) => {
    setLabels((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    setHasExported(false);
    setIsDirty(true);
  }, []);

  // Delete label
  const deleteLabel = useCallback(
    (id: string) => {
      setLabels((prev) => prev.filter((l) => l.id !== id));
      if (selectedLabelId === id) {
        setSelectedLabelId(null);
      }
      setHasExported(false);
      setIsDirty(true);
    },
    [selectedLabelId]
  );

  // Duplicate label
  const duplicateLabel = useCallback(
    (id: string) => {
      const labelToDuplicate = labels.find((l) => l.id === id);
      if (!labelToDuplicate) return;

      const newLabel: LabelEntry = {
        ...labelToDuplicate,
        id: generateId(),
        // Offset the duplicate by 1 second
        startTime: labelToDuplicate.endTime,
        endTime: labelToDuplicate.endTime + (labelToDuplicate.endTime - labelToDuplicate.startTime),
      };

      setLabels((prev) => [...prev, newLabel]);
      setSelectedLabelId(newLabel.id);
      setHasExported(false);
      setIsDirty(true);
    },
    [labels]
  );

  // Select label
  const selectLabel = useCallback((id: string | null) => {
    setSelectedLabelId(id);
  }, []);

  // Move selected label by seconds
  const moveSelectedLabel = useCallback(
    (seconds: number, videoDuration: number) => {
      if (!selectedLabelId) return;

      setLabels((prev) =>
        prev.map((l) => {
          if (l.id !== selectedLabelId) return l;

          const duration = l.endTime - l.startTime;
          let newStart = l.startTime + seconds;
          let newEnd = l.endTime + seconds;

          // Clamp to video bounds
          if (newStart < 0) {
            newStart = 0;
            newEnd = duration;
          }
          if (newEnd > videoDuration) {
            newEnd = Math.floor(videoDuration);
            newStart = newEnd - duration;
          }

          return { ...l, startTime: Math.round(newStart), endTime: Math.round(newEnd) };
        })
      );
      setHasExported(false);
      setIsDirty(true);
    },
    [selectedLabelId]
  );

  // Clear all labels
  const clearLabels = useCallback(() => {
    setLabels([]);
    setSelectedLabelId(null);
    setHasExported(false);
    setIsDirty(false);
  }, []);

  // Clear labels for a specific video or all labels if videoIndex is undefined
  const clearLabelsForVideo = useCallback(
    (videoIndex?: number) => {
      if (videoIndex === undefined) {
        // Clear all labels
        setLabels([]);
        setSelectedLabelId(null);
      } else {
        // Clear only labels for the specific video
        setLabels((prev) => {
          const remaining = prev.filter((l) => l.videoIndex !== videoIndex);
          // If selected label was deleted, clear selection
          if (selectedLabelId && !remaining.find((l) => l.id === selectedLabelId)) {
            setSelectedLabelId(null);
          }
          return remaining;
        });
      }
      setHasExported(false);
      setIsDirty(true);
    },
    [selectedLabelId]
  );

  // Load labels from instance annotation
  const loadLabels = useCallback((state: InstanceAnnotation | { labels: LabelEntry[] }) => {
    // Ensure all labels have videoIndex (backwards compatibility)
    const loadedLabels = (state.labels || []).map((l) => ({
      ...l,
      videoIndex: l.videoIndex ?? 0,
    }));
    // Transform labels to fix any corrupted state types and set caption correctly
    const transformedLabels = transformLabelsForLoad(loadedLabels);
    setLabels(transformedLabels);
    setSelectedLabelId(null);
    setHasExported(false);
    setIsDirty(false); // Loading labels doesn't count as user modification
  }, []);

  // Mark as exported
  const markExported = useCallback(() => {
    setHasExported(true);
    setIsDirty(false); // After saving, no longer dirty
  }, []);

  // Get labels for a specific video
  const getLabelsForVideo = useCallback(
    (videoIndex: number) => {
      return labels.filter((l) => l.videoIndex === videoIndex);
    },
    [labels]
  );

  // Get label counts per video
  const getLabelCountsPerVideo = useCallback(
    (videoCount: number) => {
      const counts = new Array(videoCount).fill(0);
      labels.forEach((l) => {
        if (l.videoIndex >= 0 && l.videoIndex < videoCount) {
          counts[l.videoIndex]++;
        }
      });
      return counts;
    },
    [labels]
  );

  // Get labels grouped by type
  const getLabelsByType = useCallback(() => {
    const grouped: Record<EventType, LabelEntry[]> = {
      SA: [],
      SS: [],
      OA: [],
      OS: [],
      WO: [],
      WE: [],
    };
    labels.forEach((l) => {
      grouped[l.type].push(l);
    });
    return grouped;
  }, [labels]);

  // Get labels grouped by type for a specific video
  const getLabelsByTypeForVideo = useCallback(
    (videoIndex: number) => {
      const grouped: Record<EventType, LabelEntry[]> = {
        SA: [],
        SS: [],
        OA: [],
        OS: [],
        WO: [],
        WE: [],
      };
      labels
        .filter((l) => l.videoIndex === videoIndex)
        .forEach((l) => {
          grouped[l.type].push(l);
        });
      return grouped;
    },
    [labels]
  );

  return {
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
    getLabelsByType,
    getLabelsByTypeForVideo,
    setLabels,
  };
}
