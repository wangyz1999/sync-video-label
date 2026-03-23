import { LabelEntry, SceneDistractor, EventType } from '../../types';
import { GeneratedQuestion, Distractor, Level2Code, VideoContext } from './types';
import { LEVEL2_TEMPLATES, LEVEL2_TR_TEMPLATES } from './templates';
import {
  getLabelsByType,
  getLabelsByVideo,
  getSceneDistractorsByType,
  getOverlappingLabels,
  getNonOverlappingLabels,
  generateId,
  shuffleArray,
  createLabelReference,
  generateVideoContext,
  formatStateCaption,
  formatOtherSubject,
  formatRelativeTimestampRange,
  ROLE_PAIRS,
} from './helpers';

// Maximum number of timeline reference questions to generate
const MAX_TR_QUESTIONS = 500;

// Maximum number of questions per X2Y type (e.g., SA2SS, SA2OA, etc.)
const MAX_QUESTIONS_PER_TYPE = 100;

// Ordinal suffixes for occurrence numbers
const ORDINAL_SUFFIXES = [
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
  'seventh',
  'eighth',
  'ninth',
  'tenth',
];

/**
 * Get the ordinal string for an occurrence number (1-indexed)
 * e.g., 1 -> "first", 2 -> "second", etc.
 */
function getOrdinal(n: number): string {
  if (n >= 1 && n <= ORDINAL_SUFFIXES.length) {
    return ORDINAL_SUFFIXES[n - 1];
  }
  // Fallback for larger numbers
  const lastDigit = n % 10;
  const lastTwoDigits = n % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${n}th`;
  }
  switch (lastDigit) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/**
 * Build a map of label ID to its occurrence number among labels with the same caption
 * Returns a map where key is label ID and value is { occurrence: number, total: number }
 */
function buildOccurrenceMap(
  labels: LabelEntry[]
): Map<string, { occurrence: number; total: number }> {
  const occurrenceMap = new Map<string, { occurrence: number; total: number }>();

  // Group labels by caption (case-insensitive) and type
  const captionGroups = new Map<string, LabelEntry[]>();
  for (const label of labels) {
    if (!label.caption) continue;
    const key = `${label.type}:${label.caption.trim().toLowerCase()}`;
    if (!captionGroups.has(key)) {
      captionGroups.set(key, []);
    }
    captionGroups.get(key)!.push(label);
  }

  // For each group, sort by start time and assign occurrence numbers
  for (const [, group] of captionGroups) {
    // Sort by start time
    const sorted = [...group].sort((a, b) => a.startTime - b.startTime);
    const total = sorted.length;

    for (let i = 0; i < sorted.length; i++) {
      occurrenceMap.set(sorted[i].id, { occurrence: i + 1, total });
    }
  }

  return occurrenceMap;
}

/**
 * Format a reference caption with occurrence indicator if needed
 * e.g., "jumped" -> "jumped the second time" if it's the 2nd occurrence
 */
function formatRefCaptionWithOccurrence(
  label: LabelEntry,
  occurrenceMap: Map<string, { occurrence: number; total: number }>
): string {
  const caption = formatStateCaption(label);
  const occInfo = occurrenceMap.get(label.id);

  // Only add occurrence indicator if there are multiple occurrences
  if (occInfo && occInfo.total > 1) {
    return `${caption} (the ${getOrdinal(occInfo.occurrence)} time)`;
  }

  return caption;
}

/**
 * Generate Level 2 questions (Temporal Relation)
 * Focus: Spatiotemporal grounding. Questions require finding a specific Anchor (X)
 * in time/space to answer a question about a Target (Y).
 */
export function generateLevel2Questions(
  labels: LabelEntry[],
  sceneDistractors: SceneDistractor[],
  videoDuration: number,
  videoIndex: number = -1
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const relevantLabels = videoIndex === -1 ? labels : getLabelsByVideo(labels, videoIndex);
  const relevantSceneDistractors =
    videoIndex === -1
      ? sceneDistractors
      : sceneDistractors.filter((d) => d.videoIndex === videoIndex);

  // Build occurrence map to track which occurrence each label is (for duplicate captions)
  const occurrenceMap = buildOccurrenceMap(relevantLabels);

  // Track question counts per base type (e.g., SA2SS, SA2OA) to cap at MAX_QUESTIONS_PER_TYPE
  const questionCountByType: Record<string, number> = {};

  // Helper to get base type from code (e.g., 'SA2SS-IDENT' -> 'SA2SS')
  const getBaseType = (code: string): string => {
    const match = code.match(/^([A-Z]+2[A-Z]+)/);
    return match ? match[1] : code;
  };

  for (const template of LEVEL2_TEMPLATES) {
    if (!template.referenceType) continue;

    const refType = template.referenceType as EventType;
    const ansType = template.answerType as EventType;
    const baseCode = template.code as string;
    const baseType = getBaseType(baseCode);

    // Skip if we've already reached the cap for this type
    if ((questionCountByType[baseType] || 0) >= MAX_QUESTIONS_PER_TYPE) continue;

    const refLabels = getLabelsByType(relevantLabels, refType);

    for (const refLabel of refLabels) {
      // Check cap before processing each reference label
      if ((questionCountByType[baseType] || 0) >= MAX_QUESTIONS_PER_TYPE) break;

      // Find overlapping labels of target type
      const overlapping = getOverlappingLabels(
        relevantLabels,
        refLabel.startTime,
        refLabel.endTime,
        ansType
      );

      // Generate video context based on reference label
      const videoContext = generateVideoContext(
        refLabel.startTime,
        refLabel.endTime,
        videoDuration
      );

      // Determine which label to use for {other} - prefer reference if OA/OS, else use answer
      const getOtherSubject = (ansLabel?: LabelEntry) => {
        if (refType === 'OA' || refType === 'OS') {
          return formatOtherSubject(refLabel);
        } else if ((ansType === 'OA' || ansType === 'OS') && ansLabel) {
          return formatOtherSubject(ansLabel);
        }
        return 'the other player';
      };

      // Handle different question types
      if (baseCode.endsWith('-IDENT')) {
        // IDENT questions - need exactly one overlapping label to avoid ambiguous answers
        // (e.g., if player "jumped" while both "in midair" and "holding sword", the question is ambiguous)
        if (overlapping.length !== 1) continue;

        const answerLabel = overlapping[0];
        const otherSubject = getOtherSubject(answerLabel);

        // Use occurrence-aware caption for reference label (e.g., "jumped (the second time)")
        const questionText = template.template
          .replace('{refCaption}', formatRefCaptionWithOccurrence(refLabel, occurrenceMap))
          .replace('{caption}', formatStateCaption(answerLabel))
          .replace('{other}', otherSubject);

        const distractors = gatherDistractors(
          answerLabel,
          relevantLabels,
          relevantSceneDistractors,
          videoContext,
          ansType
        );

        if (distractors.length >= 2) {
          const selectedDistractors = shuffleArray([...distractors]).slice(0, 3);
          questions.push({
            id: generateId(),
            level: 2,
            code: baseCode as Level2Code,
            question: questionText,
            answer: {
              option: formatStateCaption(answerLabel),
              start: answerLabel.startTime,
              end: answerLabel.endTime,
            },
            distractors: selectedDistractors,
            allDistractors: distractors,
            videoIndex: refLabel.videoIndex,
            videoContext,
            referenceLabel: createLabelReference(refLabel),
            targetLabel: createLabelReference(answerLabel),
          });
          questionCountByType[baseType] = (questionCountByType[baseType] || 0) + 1;
        }
      } else if (baseCode.endsWith('-EXIST')) {
        // EXIST questions - generate True, Lexical, Scene, Temporal, and Role variants
        const remainingSlots = MAX_QUESTIONS_PER_TYPE - (questionCountByType[baseType] || 0);
        const existQuestions = generateExistQuestions(
          refLabel,
          overlapping,
          relevantLabels,
          relevantSceneDistractors,
          videoContext,
          videoDuration,
          template,
          ansType,
          getOtherSubject,
          occurrenceMap
        );
        const questionsToAdd = existQuestions.slice(0, remainingSlots);
        questions.push(...questionsToAdd);
        questionCountByType[baseType] =
          (questionCountByType[baseType] || 0) + questionsToAdd.length;
      } else if (baseCode.endsWith('-ABSENT')) {
        // ABSENT questions - need scene distractors and overlapping labels
        const typeSceneDistractors = getSceneDistractorsByType(relevantSceneDistractors, ansType);
        if (typeSceneDistractors.length === 0 || overlapping.length < 2) continue;

        const sceneDistractor = typeSceneDistractors[0];
        const otherSubject = getOtherSubject();

        // Use occurrence-aware caption for reference label
        const questionText = template.template
          .replace('{refCaption}', formatRefCaptionWithOccurrence(refLabel, occurrenceMap))
          .replace('{other}', otherSubject);

        const allDistractors: Distractor[] = overlapping.map((l) => ({
          type: 'temporal' as const,
          option: formatStateCaption(l),
          start: l.startTime,
          end: l.endTime,
        }));

        questions.push({
          id: generateId(),
          level: 2,
          code: baseCode as Level2Code,
          question: questionText,
          answer: { option: sceneDistractor.caption },
          distractors: allDistractors.slice(0, 3),
          allDistractors: allDistractors,
          videoIndex: refLabel.videoIndex,
          videoContext,
          referenceLabel: createLabelReference(refLabel),
        });
        questionCountByType[baseType] = (questionCountByType[baseType] || 0) + 1;
      }
    }
  }

  return questions;
}

/**
 * Generate EXIST questions with distractor type marking (True, Lexical, Scene, Temporal, Role)
 * Similar to Level 1 EXIST question generation
 */
function generateExistQuestions(
  refLabel: LabelEntry,
  overlapping: LabelEntry[],
  allLabels: LabelEntry[],
  sceneDistractors: SceneDistractor[],
  videoContext: VideoContext,
  videoDuration: number,
  template: (typeof LEVEL2_TEMPLATES)[0],
  ansType: EventType,
  getOtherSubject: (ansLabel?: LabelEntry) => string,
  occurrenceMap: Map<string, { occurrence: number; total: number }>
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const baseCode = template.code as string; // e.g., 'SA2SS-EXIST'

  // Use occurrence-aware caption for reference label
  const refCaptionWithOccurrence = formatRefCaptionWithOccurrence(refLabel, occurrenceMap);

  // True questions - for each overlapping label
  for (const answerLabel of overlapping) {
    const otherSubject = getOtherSubject(answerLabel);
    const questionText = template.template
      .replace('{refCaption}', refCaptionWithOccurrence)
      .replace('{caption}', formatStateCaption(answerLabel))
      .replace('{other}', otherSubject);

    const trueCode = `${baseCode}-True` as Level2Code;
    const allDistractors = [{ type: 'binary' as const, option: 'False' }];

    questions.push({
      id: generateId(),
      level: 2,
      code: trueCode,
      question: questionText,
      answer: { option: 'True', start: answerLabel.startTime, end: answerLabel.endTime },
      distractors: allDistractors,
      allDistractors: allDistractors,
      videoIndex: refLabel.videoIndex,
      videoContext,
      referenceLabel: createLabelReference(refLabel),
      targetLabel: createLabelReference(answerLabel),
    });

    // Lexical distractor questions (from the answer label's lexical distractors)
    if (answerLabel.lexicalDistractors) {
      const lexicalCode = `${baseCode}-Lexical` as Level2Code;
      for (const lexical of answerLabel.lexicalDistractors) {
        const lexQuestionText = template.template
          .replace('{refCaption}', refCaptionWithOccurrence)
          .replace('{caption}', lexical)
          .replace('{other}', otherSubject);

        const lexDistractors = [{ type: 'binary' as const, option: 'True' }];

        questions.push({
          id: generateId(),
          level: 2,
          code: lexicalCode,
          question: lexQuestionText,
          answer: { option: 'False' },
          distractors: lexDistractors,
          allDistractors: lexDistractors,
          videoIndex: refLabel.videoIndex,
          videoContext,
          referenceLabel: createLabelReference(refLabel),
        });
      }
    }
  }

  // Scene distractor questions (things that never exist in the video)
  const typeSceneDistractors = getSceneDistractorsByType(sceneDistractors, ansType);
  const sceneCode = `${baseCode}-Scene` as Level2Code;
  for (const sd of typeSceneDistractors) {
    const otherSubject = getOtherSubject();
    const questionText = template.template
      .replace('{refCaption}', refCaptionWithOccurrence)
      .replace('{caption}', sd.caption)
      .replace('{other}', otherSubject);

    const sceneDistractorsList = [{ type: 'binary' as const, option: 'True' }];

    questions.push({
      id: generateId(),
      level: 2,
      code: sceneCode,
      question: questionText,
      answer: { option: 'False' },
      distractors: sceneDistractorsList,
      allDistractors: sceneDistractorsList,
      videoIndex: refLabel.videoIndex,
      videoContext,
      referenceLabel: createLabelReference(refLabel),
    });
  }

  // Temporal distractor questions (things that happened but not during the reference time)
  const temporalDistractors = getNonOverlappingLabels(
    allLabels,
    videoContext.start,
    videoContext.end,
    ansType
  );
  const temporalCode = `${baseCode}-Temporal` as Level2Code;
  for (const td of temporalDistractors) {
    const otherSubject = getOtherSubject(td);
    const questionText = template.template
      .replace('{refCaption}', refCaptionWithOccurrence)
      .replace('{caption}', formatStateCaption(td))
      .replace('{other}', otherSubject);

    const tempDistractors = [{ type: 'binary' as const, option: 'True' }];

    questions.push({
      id: generateId(),
      level: 2,
      code: temporalCode,
      question: questionText,
      answer: { option: 'False' },
      distractors: tempDistractors,
      allDistractors: tempDistractors,
      videoIndex: refLabel.videoIndex,
      videoContext,
      referenceLabel: createLabelReference(refLabel),
    });
  }

  // Role distractor questions (e.g., asking about OA when showing SA)
  const roleType = ROLE_PAIRS[ansType];
  if (roleType) {
    const roleCode = `${baseCode}-Role` as Level2Code;
    const roleLabels = getNonOverlappingLabels(
      allLabels,
      videoContext.start,
      videoContext.end,
      roleType
    );
    for (const rd of roleLabels) {
      const otherSubject = getOtherSubject(rd);
      const questionText = template.template
        .replace('{refCaption}', refCaptionWithOccurrence)
        .replace('{caption}', formatStateCaption(rd))
        .replace('{other}', otherSubject);

      const roleDistractors = [{ type: 'binary' as const, option: 'True' }];

      questions.push({
        id: generateId(),
        level: 2,
        code: roleCode,
        question: questionText,
        answer: { option: 'False' },
        distractors: roleDistractors,
        allDistractors: roleDistractors,
        videoIndex: refLabel.videoIndex,
        videoContext,
        referenceLabel: createLabelReference(refLabel),
      });
    }
  }

  return questions;
}

/**
 * Gather distractors for a temporal relation question (IDENT type)
 * Uses video context range for temporal distractor sampling
 * Returns ALL available distractors (not limited)
 */
function gatherDistractors(
  answerLabel: LabelEntry,
  relevantLabels: LabelEntry[],
  relevantSceneDistractors: SceneDistractor[],
  videoContext: VideoContext,
  ansType: EventType
): Distractor[] {
  const distractors: Distractor[] = [];

  // Lexical distractors from answer label
  if (answerLabel.lexicalDistractors) {
    for (const lex of answerLabel.lexicalDistractors) {
      distractors.push({ type: 'lexical', option: lex });
    }
  }

  // Scene distractors of same type (ALL available)
  const sceneD = getSceneDistractorsByType(relevantSceneDistractors, ansType);
  for (const sd of sceneD) {
    distractors.push({ type: 'scene', option: sd.caption });
  }

  // Temporal distractors - same type but OUTSIDE video context (ALL available)
  const temporalD = getNonOverlappingLabels(
    relevantLabels,
    videoContext.start,
    videoContext.end,
    ansType
  );
  for (const td of temporalD) {
    distractors.push({
      type: 'temporal',
      option: formatStateCaption(td), // Use formatted caption for SS/OS
      start: td.startTime,
      end: td.endTime,
    });
  }

  // Role distractors - from within the video context (ALL available)
  const roleType = ROLE_PAIRS[ansType];
  if (roleType) {
    const roleD = getOverlappingLabels(
      relevantLabels,
      videoContext.start,
      videoContext.end,
      roleType
    );
    for (const rd of roleD) {
      distractors.push({
        type: 'role',
        option: formatStateCaption(rd), // Use formatted caption for SS/OS
        start: rd.startTime,
        end: rd.endTime,
      });
    }
  }

  return distractors;
}

/**
 * Generate Level 2 Timeline Reference questions (TR2Y)
 * Uses direct timestamp ranges instead of event references
 * Capped at MAX_TR_QUESTIONS (500) to avoid generating too many questions
 */
export function generateTimelineReferenceQuestions(
  labels: LabelEntry[],
  sceneDistractors: SceneDistractor[],
  videoDuration: number,
  videoIndex: number = -1
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const relevantLabels = videoIndex === -1 ? labels : getLabelsByVideo(labels, videoIndex);
  const relevantSceneDistractors =
    videoIndex === -1
      ? sceneDistractors
      : sceneDistractors.filter((d) => d.videoIndex === videoIndex);

  // Use each label as a source for the timestamp range
  for (const sourceLabel of relevantLabels) {
    if (questions.length >= MAX_TR_QUESTIONS) break;

    const videoContext: VideoContext = {
      start: sourceLabel.startTime,
      end: sourceLabel.endTime,
    };
    // Format timestamp relative to video context (which starts at 0 after trimming)
    const timestamp = formatRelativeTimestampRange(
      sourceLabel.startTime,
      sourceLabel.endTime,
      videoContext.start
    );

    for (const template of LEVEL2_TR_TEMPLATES) {
      if (questions.length >= MAX_TR_QUESTIONS) break;

      const ansType = template.answerType as EventType;
      const baseCode = template.code as string;

      // Find overlapping labels of target type
      const overlapping = getOverlappingLabels(
        relevantLabels,
        sourceLabel.startTime,
        sourceLabel.endTime,
        ansType
      );

      // Determine {other} subject for OA/OS types
      const getOtherSubject = (ansLabel?: LabelEntry) => {
        if ((ansType === 'OA' || ansType === 'OS') && ansLabel) {
          return formatOtherSubject(ansLabel);
        }
        return 'the other player';
      };

      if (baseCode.endsWith('-IDENT')) {
        // IDENT questions - need exactly one overlapping label to avoid ambiguous answers
        if (overlapping.length !== 1) continue;

        const answerLabel = overlapping[0];
        const otherSubject = getOtherSubject(answerLabel);

        const questionText = template.template
          .replace('{timestamp}', timestamp)
          .replace('{caption}', formatStateCaption(answerLabel))
          .replace('{other}', otherSubject);

        const distractors = gatherTRDistractors(
          answerLabel,
          relevantLabels,
          relevantSceneDistractors,
          videoContext,
          ansType
        );

        if (distractors.length >= 2) {
          const selectedDistractors = shuffleArray([...distractors]).slice(0, 3);
          questions.push({
            id: generateId(),
            level: 2,
            code: baseCode as Level2Code,
            question: questionText,
            answer: {
              option: formatStateCaption(answerLabel),
              start: answerLabel.startTime,
              end: answerLabel.endTime,
            },
            distractors: selectedDistractors,
            allDistractors: distractors,
            videoIndex: sourceLabel.videoIndex,
            videoContext,
            targetLabel: createLabelReference(answerLabel),
          });
        }
      } else if (baseCode.endsWith('-EXIST')) {
        // EXIST questions - generate True, Lexical, Scene, Temporal, and Role variants
        const existQuestions = generateTRExistQuestions(
          sourceLabel,
          overlapping,
          relevantLabels,
          relevantSceneDistractors,
          videoContext,
          videoDuration,
          template,
          ansType,
          timestamp,
          getOtherSubject
        );
        // Only add questions up to the limit
        const remainingSlots = MAX_TR_QUESTIONS - questions.length;
        questions.push(...existQuestions.slice(0, remainingSlots));
      } else if (baseCode.endsWith('-ABSENT')) {
        // ABSENT questions - need scene distractors and overlapping labels
        const typeSceneDistractors = getSceneDistractorsByType(relevantSceneDistractors, ansType);
        if (typeSceneDistractors.length === 0 || overlapping.length < 2) continue;

        const sceneDistractor = typeSceneDistractors[0];
        const otherSubject = getOtherSubject();

        const questionText = template.template
          .replace('{timestamp}', timestamp)
          .replace('{other}', otherSubject);

        const allDistractors: Distractor[] = overlapping.map((l) => ({
          type: 'temporal' as const,
          option: formatStateCaption(l),
          start: l.startTime,
          end: l.endTime,
        }));

        questions.push({
          id: generateId(),
          level: 2,
          code: baseCode as Level2Code,
          question: questionText,
          answer: { option: sceneDistractor.caption },
          distractors: allDistractors.slice(0, 3),
          allDistractors: allDistractors,
          videoIndex: sourceLabel.videoIndex,
          videoContext,
        });
      }
    }
  }

  return questions;
}

/**
 * Generate TR EXIST questions with distractor type marking
 */
function generateTRExistQuestions(
  sourceLabel: LabelEntry,
  overlapping: LabelEntry[],
  allLabels: LabelEntry[],
  sceneDistractors: SceneDistractor[],
  videoContext: VideoContext,
  videoDuration: number,
  template: (typeof LEVEL2_TR_TEMPLATES)[0],
  ansType: EventType,
  timestamp: string,
  getOtherSubject: (ansLabel?: LabelEntry) => string
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const baseCode = template.code as string;

  // True questions - for each overlapping label
  for (const answerLabel of overlapping) {
    const otherSubject = getOtherSubject(answerLabel);
    const questionText = template.template
      .replace('{timestamp}', timestamp)
      .replace('{caption}', formatStateCaption(answerLabel))
      .replace('{other}', otherSubject);

    const trueCode = `${baseCode}-True` as Level2Code;
    const allDistractors = [{ type: 'binary' as const, option: 'False' }];

    questions.push({
      id: generateId(),
      level: 2,
      code: trueCode,
      question: questionText,
      answer: { option: 'True', start: answerLabel.startTime, end: answerLabel.endTime },
      distractors: allDistractors,
      allDistractors: allDistractors,
      videoIndex: sourceLabel.videoIndex,
      videoContext,
      targetLabel: createLabelReference(answerLabel),
    });

    // Lexical distractor questions
    if (answerLabel.lexicalDistractors) {
      const lexicalCode = `${baseCode}-Lexical` as Level2Code;
      for (const lexical of answerLabel.lexicalDistractors) {
        const lexQuestionText = template.template
          .replace('{timestamp}', timestamp)
          .replace('{caption}', lexical)
          .replace('{other}', otherSubject);

        const lexDistractors = [{ type: 'binary' as const, option: 'True' }];

        questions.push({
          id: generateId(),
          level: 2,
          code: lexicalCode,
          question: lexQuestionText,
          answer: { option: 'False' },
          distractors: lexDistractors,
          allDistractors: lexDistractors,
          videoIndex: sourceLabel.videoIndex,
          videoContext,
        });
      }
    }
  }

  // Scene distractor questions
  const typeSceneDistractors = getSceneDistractorsByType(sceneDistractors, ansType);
  const sceneCode = `${baseCode}-Scene` as Level2Code;
  for (const sd of typeSceneDistractors) {
    const otherSubject = getOtherSubject();
    const questionText = template.template
      .replace('{timestamp}', timestamp)
      .replace('{caption}', sd.caption)
      .replace('{other}', otherSubject);

    const sceneDistractorsList = [{ type: 'binary' as const, option: 'True' }];

    questions.push({
      id: generateId(),
      level: 2,
      code: sceneCode,
      question: questionText,
      answer: { option: 'False' },
      distractors: sceneDistractorsList,
      allDistractors: sceneDistractorsList,
      videoIndex: sourceLabel.videoIndex,
      videoContext,
    });
  }

  // Temporal distractor questions
  const temporalDistractors = getNonOverlappingLabels(
    allLabels,
    videoContext.start,
    videoContext.end,
    ansType
  );
  const temporalCode = `${baseCode}-Temporal` as Level2Code;
  for (const td of temporalDistractors) {
    const otherSubject = getOtherSubject(td);
    const questionText = template.template
      .replace('{timestamp}', timestamp)
      .replace('{caption}', formatStateCaption(td))
      .replace('{other}', otherSubject);

    const tempDistractors = [{ type: 'binary' as const, option: 'True' }];

    questions.push({
      id: generateId(),
      level: 2,
      code: temporalCode,
      question: questionText,
      answer: { option: 'False' },
      distractors: tempDistractors,
      allDistractors: tempDistractors,
      videoIndex: sourceLabel.videoIndex,
      videoContext,
    });
  }

  // Role distractor questions
  const roleType = ROLE_PAIRS[ansType];
  if (roleType) {
    const roleCode = `${baseCode}-Role` as Level2Code;
    const roleLabels = getNonOverlappingLabels(
      allLabels,
      videoContext.start,
      videoContext.end,
      roleType
    );
    for (const rd of roleLabels) {
      const otherSubject = getOtherSubject(rd);
      const questionText = template.template
        .replace('{timestamp}', timestamp)
        .replace('{caption}', formatStateCaption(rd))
        .replace('{other}', otherSubject);

      const roleDistractors = [{ type: 'binary' as const, option: 'True' }];

      questions.push({
        id: generateId(),
        level: 2,
        code: roleCode,
        question: questionText,
        answer: { option: 'False' },
        distractors: roleDistractors,
        allDistractors: roleDistractors,
        videoIndex: sourceLabel.videoIndex,
        videoContext,
      });
    }
  }

  return questions;
}

/**
 * Gather distractors for a timeline reference IDENT question
 */
function gatherTRDistractors(
  answerLabel: LabelEntry,
  relevantLabels: LabelEntry[],
  relevantSceneDistractors: SceneDistractor[],
  videoContext: VideoContext,
  ansType: EventType
): Distractor[] {
  const distractors: Distractor[] = [];

  // Lexical distractors from answer label
  if (answerLabel.lexicalDistractors) {
    for (const lex of answerLabel.lexicalDistractors) {
      distractors.push({ type: 'lexical', option: lex });
    }
  }

  // Scene distractors of same type
  const sceneD = getSceneDistractorsByType(relevantSceneDistractors, ansType);
  for (const sd of sceneD) {
    distractors.push({ type: 'scene', option: sd.caption });
  }

  // Temporal distractors - same type but OUTSIDE video context
  const temporalD = getNonOverlappingLabels(
    relevantLabels,
    videoContext.start,
    videoContext.end,
    ansType
  );
  for (const td of temporalD) {
    distractors.push({
      type: 'temporal',
      option: formatStateCaption(td),
      start: td.startTime,
      end: td.endTime,
    });
  }

  // Role distractors - from within the video context
  const roleType = ROLE_PAIRS[ansType];
  if (roleType) {
    const roleD = getOverlappingLabels(
      relevantLabels,
      videoContext.start,
      videoContext.end,
      roleType
    );
    for (const rd of roleD) {
      distractors.push({
        type: 'role',
        option: formatStateCaption(rd),
        start: rd.startTime,
        end: rd.endTime,
      });
    }
  }

  return distractors;
}

// ============================================
// ORDER Questions - Temporal Ordering
// ============================================

// Minimum gap between events for ORDER questions (in seconds)
const ORDER_EVENT_GAP = 1;
// Maximum number of ORDER questions to generate
const MAX_ORDER_QUESTIONS = 200;

type OrderEventType = 'SA' | 'OA' | 'WE';

/**
 * Filter out labels that have duplicate captions (events that happen multiple times)
 * For ORDER questions, we only want unique events to avoid ambiguity
 */
function filterUniqueCaption(labels: LabelEntry[]): LabelEntry[] {
  // Count occurrences of each caption
  const captionCounts = new Map<string, number>();
  for (const label of labels) {
    const caption = label.caption.trim().toLowerCase();
    captionCounts.set(caption, (captionCounts.get(caption) || 0) + 1);
  }

  // Only keep labels with unique captions
  return labels.filter((label) => {
    const caption = label.caption.trim().toLowerCase();
    return captionCounts.get(caption) === 1;
  });
}

/**
 * Check if two time ranges have at least the required gap between them
 */
function hasMinimumGap(
  start1: number,
  end1: number,
  start2: number,
  end2: number,
  minGap: number
): boolean {
  // No overlap and at least minGap between them
  return end1 + minGap <= start2 || end2 + minGap <= start1;
}

/**
 * Find a set of non-overlapping labels with minimum gap
 * Returns labels sorted by start time
 */
function findNonOverlappingWithGap(
  labels: LabelEntry[],
  minGap: number,
  count: number
): LabelEntry[] {
  if (labels.length < count) return [];

  // Sort by start time
  const sorted = [...labels].sort((a, b) => a.startTime - b.startTime);

  // Greedy selection: pick labels that don't overlap with already selected ones
  const selected: LabelEntry[] = [];

  for (const label of sorted) {
    // Check if this label has minimum gap with all selected labels
    let canSelect = true;
    for (const sel of selected) {
      if (!hasMinimumGap(sel.startTime, sel.endTime, label.startTime, label.endTime, minGap)) {
        canSelect = false;
        break;
      }
    }

    if (canSelect) {
      selected.push(label);
      if (selected.length >= count) break;
    }
  }

  return selected;
}

/**
 * Generate all permutations of an array
 */
function getPermutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];

  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const restPerms = getPermutations(rest);
    for (const perm of restPerms) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

/**
 * Format an event for ORDER question option
 */
function formatOrderEvent(label: LabelEntry): string {
  if (label.type === 'SA') {
    return `The POV player ${label.caption}`;
  } else if (label.type === 'OA') {
    const other = label.other || 'the other player';
    return `The ${other} ${label.caption}`;
  } else if (label.type === 'WE') {
    return `The event "${label.caption}" occurred`;
  }
  return label.caption;
}

/**
 * Format a sequence of events as an option string
 */
function formatSequence(labels: LabelEntry[]): string {
  return labels.map((l, i) => `${i + 1}. ${formatOrderEvent(l)}`).join(', ');
}

/**
 * Generate Level 2 ORDER questions
 * Questions about temporal ordering of 3-4 events within a single video
 * Types: SA-ORDER, OA-ORDER, WE-ORDER, MIX-ORDER
 */
export function generateOrderQuestions(
  labels: LabelEntry[],
  videoDuration: number,
  videoIndex: number = -1
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const relevantLabels = videoIndex === -1 ? labels : getLabelsByVideo(labels, videoIndex);

  // Get unique video indices
  const videoIndices = new Set(relevantLabels.map((l) => l.videoIndex));

  for (const vidIdx of videoIndices) {
    if (questions.length >= MAX_ORDER_QUESTIONS) break;

    const videoLabels = relevantLabels.filter((l) => l.videoIndex === vidIdx);

    // Generate single-type ORDER questions (SA, OA, WE)
    const orderTypes: OrderEventType[] = ['SA', 'OA', 'WE'];
    for (const eventType of orderTypes) {
      if (questions.length >= MAX_ORDER_QUESTIONS) break;

      // Filter labels: must have caption, and caption must be unique (no duplicates)
      const typeLabels = filterUniqueCaption(
        videoLabels.filter((l) => l.type === eventType && l.caption && l.caption.trim())
      );

      // Track generated sequences to avoid duplicates
      const generatedSequences = new Set<string>();

      // Try to find 3 or 4 non-overlapping events, generate multiple questions
      for (const eventCount of [4, 3]) {
        if (questions.length >= MAX_ORDER_QUESTIONS) break;

        // Generate multiple questions by trying different combinations
        const maxAttemptsPerCount = 10;
        for (let attempt = 0; attempt < maxAttemptsPerCount; attempt++) {
          if (questions.length >= MAX_ORDER_QUESTIONS) break;

          // Shuffle labels for variety in selection
          const shuffledLabels = attempt === 0 ? typeLabels : shuffleArray([...typeLabels]);
          const selectedLabels = findNonOverlappingWithGap(
            shuffledLabels,
            ORDER_EVENT_GAP,
            eventCount
          );
          if (selectedLabels.length < eventCount) continue;

          // Sort by start time (correct order)
          const correctOrder = [...selectedLabels].sort((a, b) => a.startTime - b.startTime);
          const correctSequence = formatSequence(correctOrder);

          // Skip if we've already generated this sequence
          if (generatedSequences.has(correctSequence)) continue;
          generatedSequences.add(correctSequence);

          // Generate all permutations for distractors
          const allPermutations = getPermutations(correctOrder);

          // Filter out the correct permutation
          const wrongPermutations = allPermutations.filter(
            (perm) => formatSequence(perm) !== correctSequence
          );

          if (wrongPermutations.length < 2) continue;

          // Select 3 random wrong permutations as distractors
          const selectedDistractors = shuffleArray(wrongPermutations).slice(0, 3);
          const distractors: Distractor[] = selectedDistractors.map((perm) => ({
            type: 'order' as const,
            option: formatSequence(perm),
          }));

          // All wrong permutations as allDistractors
          const allDistractors: Distractor[] = wrongPermutations.map((perm) => ({
            type: 'order' as const,
            option: formatSequence(perm),
          }));

          // Video context spans all events
          const contextStart = Math.min(...correctOrder.map((l) => l.startTime));
          const contextEnd = Math.max(...correctOrder.map((l) => l.endTime));
          const videoContext = generateVideoContext(contextStart, contextEnd, videoDuration);

          const code = `${eventType}-ORDER` as Level2Code;

          questions.push({
            id: generateId(),
            level: 2,
            code,
            question: 'Which of the following order sequence is correct?',
            answer: { option: correctSequence },
            distractors,
            allDistractors,
            videoIndex: vidIdx,
            videoContext,
          });
        }
      }
    }

    // Generate MIX-ORDER questions (mixing SA, OA, WE)
    if (questions.length < MAX_ORDER_QUESTIONS) {
      // Filter labels: must have caption, and caption must be unique (no duplicates)
      const mixLabels = filterUniqueCaption(
        videoLabels.filter(
          (l) =>
            (l.type === 'SA' || l.type === 'OA' || l.type === 'WE') && l.caption && l.caption.trim()
        )
      );

      // Track generated sequences to avoid duplicates
      const generatedMixSequences = new Set<string>();

      for (const eventCount of [4, 3]) {
        if (questions.length >= MAX_ORDER_QUESTIONS) break;

        // Generate multiple questions by trying different combinations
        const maxAttemptsPerCount = 10;
        for (let attempt = 0; attempt < maxAttemptsPerCount; attempt++) {
          if (questions.length >= MAX_ORDER_QUESTIONS) break;

          // Shuffle labels for variety in selection
          const shuffledLabels = attempt === 0 ? mixLabels : shuffleArray([...mixLabels]);
          const selectedLabels = findNonOverlappingWithGap(
            shuffledLabels,
            ORDER_EVENT_GAP,
            eventCount
          );
          if (selectedLabels.length < eventCount) continue;

          // Check that we have at least 2 different types for MIX
          const typesInSelection = new Set(selectedLabels.map((l) => l.type));
          if (typesInSelection.size < 2) continue;

          // Sort by start time (correct order)
          const correctOrder = [...selectedLabels].sort((a, b) => a.startTime - b.startTime);
          const correctSequence = formatSequence(correctOrder);

          // Skip if we've already generated this sequence
          if (generatedMixSequences.has(correctSequence)) continue;
          generatedMixSequences.add(correctSequence);

          // Generate all permutations for distractors
          const allPermutations = getPermutations(correctOrder);

          // Filter out the correct permutation
          const wrongPermutations = allPermutations.filter(
            (perm) => formatSequence(perm) !== correctSequence
          );

          if (wrongPermutations.length < 2) continue;

          // Select 3 random wrong permutations as distractors
          const selectedDistractors = shuffleArray(wrongPermutations).slice(0, 3);
          const distractors: Distractor[] = selectedDistractors.map((perm) => ({
            type: 'order' as const,
            option: formatSequence(perm),
          }));

          // All wrong permutations as allDistractors
          const allDistractors: Distractor[] = wrongPermutations.map((perm) => ({
            type: 'order' as const,
            option: formatSequence(perm),
          }));

          // Video context spans all events
          const contextStart = Math.min(...correctOrder.map((l) => l.startTime));
          const contextEnd = Math.max(...correctOrder.map((l) => l.endTime));
          const videoContext = generateVideoContext(contextStart, contextEnd, videoDuration);

          const code: Level2Code = 'MIX-ORDER';

          questions.push({
            id: generateId(),
            level: 2,
            code,
            question: 'Which of the following order sequence is correct?',
            answer: { option: correctSequence },
            distractors,
            allDistractors,
            videoIndex: vidIdx,
            videoContext,
          });
        }
      }
    }
  }

  return questions;
}
