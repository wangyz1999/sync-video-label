import { LabelEntry, SceneDistractor, EventType, CausalRelation } from '../../types';
import { GeneratedQuestion, Distractor, Level1Code } from './types';
import { LEVEL1_TEMPLATES } from './templates';
import {
  getLabelsByVideo,
  getSceneDistractorsByType,
  groupLabelsByType,
  generateId,
  shuffleArray,
  generateCountDistractors,
  createLabelReference,
  generateLevel1VideoContext,
  generateVideoContext,
  getNonOverlappingLabels,
  formatStateCaption,
  formatOtherSubject,
  formatRelativeTimestampRange,
  ROLE_PAIRS,
} from './helpers';

/**
 * Generate Level 1 questions (Perception)
 * Focus: Direct observation and retrieval of information from the video stream.
 */
export function generateLevel1Questions(
  labels: LabelEntry[],
  sceneDistractors: SceneDistractor[],
  videoDuration: number,
  videoIndex: number = -1, // -1 for all videos
  causalRelations: CausalRelation[] = []
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const relevantLabels = videoIndex === -1 ? labels : getLabelsByVideo(labels, videoIndex);
  const relevantSceneDistractors =
    videoIndex === -1
      ? sceneDistractors
      : sceneDistractors.filter((d) => d.videoIndex === videoIndex);
  const relevantCausalRelations =
    videoIndex === -1
      ? causalRelations
      : causalRelations.filter((c) => c.videoIndex === videoIndex);

  // Group labels by type
  const labelsByType = groupLabelsByType(relevantLabels);

  // Generate IDENT questions
  questions.push(
    ...generateIdentQuestions(labelsByType, relevantLabels, relevantSceneDistractors, videoDuration)
  );

  // Generate EXIST questions
  questions.push(
    ...generateExistQuestions(labelsByType, relevantLabels, relevantSceneDistractors, videoDuration)
  );

  // Generate ABSENT questions
  questions.push(...generateAbsentQuestions(labelsByType, relevantSceneDistractors, videoDuration));

  // Generate COUNT questions
  questions.push(...generateCountQuestions(labelsByType, videoDuration));

  // Generate INTENT questions (Why did the player do X?)
  questions.push(...generateIntentQuestions(labelsByType, videoDuration));

  // Generate CAUSAL questions (Why did Y happen?)
  questions.push(
    ...generateCausalQuestions(relevantCausalRelations, relevantLabels, videoDuration)
  );

  // Generate TIME questions (When did X happen?)
  questions.push(...generateTimeQuestions(labelsByType, relevantLabels, videoDuration));

  return questions;
}

/**
 * IDENT questions - choose 1 true label from distractors
 */
