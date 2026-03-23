import { LabelEntry, SceneDistractor, EventType } from '../../types';
import { GeneratedQuestion, Distractor, Level3Code, VideoContext } from './types';
import { LEVEL3_TEMPLATES, LEVEL3_POV_ID_TEMPLATES, LEVEL3_ORDER_TEMPLATES } from './templates';
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
} from './helpers';

// Maximum total Level 3 questions to generate
const MAX_LEVEL3_QUESTIONS = 1000;

// Maximum cross-video reference questions (to leave room for POV-ID and ORDER questions)
const MAX_CROSS_VIDEO_REF_QUESTIONS = 800;

/**
 * Generate a random subset of video indices that includes the required videos
 * @param requiredVideos - Video indices that must be included
 * @param totalVideos - Total number of videos available
 * @returns Array of video indices (sorted)
 */
function generateRandomVideoIndices(requiredVideos: number[], totalVideos: number): number[] {
  // Start with required videos
  const videoSet = new Set(requiredVideos);

  // Randomly decide how many additional videos to include (0 to remaining)
  const remainingVideos = [];
  for (let i = 0; i < totalVideos; i++) {
    if (!videoSet.has(i)) {
      remainingVideos.push(i);
    }
  }

  // Random number of additional videos (0 to all remaining)
  const additionalCount = Math.floor(Math.random() * (remainingVideos.length + 1));

  // Shuffle and pick additional videos
  const shuffledRemaining = shuffleArray([...remainingVideos]);
  for (let i = 0; i < additionalCount; i++) {
    videoSet.add(shuffledRemaining[i]);
  }

  // Return sorted array
  return Array.from(videoSet).sort((a, b) => a - b);
}

/**
 * Generate Level 3 questions (Cross-Video Relation)
 * Focus: Multi-video understanding. Reference can go across videos.
 * Capped at MAX_LEVEL3_QUESTIONS (1000) total.
 */
export function generateLevel3Questions(
  labels: LabelEntry[],
  sceneDistractors: SceneDistractor[],
  videoDuration: number,
  videoCount: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];

  // Level 3 requires at least 2 videos
  if (videoCount < 2) return questions;

  // Generate cross-video reference questions (V1-X2V2-Y)
  generateCrossVideoReferenceQuestions(
    questions,
    labels,
    sceneDistractors,
    videoDuration,
    videoCount
  );

  // Generate POV-ID questions (Which video corresponds to player who did X?)
  if (questions.length < MAX_LEVEL3_QUESTIONS) {
    generatePovIdQuestions(questions, labels, videoDuration, videoCount);
  }

  // Generate ORDER questions (Which happened first?)
  if (questions.length < MAX_LEVEL3_QUESTIONS) {
    generateOrderQuestions(questions, labels, videoDuration, videoCount);
  }

  return questions;
}

/**
 * Generate cross-video reference questions (V1-X2V2-Y format)
 */
