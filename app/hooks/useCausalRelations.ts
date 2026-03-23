import { useState, useCallback } from 'react';
import { CausalRelation } from '../types';

export function useCausalRelations() {
  const [causalRelations, setCausalRelations] = useState<CausalRelation[]>([]);
  const [selectedCausalId, setSelectedCausalId] = useState<string | null>(null);

  // Add a new causal relation
  const addCausalRelation = useCallback((videoIndex: number) => {
    const newRelation: CausalRelation = {
      id: `causal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      videoIndex,
      causeId: '',
      effectId: '',
    };
    setCausalRelations((prev) => [...prev, newRelation]);
    setSelectedCausalId(newRelation.id);
    return newRelation.id;
  }, []);

  // Update a causal relation
  const updateCausalRelation = useCallback((id: string, updates: Partial<CausalRelation>) => {
    setCausalRelations((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }, []);

  // Delete a causal relation
  const deleteCausalRelation = useCallback(
    (id: string) => {
      setCausalRelations((prev) => prev.filter((r) => r.id !== id));
      if (selectedCausalId === id) {
        setSelectedCausalId(null);
      }
    },
    [selectedCausalId]
  );

  // Clear all causal relations
  const clearCausalRelations = useCallback(() => {
    setCausalRelations([]);
    setSelectedCausalId(null);
  }, []);

  // Clear causal relations for a specific video or all if videoIndex is undefined
  const clearCausalRelationsForVideo = useCallback(
    (videoIndex?: number) => {
      if (videoIndex === undefined) {
        setCausalRelations([]);
        setSelectedCausalId(null);
      } else {
        setCausalRelations((prev) => {
          const remaining = prev.filter((r) => r.videoIndex !== videoIndex);
          if (selectedCausalId && !remaining.find((r) => r.id === selectedCausalId)) {
            setSelectedCausalId(null);
          }
          return remaining;
        });
      }
    },
    [selectedCausalId]
  );

  // Select causal relation
  const selectCausalRelation = useCallback((id: string | null) => {
    setSelectedCausalId(id);
  }, []);

  // Load causal relations from data
  const loadCausalRelations = useCallback((relations: CausalRelation[]) => {
    setCausalRelations(relations);
    setSelectedCausalId(null);
  }, []);

  // Set cause label for a relation
  const setCauseLabel = useCallback((relationId: string, labelId: string) => {
    setCausalRelations((prev) =>
      prev.map((r) => (r.id === relationId ? { ...r, causeId: labelId } : r))
    );
  }, []);

  // Set effect label for a relation
  const setEffectLabel = useCallback((relationId: string, labelId: string) => {
    setCausalRelations((prev) =>
      prev.map((r) => (r.id === relationId ? { ...r, effectId: labelId } : r))
    );
  }, []);

  // Clean up relations that reference deleted labels
  const cleanupOrphanedRelations = useCallback((validLabelIds: Set<string>) => {
    setCausalRelations((prev) =>
      prev.map((r) => ({
        ...r,
        causeId: validLabelIds.has(r.causeId) ? r.causeId : '',
        effectId: validLabelIds.has(r.effectId) ? r.effectId : '',
      }))
    );
  }, []);

  return {
    causalRelations,
    selectedCausalId,
    addCausalRelation,
    updateCausalRelation,
    deleteCausalRelation,
    clearCausalRelations,
    clearCausalRelationsForVideo,
    selectCausalRelation,
    loadCausalRelations,
    setCausalRelations,
    setCauseLabel,
    setEffectLabel,
    cleanupOrphanedRelations,
  };
}