function generateIdentQuestions(
  labelsByType: Record<EventType, LabelEntry[]>,
  allLabels: LabelEntry[],
  sceneDistractors: SceneDistractor[],
  videoDuration: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const identTypes: EventType[] = ['SA', 'SS', 'OA', 'OS', 'WO', 'WE'];

  for (const type of identTypes) {
    const typeLabels = labelsByType[type];
    if (typeLabels.length === 0) continue;

    for (const label of typeLabels) {
      // Generate video context for this question
      // Use exact event duration, with minimum 5 seconds (pad ±2s if needed)
      const videoContext = generateLevel1VideoContext(
        label.startTime,
        label.endTime,
        videoDuration
      );

      const allDistractors: Distractor[] = [];

      // Add lexical distractors
      if (label.lexicalDistractors) {
        for (const lex of label.lexicalDistractors) {
          allDistractors.push({ type: 'lexical', option: lex });
        }
      }

      // Add scene distractors (ALL available, not just first 2)
      const sceneD = getSceneDistractorsByType(sceneDistractors, type);
      for (const sd of sceneD) {
        allDistractors.push({ type: 'scene', option: sd.caption });
      }

      // Add temporal distractors (ALL available, not just first 2)
      const temporalD = getNonOverlappingLabels(
        allLabels,
        videoContext.start,
        videoContext.end,
        type
      );
      for (const td of temporalD) {
        allDistractors.push({
          type: 'temporal',
          option: formatStateCaption(td), // Use formatted caption for SS/OS
          start: td.startTime,
          end: td.endTime,
        });
      }

      // Add role distractors (ALL available)
      const roleType = ROLE_PAIRS[type];
      if (roleType) {
        const roleD = labelsByType[roleType];
        for (const rd of roleD) {
          allDistractors.push({
            type: 'role',
            option: formatStateCaption(rd), // Use formatted caption for SS/OS
            start: rd.startTime,
            end: rd.endTime,
          });
        }
      }

      if (allDistractors.length >= 2) {
        const code = `${type}-IDENT` as Level1Code;
        const template = LEVEL1_TEMPLATES.find((t) => t.code === code);

        // Select 3 random distractors for initial display
        const selectedDistractors = shuffleArray([...allDistractors]).slice(0, 3);

        // Use formatted caption for SS/OS (includes value)
        const answerCaption = formatStateCaption(label);

        // Build question text, replacing {other} with actual subject for OA/OS
        const questionText = (template?.template || `Which ${type} occurred in the video?`).replace(
          '{other}',
          formatOtherSubject(label)
        );

        questions.push({
          id: generateId(),
          level: 1,
          code,
          question: questionText,
          answer: { option: answerCaption, start: label.startTime, end: label.endTime },
          distractors: selectedDistractors,
          allDistractors: allDistractors, // Save all available distractors
          videoIndex: label.videoIndex,
          videoContext,
          referenceLabel: createLabelReference(label),
        });
      }
    }
  }

  return questions;
}

/**
 * EXIST questions - True/False binary questions
 * True questions: Ask about labels that exist in the video
 * False questions: Ask about things that don't exist (scene distractors, lexical distractors, temporal distractors, role distractors)
 */