function generateCrossVideoReferenceQuestions(
  questions: GeneratedQuestion[],
  labels: LabelEntry[],
  sceneDistractors: SceneDistractor[],
  videoDuration: number,
  videoCount: number
): void {
  // Track count of cross-video reference questions separately
  let crossVideoRefCount = 0;

  // Iterate through all templates and video pairs
  templateLoop: for (const template of LEVEL3_TEMPLATES) {
    if (!template.referenceType) continue;

    const refType = template.referenceType as EventType;
    const ansType = template.answerType as EventType;
    const templateCode = template.code as string;
    const isExist = templateCode.endsWith('EXIST');

    // For each pair of videos (all combinations, not just v1 < v2)
    for (let v1 = 0; v1 < videoCount; v1++) {
      for (let v2 = 0; v2 < videoCount; v2++) {
        if (v1 === v2) continue;

        // Check cap before processing each video pair (use cross-video specific cap)
        if (crossVideoRefCount >= MAX_CROSS_VIDEO_REF_QUESTIONS) break templateLoop;

        const v1Labels = getLabelsByVideo(labels, v1);
        const v2Labels = getLabelsByVideo(labels, v2);
        const v2SceneDistractors = sceneDistractors.filter((d) => d.videoIndex === v2);

        const refLabels = getLabelsByType(v1Labels, refType);

        // Process reference labels (limit per video pair to distribute questions)
        for (const refLabel of refLabels.slice(0, 2)) {
          if (crossVideoRefCount >= MAX_CROSS_VIDEO_REF_QUESTIONS) break templateLoop;

          if (isExist) {
            // Generate EXIST questions with distractor type suffixes
            const existQuestions = generateCrossVideoExistQuestions(
              template,
              refLabel,
              v2Labels,
              v2SceneDistractors,
              v1,
              v2,
              ansType,
              videoDuration,
              videoCount
            );
            // Add questions up to the cap
            for (const q of existQuestions) {
              if (crossVideoRefCount >= MAX_CROSS_VIDEO_REF_QUESTIONS) break templateLoop;
              questions.push(q);
              crossVideoRefCount++;
            }
          } else {
            // Generate IDENT question
            const question = generateCrossVideoIdentQuestion(
              template,
              refLabel,
              v2Labels,
              v2SceneDistractors,
              v1,
              v2,
              ansType,
              videoDuration,
              videoCount
            );

            if (question) {
              questions.push(question);
              crossVideoRefCount++;
            }
          }
        }
      }
    }
  }
}

/**
 * Generate a single cross-video IDENT question
 */
function generateCrossVideoIdentQuestion(
  template: (typeof LEVEL3_TEMPLATES)[0],
  refLabel: LabelEntry,
  v2Labels: LabelEntry[],
  v2SceneDistractors: SceneDistractor[],
  v1: number,
  v2: number,
  ansType: EventType,
  videoDuration: number,
  videoCount: number
): GeneratedQuestion | null {
  // Find overlapping labels in the other video
  // Need exactly one overlapping label to avoid ambiguous answers
  const overlapping = getOverlappingLabels(v2Labels, refLabel.startTime, refLabel.endTime, ansType);

  if (overlapping.length !== 1) return null;

  const answerLabel = overlapping[0];

  // Generate video context - for cross-video, we consider both the reference and answer time
  const contextStart = Math.min(refLabel.startTime, answerLabel.startTime);
  const contextEnd = Math.max(refLabel.endTime, answerLabel.endTime);
  const videoContext = generateVideoContext(contextStart, contextEnd, videoDuration);

  // Generate random video indices (includes required v1 and v2, plus random extras)
  const videoIndices = generateRandomVideoIndices([v1, v2], videoCount);

  // Build question text with video references - use formatted captions for SS/OS
  // Handle {refOther} for OA/OS reference types and {other} for OA/OS answer types
  const questionText = template.template
    .replace('POV1', `Video ${v1 + 1}`)
    .replace('POV2', `Video ${v2 + 1}`)
    .replace('{refOther}', formatOtherSubject(refLabel))
    .replace('{other}', formatOtherSubject(answerLabel))
    .replace('{refCaption}', formatStateCaption(refLabel))
    .replace('{caption}', formatStateCaption(answerLabel));

  // Gather distractors - now using video context range
  const distractors = gatherCrossVideoDistractors(
    answerLabel,
    v2Labels,
    v2SceneDistractors,
    videoContext,
    ansType
  );

  if (distractors.length < 2) return null;

  // Generate dynamic code with actual video indices
  const refType = template.referenceType as EventType;
  // Build code like "V3-SS2V1-SA-IDENT" for video 3 (0-indexed as 2) referring to video 1 (0-indexed as 0)
  const dynamicCode = `V${v1 + 1}-${refType}2V${v2 + 1}-${ansType}-IDENT` as Level3Code;

  // IDENT questions
  const selectedDistractors = shuffleArray([...distractors]).slice(0, 3);
  return {
    id: generateId(),
    level: 3,
    code: dynamicCode,
    question: questionText,
    answer: {
      option: formatStateCaption(answerLabel), // Use formatted caption for SS/OS
      start: answerLabel.startTime,
      end: answerLabel.endTime,
    },
    distractors: selectedDistractors,
    allDistractors: distractors,
    videoIndex: v2,
    videoIndices,
    videoContext,
    referenceLabel: createLabelReference(refLabel),
    targetLabel: createLabelReference(answerLabel),
  };
}

