// Main component export
export { QuestionPreviewModal } from './QuestionPreviewModal';

// Sub-component exports for potential reuse
export { QuestionCard } from './QuestionCard';
export { VideoPreview } from './VideoPreview';
export { QuestionFilters } from './QuestionFilters';
export { TimeBadge } from './TimeBadge';
export { EditableText } from './EditableText';

// Type exports
export type {
  QuestionPreviewModalProps,
  VideoInfo,
  TimeBadgeProps,
  QuestionCardProps,
  VideoPreviewProps,
  QuestionFiltersProps,
  EditableQuestion,
  EditableTextProps,
  AutosaveQuestionData,
} from './types';

// Constants exports
export { DISTRACTOR_COLORS, LEVEL_COLORS, LEVEL_NAMES } from './constants';

// Utils exports
export { formatTime, getVideoUrl } from './utils';