function generateExistQuestions(
  labelsByType: Record<EventType, LabelEntry[]>,
  allLabels: LabelEntry[],
  sceneDistractors: SceneDistractor[],
  videoDuration: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const existTypes: EventType[] = ['SA', 'SS', 'OA', 'OS', 'WO', 'WE'];

  for (const type of existTypes) {
    const typeLabels = labelsByType[type];
    const typeSceneDistractors = getSceneDistractorsByType(sceneDistractors, type);

    // True questions (label exists)
    for (const label of typeLabels) {
      // Use exact event duration, with minimum 5 seconds (pad ±2s if needed)
      const videoContext = generateLevel1VideoContext(
        label.startTime,
        label.endTime,
        videoDuration
      );
      const baseCode = `${type}-EXIST`;
      const trueCode = `${baseCode}-True` as Level1Code;
      const template = LEVEL1_TEMPLATES.find((t) => t.code === `${type}-EXIST`);
      // Use formatted caption for SS/OS (includes value)
      const labelCaption = formatStateCaption(label);
      const questionText = (
        template?.template.replace('{caption}', labelCaption) || `Did ${labelCaption} occur?`
      ).replace('{other}', formatOtherSubject(label));

      const allDistractors = [{ type: 'binary' as const, option: 'False' }];

      questions.push({
        id: generateId(),
        level: 1,
        code: trueCode,
        question: questionText,
        answer: { option: 'True', start: label.startTime, end: label.endTime },
        distractors: allDistractors,
        allDistractors: allDistractors, // For binary questions, all and selected are the same
        videoIndex: label.videoIndex,
        videoContext,
        referenceLabel: createLabelReference(label),
      });

      // False questions from lexical distractors (things that sound similar but didn't happen)
      if (label.lexicalDistractors) {
        const lexicalCode = `${baseCode}-Lexical` as Level1Code;
        for (const lexical of label.lexicalDistractors) {
          const lexQuestionText = (
            template?.template.replace('{caption}', lexical) || `Did ${lexical} occur?`
          ).replace('{other}', formatOtherSubject(label));

          const lexDistractors = [{ type: 'binary' as const, option: 'True' }];

          questions.push({
            id: generateId(),
            level: 1,
            code: lexicalCode,
            question: lexQuestionText,
            answer: { option: 'False' },
            distractors: lexDistractors,
            allDistractors: lexDistractors,
            videoIndex: label.videoIndex,
            videoContext, // Use same context as the label it's derived from
          });
        }
      }

      // False questions from temporal distractors (things that happened but not in this context)
      const temporalCode = `${baseCode}-Temporal` as Level1Code;
      const temporalDistractors = getNonOverlappingLabels(
        allLabels,
        videoContext.start,
        videoContext.end,
        type
      );
      for (const td of temporalDistractors) {
        // Use formatted caption for SS/OS (includes value)
        const tdCaption = formatStateCaption(td);
        const tempQuestionText = (
          template?.template.replace('{caption}', tdCaption) || `Did ${tdCaption} occur?`
        ).replace('{other}', formatOtherSubject(td));

        const tempDistractors = [{ type: 'binary' as const, option: 'True' }];

        questions.push({
          id: generateId(),
          level: 1,
          code: temporalCode,
          question: tempQuestionText,
          answer: { option: 'False' },
          distractors: tempDistractors,
          allDistractors: tempDistractors,
          videoIndex: label.videoIndex,
          videoContext, // The temporal distractor is outside this context
        });
      }

      // False questions from role distractors (e.g., asking if POV player did an OA action)
      // SA-EXIST-Role: Pick an OA caption, ask if POV player did it (answer: False)
      // OA-EXIST-Role: Pick an SA caption, ask if other player did it (answer: False)
      const roleType = ROLE_PAIRS[type];
      if (roleType) {
        const roleCode = `${type}-EXIST-Role` as Level1Code;
        const roleLabels = labelsByType[roleType];
        for (const rd of roleLabels) {
          // Only use role distractors that don't overlap with the current context
          if (rd.startTime >= videoContext.end || rd.endTime <= videoContext.start) {
            // Use current type's template to ask the wrong subject about the action
            const roleTemplate = LEVEL1_TEMPLATES.find((t) => t.code === `${type}-EXIST`);
            // Use formatted caption for SS/OS (includes value)
            const rdCaption = formatStateCaption(rd);
            const roleQuestionText = (
              roleTemplate?.template.replace('{caption}', rdCaption) || `Did ${rdCaption} occur?`
            ).replace('{other}', formatOtherSubject(label));

            const roleDistractors = [{ type: 'binary' as const, option: 'True' }];

            questions.push({
              id: generateId(),
              level: 1,
              code: roleCode,
              question: roleQuestionText,
              answer: { option: 'False' },
              distractors: roleDistractors,
              allDistractors: roleDistractors,
              videoIndex: label.videoIndex,
              videoContext,
            });
          }
        }
      }
    }

    // False questions from scene distractors (things that never exist in the video)
    for (const sd of typeSceneDistractors) {
      const sceneCode = `${type}-EXIST-Scene` as Level1Code;
      const template = LEVEL1_TEMPLATES.find((t) => t.code === `${type}-EXIST`);
      // Scene distractors don't have 'other' field, use default "the other player"
      const questionText = (
        template?.template.replace('{caption}', sd.caption) || `Did ${sd.caption} occur?`
      ).replace('{other}', 'the other player');

      const allDistractors = [{ type: 'binary' as const, option: 'True' }];

      questions.push({
        id: generateId(),
        level: 1,
        code: sceneCode,
        question: questionText,
        answer: { option: 'False' },
        distractors: allDistractors,
        allDistractors: allDistractors, // For binary questions, all and selected are the same
        videoIndex: sd.videoIndex,
        videoContext: { start: 0, end: videoDuration },
      });
    }
  }

  return questions;
}