/**
 * Generate cross-video EXIST questions with distractor type suffixes
 * Similar to Level 1 and Level 2 EXIST question generation
 * Returns: True, Lexical, Scene, CrossVideo variants
 */
function generateCrossVideoExistQuestions(
  template: (typeof LEVEL3_TEMPLATES)[0],
  refLabel: LabelEntry,
  v2Labels: LabelEntry[],
  v2SceneDistractors: SceneDistractor[],
  v1: number,
  v2: number,
  ansType: EventType,
  videoDuration: number,
  videoCount: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const refType = template.referenceType as EventType;

  // Find overlapping labels in the other video
  const overlapping = getOverlappingLabels(v2Labels, refLabel.startTime, refLabel.endTime, ansType);

  // Generate video context - for cross-video, we consider the reference time
  const videoContext = generateVideoContext(refLabel.startTime, refLabel.endTime, videoDuration);

  // Generate random video indices (includes required v1 and v2, plus random extras)
  const videoIndices = generateRandomVideoIndices([v1, v2], videoCount);

  // Helper to build question text
  const buildQuestionText = (caption: string, otherSubject: string) => {
    return template.template
      .replace('POV1', `Video ${v1 + 1}`)
      .replace('POV2', `Video ${v2 + 1}`)
      .replace('{refOther}', formatOtherSubject(refLabel))
      .replace('{other}', otherSubject)
      .replace('{refCaption}', formatStateCaption(refLabel))
      .replace('{caption}', caption);
  };

  // Base code pattern: V{v1+1}-{refType}2V{v2+1}-{ansType}-EXIST
  const baseCodePrefix = `V${v1 + 1}-${refType}2V${v2 + 1}-${ansType}-EXIST`;

  // True questions - for each overlapping label (answer is True)
  for (const answerLabel of overlapping) {
    const otherSubject = formatOtherSubject(answerLabel);
    const questionText = buildQuestionText(formatStateCaption(answerLabel), otherSubject);

    const trueCode = `${baseCodePrefix}-True` as Level3Code;
    const allDistractors = [{ type: 'binary' as const, option: 'False' }];

    questions.push({
      id: generateId(),
      level: 3,
      code: trueCode,
      question: questionText,
      answer: { option: 'True', start: answerLabel.startTime, end: answerLabel.endTime },
      distractors: allDistractors,
      allDistractors: allDistractors,
      videoIndex: v2,
      videoIndices,
      videoContext,
      referenceLabel: createLabelReference(refLabel),
      targetLabel: createLabelReference(answerLabel),
    });

    // Lexical distractor questions (from the answer label's lexical distractors)
    if (answerLabel.lexicalDistractors) {
      const lexicalCode = `${baseCodePrefix}-Lexical` as Level3Code;
      for (const lexical of answerLabel.lexicalDistractors) {
        const lexQuestionText = buildQuestionText(lexical, otherSubject);
        const lexDistractors = [{ type: 'binary' as const, option: 'True' }];

        questions.push({
          id: generateId(),
          level: 3,
          code: lexicalCode,
          question: lexQuestionText,
          answer: { option: 'False' },
          distractors: lexDistractors,
          allDistractors: lexDistractors,
          videoIndex: v2,
          videoIndices,
          videoContext,
          referenceLabel: createLabelReference(refLabel),
        });
      }
    }
  }

  // Scene distractor questions (things that never exist in the video)
  const typeSceneDistractors = getSceneDistractorsByType(v2SceneDistractors, ansType);
  const sceneCode = `${baseCodePrefix}-Scene` as Level3Code;
  for (const sd of typeSceneDistractors) {
    const questionText = buildQuestionText(sd.caption, 'the other player');
    const sceneDistractorsList = [{ type: 'binary' as const, option: 'True' }];

    questions.push({
      id: generateId(),
      level: 3,
      code: sceneCode,
      question: questionText,
      answer: { option: 'False' },
      distractors: sceneDistractorsList,
      allDistractors: sceneDistractorsList,
      videoIndex: v2,
      videoIndices,
      videoContext,
      referenceLabel: createLabelReference(refLabel),
    });
  }

  // Cross-video distractor questions (things that happened in v2 but not during the reference time)
  const crossVideoDistractors = getNonOverlappingLabels(
    v2Labels,
    videoContext.start,
    videoContext.end,
    ansType
  );
  const crossVideoCode = `${baseCodePrefix}-CrossVideo` as Level3Code;
  for (const cvd of crossVideoDistractors) {
    const otherSubject = formatOtherSubject(cvd);
    const questionText = buildQuestionText(formatStateCaption(cvd), otherSubject);
    const cvDistractors = [{ type: 'binary' as const, option: 'True' }];

    questions.push({
      id: generateId(),
      level: 3,
      code: crossVideoCode,
      question: questionText,
      answer: { option: 'False' },
      distractors: cvDistractors,
      allDistractors: cvDistractors,
      videoIndex: v2,
      videoIndices,
      videoContext,
      referenceLabel: createLabelReference(refLabel),
    });
  }

  return questions;
}

