import { LabelEntry, SceneDistractor, CausalRelation, CustomQuestion } from '../../types';
import { GeneratedQuestion, QuestionStats, DistractorType, QuestionLevel } from './types';
import { generateLevel1Questions } from './level1';
import {
  generateLevel2Questions,
  generateTimelineReferenceQuestions,
  generateOrderQuestions,
} from './level2';
import { generateLevel3Questions } from './level3';

// Re-export all types
export * from './types';

// Re-export templates for external use
export {
  LEVEL1_TEMPLATES,
  LEVEL2_TEMPLATES,
  LEVEL2_TR_TEMPLATES,
  LEVEL3_TEMPLATES,
  LEVEL3_POV_ID_TEMPLATES,
  LEVEL3_ORDER_TEMPLATES,
} from './templates';

/**
 * Main question generation function
 * Generates questions at all applicable levels based on the provided labels and distractors
 */
export function generateQuestions(
  labels: LabelEntry[],
  sceneDistractors: SceneDistractor[],
  videoCount: number = 1,
  videoDuration: number = 60, // Default to 60 seconds if not provided
  causalRelations: CausalRelation[] = [],
  customQuestions: CustomQuestion[] = []
): GeneratedQuestion[] {
  const allQuestions: GeneratedQuestion[] = [];

  // Generate Level 1 questions (Perception) - includes INTENT and CAUSAL
  allQuestions.push(
    ...generateLevel1Questions(labels, sceneDistractors, videoDuration, -1, causalRelations)
  );

  // Generate Level 2 questions (Temporal Relation)
  allQuestions.push(...generateLevel2Questions(labels, sceneDistractors, videoDuration));

  // Generate Level 2 Timeline Reference questions (TR2Y) - direct timestamp reference
  allQuestions.push(...generateTimelineReferenceQuestions(labels, sceneDistractors, videoDuration));

  // Generate Level 2 ORDER questions (temporal ordering)
  allQuestions.push(...generateOrderQuestions(labels, videoDuration));

  // Generate Level 3 questions (Cross-Video Relation) - only if multiple videos
  if (videoCount > 1) {
    allQuestions.push(
      ...generateLevel3Questions(labels, sceneDistractors, videoDuration, videoCount)
    );
  }

  // Add custom questions
  for (const customQ of customQuestions) {
    // Only include questions with required fields
    if (customQ.question && customQ.correctOption) {
      const generatedQuestion: GeneratedQuestion = {
        id: customQ.id,
        level: 1, // Custom questions are treated as level 1
        code: 'CUSTOM',
        question: customQ.question,
        answer: {
          option: customQ.correctOption,
          start: customQ.startTime,
          end: customQ.endTime,
        },
        distractors: customQ.distractorOptions
          .filter((opt) => opt.trim() !== '')
          .map((opt) => ({
            type: 'scene' as DistractorType, // Custom distractors are treated as scene distractors
            option: opt,
          })),
        videoIndex: customQ.videoIndex,
        videoContext:
          customQ.startTime !== undefined && customQ.endTime !== undefined
            ? {
                start: customQ.startTime,
                end: customQ.endTime,
              }
            : undefined,
      };
      allQuestions.push(generatedQuestion);
    }
  }

  return allQuestions;
}

/**
 * Calculate statistics for generated questions
 */
export function getQuestionStats(questions: GeneratedQuestion[]): QuestionStats {
  const stats: QuestionStats = {
    total: questions.length,
    byLevel: { 1: 0, 2: 0, 3: 0 },
    byCode: {},
    byDistractorType: {
      lexical: 0,
      scene: 0,
      temporal: 0,
      role: 0,
      'cross-video': 0,
      binary: 0,
      count: 0,
      intent: 0,
      causal: 0,
      order: 0,
    },
  };

  for (const q of questions) {
    // Count by level
    stats.byLevel[q.level as QuestionLevel]++;

    // Count by code
    stats.byCode[q.code] = (stats.byCode[q.code] || 0) + 1;

    // Count distractors by type
    for (const d of q.distractors) {
      stats.byDistractorType[d.type as DistractorType]++;
    }
  }

  return stats;
}

// Re-export level generators for advanced usage
export { generateLevel1Questions } from './level1';
export {
  generateLevel2Questions,
  generateTimelineReferenceQuestions,
  generateOrderQuestions,
} from './level2';
export { generateLevel3Questions } from './level3';