/**
 * ABSENT questions - choose distractor from true labels
 */
function generateAbsentQuestions(
  labelsByType: Record<EventType, LabelEntry[]>,
  sceneDistractors: SceneDistractor[],
  videoDuration: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const absentTypes: EventType[] = ['SA', 'SS', 'OA', 'OS', 'WO', 'WE'];

  for (const type of absentTypes) {
    const typeLabels = labelsByType[type];
    const typeSceneDistractors = getSceneDistractorsByType(sceneDistractors, type);

    if (typeSceneDistractors.length === 0 || typeLabels.length < 2) continue;

    for (const sd of typeSceneDistractors) {
      const code = `${type}-ABSENT` as Level1Code;
      const template = LEVEL1_TEMPLATES.find((t) => t.code === code);

      // Collect ALL labels as distractors (things that DID occur)
      // Use formatted caption for SS/OS (includes value)
      const allDistractors: Distractor[] = typeLabels.map((l) => ({
        type: 'temporal',
        option: formatStateCaption(l),
        start: l.startTime,
        end: l.endTime,
      }));

      // Select first 3 for initial display
      const selectedDistractors = allDistractors.slice(0, 3);

      // Build question text, replacing {other} with default for scene distractors
      const questionText = (template?.template || `Which ${type} did NOT occur?`).replace(
        '{other}',
        'the other player'
      );

      // For ABSENT questions, use full video context since we're checking what's NOT there
      questions.push({
        id: generateId(),
        level: 1,
        code,
        question: questionText,
        answer: { option: sd.caption },
        distractors: selectedDistractors,
        allDistractors: allDistractors,
        videoIndex: sd.videoIndex,
        videoContext: { start: 0, end: videoDuration },
      });
    }
  }

  return questions;
}

/**
 * COUNT questions - quantity-based questions
 */
