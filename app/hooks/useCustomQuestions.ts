import { useState, useCallback } from 'react';
import { CustomQuestion } from '../types';

export function useCustomQuestions() {
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [selectedCustomQuestionId, setSelectedCustomQuestionId] = useState<string | null>(null);

  // Add a new custom question
  const addCustomQuestion = useCallback((videoIndex: number) => {
    const newQuestion: CustomQuestion = {
      id: `custom-q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      videoIndex,
      question: '',
      correctOption: '',
      distractorOptions: [],
    };
    setCustomQuestions((prev) => [...prev, newQuestion]);
    return newQuestion.id;
  }, []);

  // Update a custom question
  const updateCustomQuestion = useCallback((id: string, updates: Partial<CustomQuestion>) => {
    setCustomQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  }, []);

  // Delete a custom question
  const deleteCustomQuestion = useCallback(
    (id: string) => {
      setCustomQuestions((prev) => prev.filter((q) => q.id !== id));
      if (selectedCustomQuestionId === id) {
        setSelectedCustomQuestionId(null);
      }
    },
    [selectedCustomQuestionId]
  );

  // Clear all custom questions
  const clearCustomQuestions = useCallback(() => {
    setCustomQuestions([]);
    setSelectedCustomQuestionId(null);
  }, []);

  // Clear custom questions for a specific video or all if videoIndex is undefined
  const clearCustomQuestionsForVideo = useCallback(
    (videoIndex?: number) => {
      if (videoIndex === undefined) {
        setCustomQuestions([]);
        setSelectedCustomQuestionId(null);
      } else {
        setCustomQuestions((prev) => {
          const remaining = prev.filter((q) => q.videoIndex !== videoIndex);
          if (
            selectedCustomQuestionId &&
            !remaining.find((q) => q.id === selectedCustomQuestionId)
          ) {
            setSelectedCustomQuestionId(null);
          }
          return remaining;
        });
      }
    },
    [selectedCustomQuestionId]
  );

  // Select question
  const selectQuestion = useCallback((id: string | null) => {
    setSelectedCustomQuestionId(id);
  }, []);

  // Load custom questions from data
  const loadCustomQuestions = useCallback((questions: CustomQuestion[]) => {
    setCustomQuestions(questions);
    setSelectedCustomQuestionId(null);
  }, []);

  return {
    customQuestions,
    selectedCustomQuestionId,
    addCustomQuestion,
    updateCustomQuestion,
    deleteCustomQuestion,
    clearCustomQuestions,
    clearCustomQuestionsForVideo,
    selectQuestion,
    loadCustomQuestions,
    setCustomQuestions,
  };
}