/**
 * Gather distractors for cross-video questions
 * Uses video context range for temporal distractor sampling
 * Returns ALL available distractors (not limited)
 */
function gatherCrossVideoDistractors(
  answerLabel: LabelEntry,
  v2Labels: LabelEntry[],
  v2SceneDistractors: SceneDistractor[],
  videoContext: VideoContext,
  ansType: EventType
): Distractor[] {
  const distractors: Distractor[] = [];

  // Cross-video distractors - same type from OUTSIDE video context in v2 (ALL available)
  const crossVideoD = getNonOverlappingLabels(
    v2Labels,
    videoContext.start,
    videoContext.end,
    ansType
  );
  for (const cvd of crossVideoD) {
    distractors.push({
      type: 'cross-video',
      option: formatStateCaption(cvd), // Use formatted caption for SS/OS
      start: cvd.startTime,
      end: cvd.endTime,
    });
  }

  // Lexical distractors
  if (answerLabel.lexicalDistractors) {
    for (const lex of answerLabel.lexicalDistractors) {
      distractors.push({ type: 'lexical', option: lex });
    }
  }

  // Scene distractors from v2 (ALL available)
  const sceneD = getSceneDistractorsByType(v2SceneDistractors, ansType);
  for (const sd of sceneD) {
    distractors.push({ type: 'scene', option: sd.caption });
  }

  return distractors;
}

// Maximum POV-ID questions per video
const MAX_POV_ID_PER_VIDEO = 10;

/**
 * Generate POV-ID questions: Which video corresponds to the player who did X?
 * Answer is a video number, distractors are other video numbers
 * Only generates for SA (Self Action) type
 */