function generateCountQuestions(
  labelsByType: Record<EventType, LabelEntry[]>,
  videoDuration: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];

  // For WO - use quantity field, only for countable objects with quantity > 1
  for (const label of labelsByType['WO']) {
    // Only generate COUNT questions for countable WO labels
    if (label.isCountable === false) continue;
    const quantity = label.quantity ?? 1;
    // Only ask count questions when answer is more than 1
    if (quantity > 1) {
      const videoContext = generateVideoContext(label.startTime, label.endTime, videoDuration);
      const code: Level1Code = 'WO-COUNT';
      const template = LEVEL1_TEMPLATES.find((t) => t.code === code);
      const questionText =
        template?.template.replace('{caption}', label.caption) ||
        `How many ${label.caption} are there?`;

      // Generate all possible count distractors (1-10 excluding correct answer)
      const allDistractors: Distractor[] = [];
      for (let i = 1; i <= 6; i++) {
        if (i !== quantity) {
          allDistractors.push({ type: 'count', option: String(i) });
        }
      }

      // Select 3 random for initial display
      const selectedDistractors = generateCountDistractors(quantity, 3).map((n) => ({
        type: 'count' as const,
        option: String(n),
      }));

      questions.push({
        id: generateId(),
        level: 1,
        code,
        question: questionText,
        answer: { option: String(quantity), start: label.startTime, end: label.endTime },
        distractors: selectedDistractors,
        allDistractors: allDistractors,
        videoIndex: label.videoIndex,
        videoContext,
        referenceLabel: createLabelReference(label),
      });
    }
  }

  // For SA - count duplicate captions
  const saCaptions = new Map<string, LabelEntry[]>();
  for (const label of labelsByType['SA']) {
    const existing = saCaptions.get(label.caption) || [];
    existing.push(label);
    saCaptions.set(label.caption, existing);
  }

  for (const [caption, labelsWithCaption] of saCaptions) {
    if (labelsWithCaption.length > 1) {
      // Use a context that spans all occurrences
      const minStart = Math.min(...labelsWithCaption.map((l) => l.startTime));
      const maxEnd = Math.max(...labelsWithCaption.map((l) => l.endTime));
      const videoContext = generateVideoContext(minStart, maxEnd, videoDuration);

      const code: Level1Code = 'SA-COUNT';
      const template = LEVEL1_TEMPLATES.find((t) => t.code === code);
      const questionText =
        template?.template.replace('{caption}', caption) ||
        `How many times did the POV player ${caption}?`;

      // Generate all possible count distractors (1-10 excluding correct answer)
      const allDistractors: Distractor[] = [];
      for (let i = 1; i <= 10; i++) {
        if (i !== labelsWithCaption.length) {
          allDistractors.push({ type: 'count', option: String(i) });
        }
      }

      const selectedDistractors: Distractor[] = generateCountDistractors(
        labelsWithCaption.length,
        3
      ).map((n) => ({
        type: 'count',
        option: String(n),
      }));

      questions.push({
        id: generateId(),
        level: 1,
        code,
        question: questionText,
        answer: { option: String(labelsWithCaption.length) },
        distractors: selectedDistractors,
        allDistractors: allDistractors,
        videoIndex: labelsWithCaption[0].videoIndex,
        videoContext,
      });
    }
  }

  // For OA - count duplicate captions
  const oaCaptions = new Map<string, LabelEntry[]>();
  for (const label of labelsByType['OA']) {
    const existing = oaCaptions.get(label.caption) || [];
    existing.push(label);
    oaCaptions.set(label.caption, existing);
  }

  for (const [caption, labelsWithCaption] of oaCaptions) {
    if (labelsWithCaption.length > 1) {
      // Use a context that spans all occurrences
      const minStart = Math.min(...labelsWithCaption.map((l) => l.startTime));
      const maxEnd = Math.max(...labelsWithCaption.map((l) => l.endTime));
      const videoContext = generateVideoContext(minStart, maxEnd, videoDuration);

      const code: Level1Code = 'OA-COUNT';
      const template = LEVEL1_TEMPLATES.find((t) => t.code === code);
      // Use the first label's 'other' field for subject
      const otherSubject = formatOtherSubject(labelsWithCaption[0]);
      const questionText = (
        template?.template.replace('{caption}', caption) ||
        `How many times did the other player ${caption}?`
      ).replace('{other}', otherSubject);

      // Generate all possible count distractors (1-10 excluding correct answer)
      const allDistractors: Distractor[] = [];
      for (let i = 1; i <= 10; i++) {
        if (i !== labelsWithCaption.length) {
          allDistractors.push({ type: 'count', option: String(i) });
        }
      }

      const selectedDistractors: Distractor[] = generateCountDistractors(
        labelsWithCaption.length,
        3
      ).map((n) => ({
        type: 'count',
        option: String(n),
      }));

      questions.push({
        id: generateId(),
        level: 1,
        code,
        question: questionText,
        answer: { option: String(labelsWithCaption.length) },
        distractors: selectedDistractors,
        allDistractors: allDistractors,
        videoIndex: labelsWithCaption[0].videoIndex,
        videoContext,
      });
    }
  }

  // For WE - count duplicate captions
  const weCaptions = new Map<string, LabelEntry[]>();
  for (const label of labelsByType['WE']) {
    const existing = weCaptions.get(label.caption) || [];
    existing.push(label);
    weCaptions.set(label.caption, existing);
  }

  for (const [caption, labelsWithCaption] of weCaptions) {
    if (labelsWithCaption.length > 1) {
      // Use a context that spans all occurrences
      const minStart = Math.min(...labelsWithCaption.map((l) => l.startTime));
      const maxEnd = Math.max(...labelsWithCaption.map((l) => l.endTime));
      const videoContext = generateVideoContext(minStart, maxEnd, videoDuration);

      const code: Level1Code = 'WE-COUNT';
      const template = LEVEL1_TEMPLATES.find((t) => t.code === code);
      const questionText =
        template?.template.replace('{caption}', caption) ||
        `How many times did the event ${caption} occur?`;

      // Generate all possible count distractors (1-10 excluding correct answer)
      const allDistractors: Distractor[] = [];
      for (let i = 1; i <= 10; i++) {
        if (i !== labelsWithCaption.length) {
          allDistractors.push({ type: 'count', option: String(i) });
        }
      }

      const selectedDistractors: Distractor[] = generateCountDistractors(
        labelsWithCaption.length,
        3
      ).map((n) => ({
        type: 'count',
        option: String(n),
      }));

      questions.push({
        id: generateId(),
        level: 1,
        code,
        question: questionText,
        answer: { option: String(labelsWithCaption.length) },
        distractors: selectedDistractors,
        allDistractors: allDistractors,
        videoIndex: labelsWithCaption[0].videoIndex,
        videoContext,
      });
    }
  }

  return questions;
}

