import { LabelEntry } from '../types';

// Check if the event type is a state type (SS or OS)
const isStateType = (type: string) => type === 'SS' || type === 'OS';

/**
 * Transform a single label when loading from JSON.
 * - For state types (SS/OS): extracts clean stateType from potentially corrupted data,
 *   sets caption to stateType (for UI editing)
 */
export function transformLabelForLoad(label: LabelEntry): LabelEntry {
  const transformed = { ...label };

  // Handle state types (SS/OS)
  if (isStateType(label.type)) {
    // If we have stateType and value, extract clean stateType
    // The stateType might be corrupted like "active weapon is G7 Scout is G7 Scout"
    // We need to extract just "active weapon"
    if (label.stateType && label.value) {
      // Remove all occurrences of " is {value}" from stateType to get clean stateType
      let cleanStateType = label.stateType;
      const suffix = ` is ${label.value}`;
      while (cleanStateType.endsWith(suffix)) {
        cleanStateType = cleanStateType.slice(0, -suffix.length);
      }
      // Also handle case where stateType itself contains the pattern
      const isPattern = new RegExp(`( is ${escapeRegex(label.value)})+$`, 'g');
      cleanStateType = cleanStateType.replace(isPattern, '');

      transformed.stateType = cleanStateType;
      // Set caption to stateType for UI (UI shows stateType in caption field)
      transformed.caption = cleanStateType;
    } else if (label.stateType) {
      // Has stateType but no value - use stateType as caption
      transformed.caption = label.stateType;
    }
    // If no stateType, caption stays as-is (new label or legacy format)
  }

  // For WO labels, ensure isCountable defaults to true if not present
  if (label.type === 'WO' && label.isCountable === undefined) {
    transformed.isCountable = true;
  }

  return transformed;
}

/**
 * Transform an array of labels when loading.
 */
export function transformLabelsForLoad(labels: LabelEntry[]): LabelEntry[] {
  return labels.map(transformLabelForLoad);
}

// Helper to escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Transform a single label for saving to JSON.
 * - For state types (SS/OS): keeps stateType and value, constructs caption as "stateType is value"
 * - For non-WO types: removes quantity field
 * - For non-action types: removes intent and intentDistractors
 * - For non-state types: removes stateType and value
 * - For non-other types: removes other field
 */
export function transformLabelForSave(label: LabelEntry): LabelEntry {
  const transformed: LabelEntry = {
    id: label.id,
    type: label.type,
    videoIndex: label.videoIndex,
    startTime: label.startTime,
    endTime: label.endTime,
    caption: label.caption,
  };

  // Handle state types (SS/OS)
  // For state types, caption in UI is the stateType (variable name)
  // We store stateType and value separately, and construct caption as "stateType is value"
  if (isStateType(label.type)) {
    // caption field in the UI holds the stateType (variable name like "active weapon")
    // stateType field may already exist if loaded from saved file
    const stateType = label.caption; // UI caption is always the stateType
    transformed.stateType = stateType;
    transformed.value = label.value;
    // Construct caption as "stateType is value" for display/export
    if (label.value) {
      transformed.caption = `${stateType} is ${label.value}`;
    }
  }

  // Handle action types (SA/OA) - keep intent and intentDistractors
  if (label.type === 'SA' || label.type === 'OA') {
    if (label.intent) {
      transformed.intent = label.intent;
    }
    if (label.intentDistractors && label.intentDistractors.length > 0) {
      transformed.intentDistractors = label.intentDistractors;
    }
  }

  // Handle "other" types (OA/OS) - keep other field
  if (label.type === 'OA' || label.type === 'OS') {
    if (label.other) {
      transformed.other = label.other;
    }
  }

  // Only WO type keeps quantity and isCountable
  if (label.type === 'WO') {
    transformed.quantity = label.quantity ?? 1;
    // Only save isCountable if it's explicitly false (default is true, so we can omit it to save space)
    if (label.isCountable === false) {
      transformed.isCountable = false;
    }
  }

  // Keep lexical distractors if present
  if (label.lexicalDistractors && label.lexicalDistractors.length > 0) {
    transformed.lexicalDistractors = label.lexicalDistractors;
  }

  return transformed;
}

/**
 * Transform an array of labels for saving.
 */
export function transformLabelsForSave(labels: LabelEntry[]): LabelEntry[] {
  return labels.map(transformLabelForSave);
}