function generatePovIdQuestions(
  questions: GeneratedQuestion[],
  labels: LabelEntry[],
  videoDuration: number,
  videoCount: number
): void {
  // Only generate POV-ID for SA (Self Action)
  const eventType: EventType = 'SA';
  const template = LEVEL3_POV_ID_TEMPLATES.find((t) => t.answerType === 'SA');
  if (!template) return;

  // For each video, find SA labels
  for (let videoIdx = 0; videoIdx < videoCount; videoIdx++) {
    if (questions.length >= MAX_LEVEL3_QUESTIONS) break;

    const videoLabels = getLabelsByVideo(labels, videoIdx);
    const typeLabels = getLabelsByType(videoLabels, eventType);

    // Pick up to MAX_POV_ID_PER_VIDEO labels per video
    let questionsForVideo = 0;
    for (const label of typeLabels) {
      if (questions.length >= MAX_LEVEL3_QUESTIONS) break;
      if (questionsForVideo >= MAX_POV_ID_PER_VIDEO) break;

      // Need at least 2 videos for distractors
      if (videoCount < 2) continue;

      // Generate video context
      const videoContext = generateVideoContext(label.startTime, label.endTime, videoDuration);

      // Generate random video indices (includes the correct video plus random extras)
      const videoIndices = generateRandomVideoIndices([videoIdx], videoCount);

      // Build question text
      const questionText = template.template
        .replace('{caption}', formatStateCaption(label))
        .replace('{other}', formatOtherSubject(label));

      // Create distractors from other videos
      const distractors: Distractor[] = [];
      for (let i = 0; i < videoCount; i++) {
        if (i !== videoIdx) {
          distractors.push({
            type: 'cross-video',
            option: `Video ${i + 1}`,
          });
        }
      }

      if (distractors.length < 1) continue;

      const selectedDistractors = shuffleArray([...distractors]).slice(0, 3);
      const code: Level3Code = 'SA-POV-ID';

      questions.push({
        id: generateId(),
        level: 3,
        code,
        question: questionText,
        answer: {
          option: `Video ${videoIdx + 1}`,
          start: label.startTime,
          end: label.endTime,
        },
        distractors: selectedDistractors,
        allDistractors: distractors,
        videoIndex: videoIdx,
        videoIndices,
        videoContext,
        targetLabel: createLabelReference(label),
      });

      questionsForVideo++;
    }
  }
}

// Minimum gap between events for ORDER questions (1 second)
const ORDER_EVENT_GAP = 1;

// Maximum ORDER questions to generate
const MAX_ORDER_QUESTIONS = 100;

/**
 * Check if two time ranges have minimum gap between them
 */
function hasMinimumGap(
  start1: number,
  end1: number,
  start2: number,
  end2: number,
  minGap: number
): boolean {
  // Check if ranges are separated by at least minGap
  return end1 + minGap <= start2 || end2 + minGap <= start1;
}

/**
 * Find a set of non-overlapping labels with minimum gap from cross-video labels
 * Requires events from at least minVideos different videos
 * Returns labels sorted by start time
 */