/**
 * INTENT questions - Why did the player perform this action?
 * Only for SA and OA labels that have intent and intentDistractors
 */
function generateIntentQuestions(
  labelsByType: Record<EventType, LabelEntry[]>,
  videoDuration: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const intentTypes: EventType[] = ['SA', 'OA'];

  for (const type of intentTypes) {
    const typeLabels = labelsByType[type];

    for (const label of typeLabels) {
      // Skip labels without intent or intentDistractors
      if (!label.intent || !label.intentDistractors || label.intentDistractors.length === 0) {
        continue;
      }

      const videoContext = generateVideoContext(label.startTime, label.endTime, videoDuration);
      const code = `${type}-INTENT` as Level1Code;
      const template = LEVEL1_TEMPLATES.find((t) => t.code === code);

      // Build question text, replacing {other} for OA labels
      const questionText = (
        template?.template.replace('{caption}', label.caption) ||
        `Why did the player ${label.caption}?`
      ).replace('{other}', formatOtherSubject(label));

      // All intent distractors
      const allDistractors: Distractor[] = label.intentDistractors.map((intent) => ({
        type: 'intent',
        option: intent,
      }));

      // Select up to 3 random distractors for initial display
      const selectedDistractors = shuffleArray([...allDistractors]).slice(0, 3);

      questions.push({
        id: generateId(),
        level: 1,
        code,
        question: questionText,
        answer: { option: label.intent, start: label.startTime, end: label.endTime },
        distractors: selectedDistractors,
        allDistractors: allDistractors,
        videoIndex: label.videoIndex,
        videoContext,
        referenceLabel: createLabelReference(label),
      });
    }
  }

  return questions;
}

/**
 * CAUSAL questions - Why did the effect happen?
 * Based on CausalRelation entries linking cause and effect labels
 */
function generateCausalQuestions(
  causalRelations: CausalRelation[],
  labels: LabelEntry[],
  videoDuration: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];

  // Create a map for quick label lookup
  const labelMap = new Map<string, LabelEntry>();
  for (const label of labels) {
    labelMap.set(label.id, label);
  }

  for (const relation of causalRelations) {
    const causeLabel = labelMap.get(relation.causeId);
    const effectLabel = labelMap.get(relation.effectId);

    // Skip incomplete relations
    if (!causeLabel || !effectLabel) {
      continue;
    }

    // Build the effect description for the question
    const effectDescription = formatLabelForQuestion(effectLabel);

    // Build the cause (answer) description
    const causeDescription = formatLabelForQuestion(causeLabel);

    // Use the effect's time range for video context
    const videoContext = generateVideoContext(
      effectLabel.startTime,
      effectLabel.endTime,
      videoDuration
    );

    // Build distractors from causalDistractors
    const allDistractors: Distractor[] = (relation.causalDistractors || []).map((d) => ({
      type: 'causal',
      option: d,
    }));

    // Select up to 3 random distractors for initial display (can be empty array)
    const selectedDistractors = shuffleArray([...allDistractors]).slice(0, 3);

    const code: Level1Code = 'CAUSAL';
    const template = LEVEL1_TEMPLATES.find((t) => t.code === code);
    const questionText =
      template?.template.replace('{effect}', effectDescription) || `Why did ${effectDescription}?`;

    questions.push({
      id: generateId(),
      level: 1,
      code,
      question: questionText,
      answer: {
        option: causeDescription,
        start: causeLabel.startTime,
        end: causeLabel.endTime,
      },
      distractors: selectedDistractors,
      allDistractors: allDistractors,
      videoIndex: relation.videoIndex,
      videoContext,
      referenceLabel: createLabelReference(effectLabel),
      targetLabel: createLabelReference(causeLabel),
    });
  }

  return questions;
}

