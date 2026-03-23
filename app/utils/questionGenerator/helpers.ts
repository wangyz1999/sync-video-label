import { LabelEntry, SceneDistractor, EventType } from '../../types';
import { VideoContext } from './types';

// Constants for video context generation
const MIN_VIDEO_CONTEXT_LENGTH = 8; // seconds

/**
 * Format a single timestamp as "MM:SS"
 * @param seconds - Time in seconds
 * @returns Formatted timestamp string like "00:12"
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format a timestamp range as "[MM:SS to MM:SS]"
 * @param start - Start time in seconds
 * @param end - End time in seconds
 * @returns Formatted timestamp string like "[00:01 to 00:12]"
 */
export function formatTimestampRange(start: number, end: number): string {
  return `[${formatTime(start)} to ${formatTime(end)}]`;
}

/**
 * Format a timestamp range relative to a video context as "[MM:SS to MM:SS]"
 * When the video is trimmed to the video context, timestamps need to be adjusted
 * to be relative to the context start (which becomes 00:00 in the trimmed video).
 * @param start - Absolute start time in seconds
 * @param end - Absolute end time in seconds
 * @param contextStart - Start time of the video context in seconds
 * @returns Formatted timestamp string relative to the video context
 */
export function formatRelativeTimestampRange(
  start: number,
  end: number,
  contextStart: number
): string {
  const relativeStart = Math.max(0, start - contextStart);
  const relativeEnd = Math.max(0, end - contextStart);
  return `[${formatTime(relativeStart)} to ${formatTime(relativeEnd)}]`;
}

// Role mapping for role distractors (Self vs Other)
export const ROLE_PAIRS: Record<EventType, EventType | null> = {
  SA: 'OA',
  SS: 'OS',
  OA: 'SA',
  OS: 'SS',
  WO: null,
  WE: null,
};

// Helper to check if two time ranges overlap
export function timeRangesOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Filter labels to get mutually non-overlapping ones
 * Returns a subset where no two labels overlap with each other
 * Uses greedy algorithm: sorts by start time and picks non-overlapping ones
 */
export function getMutuallyNonOverlappingLabels(labels: LabelEntry[]): LabelEntry[] {
  if (labels.length <= 1) return labels;

  // Sort by start time
  const sorted = [...labels].sort((a, b) => a.startTime - b.startTime);

  const result: LabelEntry[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const lastSelected = result[result.length - 1];
    const current = sorted[i];

    // Only add if it doesn't overlap with the last selected label
    if (current.startTime >= lastSelected.endTime) {
      result.push(current);
    }
  }

  return result;
}

// Helper to get labels by type
export function getLabelsByType(labels: LabelEntry[], type: EventType): LabelEntry[] {
  return labels.filter((l) => l.type === type && l.caption && l.caption.trim());
}

// Helper to get labels for a specific video
export function getLabelsByVideo(labels: LabelEntry[], videoIndex: number): LabelEntry[] {
  return labels.filter((l) => l.videoIndex === videoIndex && l.caption && l.caption.trim());
}

// Helper to get scene distractors by type
export function getSceneDistractorsByType(
  distractors: SceneDistractor[],
  type: EventType
): SceneDistractor[] {
  return distractors.filter((d) => d.type === type && d.caption && d.caption.trim());
}

// Helper to find labels overlapping with a time range
export function getOverlappingLabels(
  labels: LabelEntry[],
  start: number,
  end: number,
  type?: EventType
): LabelEntry[] {
  return labels.filter(
    (l) =>
      timeRangesOverlap(l.startTime, l.endTime, start, end) &&
      (!type || l.type === type) &&
      l.caption &&
      l.caption.trim()
  );
}

// Helper to find labels NOT overlapping (for temporal distractors)
// Now uses video context range instead of just the answer range
export function getNonOverlappingLabels(
  labels: LabelEntry[],
  contextStart: number,
  contextEnd: number,
  type: EventType
): LabelEntry[] {
  return labels.filter(
    (l) =>
      l.type === type &&
      !timeRangesOverlap(l.startTime, l.endTime, contextStart, contextEnd) &&
      l.caption &&
      l.caption.trim()
  );
}

/**
 * Generate a video context range that contains the answer time range
 * @param answerStart - Start time of the answer
 * @param answerEnd - End time of the answer
 * @param videoDuration - Total video duration
 * @returns VideoContext with start and end times
 */
export function generateVideoContext(
  answerStart: number,
  answerEnd: number,
  videoDuration: number
): VideoContext {
  const answerLength = answerEnd - answerStart;

  // Ensure minimum context length, but don't exceed video duration
  const minContextLength = Math.max(MIN_VIDEO_CONTEXT_LENGTH, answerLength);
  const maxContextLength = videoDuration;

  // If video is shorter than minimum, use full video
  if (videoDuration <= MIN_VIDEO_CONTEXT_LENGTH) {
    return { start: 0, end: videoDuration };
  }

  // Random context length between min and max
  const contextLength = minContextLength + Math.random() * (maxContextLength - minContextLength);

  // Calculate how much padding we have around the answer
  const totalPadding = contextLength - answerLength;

  // Randomly distribute padding before and after the answer
  const paddingBefore = Math.random() * totalPadding;
  const paddingAfter = totalPadding - paddingBefore;

  // Calculate context bounds, clamping to video bounds
  let contextStart = answerStart - paddingBefore;
  let contextEnd = answerEnd + paddingAfter;

  // Clamp to video bounds and adjust
  if (contextStart < 0) {
    contextEnd -= contextStart; // Add the overflow to the end
    contextStart = 0;
  }
  if (contextEnd > videoDuration) {
    contextStart -= contextEnd - videoDuration; // Subtract the overflow from start
    contextEnd = videoDuration;
  }

  // Final clamp
  contextStart = Math.max(0, contextStart);
  contextEnd = Math.min(videoDuration, contextEnd);

  return {
    start: Math.round(contextStart * 100) / 100, // Round to 2 decimal places
    end: Math.round(contextEnd * 100) / 100,
  };
}