function findNonOverlappingCrossVideo(
  items: { label: LabelEntry; videoIdx: number }[],
  minGap: number,
  count: number,
  minVideos: number = 2
): { label: LabelEntry; videoIdx: number }[] {
  if (items.length < count) return [];

  // Sort by start time
  const sorted = [...items].sort((a, b) => a.label.startTime - b.label.startTime);

  // Greedy selection: pick labels that don't overlap with already selected ones
  const selected: { label: LabelEntry; videoIdx: number }[] = [];
  const selectedVideos = new Set<number>();

  for (const item of sorted) {
    // Check if this label has minimum gap with all selected labels
    let canSelect = true;
    for (const sel of selected) {
      if (
        !hasMinimumGap(
          sel.label.startTime,
          sel.label.endTime,
          item.label.startTime,
          item.label.endTime,
          minGap
        )
      ) {
        canSelect = false;
        break;
      }
    }

    if (canSelect) {
      selected.push(item);
      selectedVideos.add(item.videoIdx);
      if (selected.length >= count) break;
    }
  }

  // Check if we have events from at least minVideos different videos
  if (selectedVideos.size < minVideos) {
    return [];
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
 * Filter labels to only include those with unique captions
 * (removes all labels that share a caption with another label)
 */
function filterUniqueCaptions(
  items: { label: LabelEntry; videoIdx: number }[]
): { label: LabelEntry; videoIdx: number }[] {
  // Count occurrences of each caption
  const captionCounts = new Map<string, number>();
  for (const item of items) {
    const caption = item.label.caption?.trim() || '';
    captionCounts.set(caption, (captionCounts.get(caption) || 0) + 1);
  }

  // Filter to only include items with unique captions
  return items.filter((item) => {
    const caption = item.label.caption?.trim() || '';
    return captionCounts.get(caption) === 1;
  });
}

/**
 * Format an event for ORDER question option (cross-video version)
 */
function formatCrossVideoOrderEvent(item: { label: LabelEntry; videoIdx: number }): string {
  const caption = formatStateCaption(item.label);
  if (item.label.type === 'SA') {
    return `The POV player in Video ${item.videoIdx + 1} ${caption}`;
  } else if (item.label.type === 'OA') {
    const other = item.label.other || 'the other player';
    return `The ${other} in Video ${item.videoIdx + 1} ${caption}`;
  } else if (item.label.type === 'WE') {
    return `In Video ${item.videoIdx + 1}, the event "${caption}" occurred`;
  }
  return `Video ${item.videoIdx + 1}: ${caption}`;
}

/**
 * Format a sequence of cross-video events as an option string
 */
function formatCrossVideoSequence(items: { label: LabelEntry; videoIdx: number }[]): string {
  return items.map((item, i) => `${i + 1}. ${formatCrossVideoOrderEvent(item)}`).join(', ');
}

// Order event types for Level 3
type OrderEventType = 'SA' | 'OA' | 'WE';

/**
 * Generate ORDER questions for a specific event type or MIX
 * Helper function to avoid code duplication
 */
function generateOrderQuestionsForType(
  questions: GeneratedQuestion[],
  allLabelsWithVideo: { label: LabelEntry; videoIdx: number }[],
  videoDuration: number,
  videoCount: number,
  code: Level3Code,
  isMix: boolean = false
): void {
  // Filter to only include labels with unique captions (no duplicates)
  const uniqueCaptionLabels = filterUniqueCaptions(allLabelsWithVideo);

  // Need at least 3 labels for ORDER questions
  if (uniqueCaptionLabels.length < 3) return;

  // Track generated sequences to avoid duplicates
  const generatedSequences = new Set<string>();

  // Try to generate questions with 4 events first, then 3
  for (const eventCount of [4, 3]) {
    if (questions.length >= MAX_LEVEL3_QUESTIONS) break;
    if (generatedSequences.size >= MAX_ORDER_QUESTIONS) break;

    // Generate multiple questions by trying different combinations
    const maxAttemptsPerCount = 15;
    for (let attempt = 0; attempt < maxAttemptsPerCount; attempt++) {
      if (questions.length >= MAX_LEVEL3_QUESTIONS) break;
      if (generatedSequences.size >= MAX_ORDER_QUESTIONS) break;

      // Shuffle labels for variety in selection
      const shuffledLabels =
        attempt === 0 ? uniqueCaptionLabels : shuffleArray([...uniqueCaptionLabels]);

      // Find non-overlapping events from at least 2 different videos
      const selectedItems = findNonOverlappingCrossVideo(
        shuffledLabels,
        ORDER_EVENT_GAP,
        eventCount,
        2 // require at least 2 different videos
      );

      if (selectedItems.length < eventCount) continue;

      // For MIX, require at least 2 different event types
      if (isMix) {
        const typesInSelection = new Set(selectedItems.map((item) => item.label.type));
        if (typesInSelection.size < 2) continue;
      }

      // Sort by start time (correct order)
      const correctOrder = [...selectedItems].sort((a, b) => a.label.startTime - b.label.startTime);

      const correctSequence = formatCrossVideoSequence(correctOrder);

      // Skip if we've already generated this exact sequence
      if (generatedSequences.has(correctSequence)) continue;
      generatedSequences.add(correctSequence);

      // Generate all permutations for distractors
      const allPermutations = getPermutations(correctOrder);

      // Filter out the correct permutation
      const wrongPermutations = allPermutations.filter(
        (perm) => formatCrossVideoSequence(perm) !== correctSequence
      );

      if (wrongPermutations.length < 2) continue;

      // Select 3 random wrong permutations as distractors
      const selectedDistractors = shuffleArray(wrongPermutations).slice(0, 3);
      const distractors: Distractor[] = selectedDistractors.map((perm) => ({
        type: 'order' as const,
        option: formatCrossVideoSequence(perm),
      }));

      // All wrong permutations as allDistractors
      const allDistractors: Distractor[] = wrongPermutations.map((perm) => ({
        type: 'order' as const,
        option: formatCrossVideoSequence(perm),
      }));

      // Video context spans all events
      const contextStart = Math.min(...correctOrder.map((item) => item.label.startTime));
      const contextEnd = Math.max(...correctOrder.map((item) => item.label.endTime));
      const videoContext = generateVideoContext(contextStart, contextEnd, videoDuration);

      // Generate video indices (includes all required videos plus random extras)
      const requiredVideos = [...new Set(correctOrder.map((item) => item.videoIdx))];
      const videoIndices = generateRandomVideoIndices(requiredVideos, videoCount);

      questions.push({
        id: generateId(),
        level: 3,
        code,
        question: 'Which of the following order sequence is correct?',
        answer: { option: correctSequence },
        distractors,
        allDistractors,
        videoIndex: correctOrder[0].videoIdx,
        videoIndices,
        videoContext,
      });
    }
  }
}

/**
 * Generate ORDER questions: Which of the following order sequence is correct?
 * Compares events across different videos by their start time
 * Presents 4 sequences with shuffled permutations as distractors
 * Types: SA-ORDER-MV, OA-ORDER-MV, WE-ORDER-MV, MIX-ORDER-MV
 */
function generateOrderQuestions(
  questions: GeneratedQuestion[],
  labels: LabelEntry[],
  videoDuration: number,
  videoCount: number
): void {
  // Need at least 2 videos for cross-video ordering
  if (videoCount < 2) return;

  // Collect all labels across all videos with valid captions, grouped by type
  const labelsByType: Record<OrderEventType, { label: LabelEntry; videoIdx: number }[]> = {
    SA: [],
    OA: [],
    WE: [],
  };

  for (let videoIdx = 0; videoIdx < videoCount; videoIdx++) {
    const videoLabels = getLabelsByVideo(labels, videoIdx);
    for (const label of videoLabels) {
      if (label.caption && label.caption.trim()) {
        if (label.type === 'SA' || label.type === 'OA' || label.type === 'WE') {
          labelsByType[label.type].push({ label, videoIdx });
        }
      }
    }
  }

  // Generate single-type ORDER questions (SA, OA, WE)
  const orderTypes: OrderEventType[] = ['SA', 'OA', 'WE'];
  for (const eventType of orderTypes) {
    if (questions.length >= MAX_LEVEL3_QUESTIONS) break;

    const code = `${eventType}-ORDER-MV` as Level3Code;
    generateOrderQuestionsForType(
      questions,
      labelsByType[eventType],
      videoDuration,
      videoCount,
      code,
      false
    );
  }

  // Generate MIX-ORDER-MV questions (mixing SA, OA, WE)
  if (questions.length < MAX_LEVEL3_QUESTIONS) {
    // Combine all labels for MIX
    const allMixLabels = [...labelsByType.SA, ...labelsByType.OA, ...labelsByType.WE];

    generateOrderQuestionsForType(
      questions,
      allMixLabels,
      videoDuration,
      videoCount,
      'MIX-ORDER-MV',
      true // isMix = true, requires at least 2 different types
    );
  }
}