/**
 * Format a label for use in a question (effect or cause description)
 */
function formatLabelForQuestion(label: LabelEntry): string {
  const isAction = label.type === 'SA' || label.type === 'OA';
  const isState = label.type === 'SS' || label.type === 'OS';
  const isSelf = label.type === 'SA' || label.type === 'SS';

  if (isAction) {
    const subject = isSelf ? 'the POV player' : `the ${label.other || 'other player'}`;
    return `${subject} ${label.caption}`;
  } else if (isState) {
    const subject = isSelf ? "the POV player's" : `the ${label.other || 'other player'}'s`;
    return `${subject} ${label.caption}${label.value ? ` become ${label.value}` : ''}`;
  } else if (label.type === 'WO') {
    return `${label.caption} appeared`;
  } else if (label.type === 'WE') {
    return label.caption;
  }

  return label.caption;
}

// Minimum gap between answer and distractors for TIME questions (in seconds)
const TIME_DISTRACTOR_GAP = 1;
// Minimum number of distractors required for TIME questions
const MIN_TIME_DISTRACTORS = 2;
// Number of distractors to select for display
const TIME_DISTRACTORS_COUNT = 3;

/**
 * Generate random time segment distractors for TIME questions
 * All distractors have the same duration as the answer and don't overlap with each other
 * or with the answer (with at least TIME_DISTRACTOR_GAP margin)
 *
 * @param answerStart - Answer start time relative to video context (0-based)
 * @param answerEnd - Answer end time relative to video context (0-based)
 * @param contextDuration - Total video context duration
 * @param count - Number of distractors to generate
 * @returns Array of distractor time ranges (relative to video context)
 */
function generateTimeDistractors(
  answerStart: number,
  answerEnd: number,
  contextDuration: number,
  count: number
): { start: number; end: number }[] {
  const duration = answerEnd - answerStart;
  const distractors: { start: number; end: number }[] = [];

  // Collect all "blocked" ranges (answer + already selected distractors)
  // Each blocked range includes the gap margin
  const blockedRanges: { start: number; end: number }[] = [
    { start: answerStart - TIME_DISTRACTOR_GAP, end: answerEnd + TIME_DISTRACTOR_GAP },
  ];

  // Try to generate the requested number of distractors
  // Use multiple attempts to find valid positions
  const maxAttempts = count * 50; // Allow many attempts to find valid positions
  let attempts = 0;

  while (distractors.length < count && attempts < maxAttempts) {
    attempts++;

    // Generate a random start position within valid range
    // The segment must fit within [0, contextDuration]
    const maxStart = contextDuration - duration;
    if (maxStart < 0) break; // Duration is longer than context, can't generate distractors

    const candidateStart = Math.random() * maxStart;
    const candidateEnd = candidateStart + duration;

    // Check if this candidate overlaps with any blocked range (including gap)
    const candidateBlockedStart = candidateStart - TIME_DISTRACTOR_GAP;
    const candidateBlockedEnd = candidateEnd + TIME_DISTRACTOR_GAP;

    let isValid = true;
    for (const blocked of blockedRanges) {
      // Check for overlap
      if (candidateBlockedStart < blocked.end && candidateBlockedEnd > blocked.start) {
        isValid = false;
        break;
      }
    }

    if (isValid) {
      // Round to 2 decimal places for cleaner timestamps
      const roundedStart = Math.round(candidateStart * 100) / 100;
      const roundedEnd = Math.round(candidateEnd * 100) / 100;

      distractors.push({ start: roundedStart, end: roundedEnd });

      // Add this distractor to blocked ranges
      blockedRanges.push({
        start: roundedStart - TIME_DISTRACTOR_GAP,
        end: roundedEnd + TIME_DISTRACTOR_GAP,
      });
    }
  }

  return distractors;
}