// Generate a unique ID
export function generateId(): string {
  return `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Shuffle array (Fisher-Yates algorithm)
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate random count distractors (avoiding the correct count)
export function generateCountDistractors(correctCount: number, count: number = 3): number[] {
  const distractors: number[] = [];
  const usedCounts = new Set<number>([correctCount]);

  while (distractors.length < count) {
    const randomCount = Math.floor(Math.random() * 6) + 1;
    if (!usedCounts.has(randomCount)) {
      usedCounts.add(randomCount);
      distractors.push(randomCount);
    }
  }

  return distractors;
}

// Group labels by type
export function groupLabelsByType(labels: LabelEntry[]): Record<EventType, LabelEntry[]> {
  return {
    SA: getLabelsByType(labels, 'SA'),
    SS: getLabelsByType(labels, 'SS'),
    OA: getLabelsByType(labels, 'OA'),
    OS: getLabelsByType(labels, 'OS'),
    WO: getLabelsByType(labels, 'WO'),
    WE: getLabelsByType(labels, 'WE'),
  };
}

// Create a label reference object from a label
export function createLabelReference(label: LabelEntry) {
  return {
    id: label.id,
    type: label.type,
    start: label.startTime,
    end: label.endTime,
    caption: label.caption,
  };
}

/**
 * Generate exact video context (no padding) - used for State types (SS, OS)
 * The video context duration will be exactly the state's duration
 */
export function generateExactVideoContext(startTime: number, endTime: number): VideoContext {
  return {
    start: Math.round(startTime * 100) / 100,
    end: Math.round(endTime * 100) / 100,
  };
}

// Minimum video context length for Level 1 questions
const MIN_LEVEL1_CONTEXT_LENGTH = 5; // seconds
const LEVEL1_PADDING = 2; // seconds to pad on each side if event is too short

/**
 * Generate video context for Level 1 questions
 * Uses exact event duration, but if duration < 5 seconds, pads ±2 seconds around boundaries
 * @param startTime - Event start time in seconds
 * @param endTime - Event end time in seconds
 * @param videoDuration - Total video duration (for clamping)
 * @returns VideoContext with start and end times
 */
export function generateLevel1VideoContext(
  startTime: number,
  endTime: number,
  videoDuration: number
): VideoContext {
  const eventDuration = endTime - startTime;

  // If event is already >= 5 seconds, use exact duration
  if (eventDuration >= MIN_LEVEL1_CONTEXT_LENGTH) {
    return {
      start: Math.round(startTime * 100) / 100,
      end: Math.round(endTime * 100) / 100,
    };
  }

  // Event is too short, pad ±2 seconds around boundaries
  let contextStart = startTime - LEVEL1_PADDING;
  let contextEnd = endTime + LEVEL1_PADDING;

  // Clamp to video bounds and adjust if needed
  if (contextStart < 0) {
    contextEnd -= contextStart; // Add the overflow to the end
    contextStart = 0;
  }
  if (contextEnd > videoDuration) {
    contextStart -= contextEnd - videoDuration; // Subtract the overflow from start
    contextEnd = videoDuration;
  }

  // Final clamp
  contextStart = Math.max(0, contextStart);
  contextEnd = Math.min(videoDuration, contextEnd);

  return {
    start: Math.round(contextStart * 100) / 100,
    end: Math.round(contextEnd * 100) / 100,
  };
}

/**
 * Format a state label's caption to include the value
 * For SS/OS labels: combines stateType and value into "stateType is value"
 * If stateType is not available, uses caption as-is (it may already be formatted)
 * For other labels: returns the caption as-is
 */
export function formatStateCaption(label: LabelEntry): string {
  if ((label.type === 'SS' || label.type === 'OS') && label.value) {
    // Use stateType if available (preferred), otherwise check if caption already contains the value
    if (label.stateType) {
      return `${label.stateType} is ${label.value}`;
    }
    // If caption already ends with the value, it's already formatted - return as-is
    if (label.caption.endsWith(label.value)) {
      return label.caption;
    }
    return `${label.caption} is ${label.value}`;
  }
  return label.caption;
}

/**
 * Format the "other" subject for OA/OS labels
 * Uses the label's `other` field if available (e.g., "teammate", "enemy")
 * Falls back to "the other player" if not specified
 */
export function formatOtherSubject(label: LabelEntry): string {
  if ((label.type === 'OA' || label.type === 'OS') && label.other) {
    return `the ${label.other}`;
  }
  return 'the other player';
}