/**
 * TIME questions - When did X happen?
 * Answer is a timestamp range, distractors are randomly sampled time segments
 * with the same duration as the answer, non-overlapping with at least 1 sec gap
 */
function generateTimeQuestions(
  labelsByType: Record<EventType, LabelEntry[]>,
  allLabels: LabelEntry[],
  videoDuration: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const timeTypes: EventType[] = ['SA', 'SS', 'OA', 'OS', 'WO', 'WE'];

  for (const type of timeTypes) {
    const typeLabels = labelsByType[type];
    if (typeLabels.length === 0) continue;

    for (const label of typeLabels) {
      const code = `${type}-TIME` as Level1Code;
      const template = LEVEL1_TEMPLATES.find((t) => t.code === code);

      // Use formatted caption for SS/OS (includes value)
      const labelCaption = formatStateCaption(label);

      // Build question text
      const questionText = (
        template?.template.replace('{caption}', labelCaption) || `When did ${labelCaption} happen?`
      ).replace('{other}', formatOtherSubject(label));

      const videoContext = generateVideoContext(label.startTime, label.endTime, videoDuration);
      const contextDuration = videoContext.end - videoContext.start;

      // Calculate answer position relative to video context
      const relativeAnswerStart = label.startTime - videoContext.start;
      const relativeAnswerEnd = label.endTime - videoContext.start;
      const answerDuration = relativeAnswerEnd - relativeAnswerStart;

      // Check if we can fit enough distractors
      // Each distractor needs: duration + 2*gap (gap on each side)
      // Plus the answer needs: duration + 2*gap
      // Total segments needed: (MIN_TIME_DISTRACTORS + 1) * (duration + 2*gap)
      const segmentSpace = answerDuration + 2 * TIME_DISTRACTOR_GAP;
      const minSpaceNeeded = (MIN_TIME_DISTRACTORS + 1) * segmentSpace;

      if (contextDuration < minSpaceNeeded) {
        // Not enough space to fit answer + minimum distractors with gaps
        continue;
      }

      // Generate random time segment distractors
      const distractorSegments = generateTimeDistractors(
        relativeAnswerStart,
        relativeAnswerEnd,
        contextDuration,
        TIME_DISTRACTORS_COUNT
      );

      // Need at least MIN_TIME_DISTRACTORS to make a meaningful question
      if (distractorSegments.length < MIN_TIME_DISTRACTORS) continue;

      // Correct answer is the timestamp range relative to video context
      const answerTimestamp = formatRelativeTimestampRange(
        label.startTime,
        label.endTime,
        videoContext.start
      );

      // Build distractors with formatted timestamps
      const allDistractors: Distractor[] = distractorSegments.map((seg) => ({
        type: 'temporal',
        option: formatRelativeTimestampRange(
          seg.start + videoContext.start, // Convert back to absolute for formatting
          seg.end + videoContext.start,
          videoContext.start
        ),
        start: seg.start + videoContext.start, // Store absolute times
        end: seg.end + videoContext.start,
      }));

      questions.push({
        id: generateId(),
        level: 1,
        code,
        question: questionText,
        answer: {
          option: answerTimestamp,
          start: label.startTime,
          end: label.endTime,
        },
        distractors: allDistractors,
        allDistractors: allDistractors,
        videoIndex: label.videoIndex,
        videoContext,
        referenceLabel: createLabelReference(label),
      });
    }
  }

  return questions;
}
