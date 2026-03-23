import {
  GeneratedQuestion,
  QuestionStats,
  QuestionLevel,
  ExportedQuestions,
} from '../../utils/questionGenerator';

export interface VideoInfo {
  path: string;
  name: string;
  url?: string;
}

// Editable question extends GeneratedQuestion with validation status
export interface EditableQuestion extends GeneratedQuestion {
  isValid?: boolean; // undefined = not reviewed, true = valid, false = invalid
  isEdited?: boolean; // Track if question has been edited
}

export interface QuestionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: GeneratedQuestion[];
  stats: QuestionStats;
  instanceId: string;
  instanceName: string;
  videos: VideoInfo[];
  projectFolder?: string;
  onExport: (data: ExportedQuestions) => Promise<void>;
  onRegenerate?: () => Promise<{ questions: GeneratedQuestion[]; stats: QuestionStats } | null>;
}

export interface TimeBadgeProps {
  start?: number;
  end?: number;
  videoIndex?: number;
  onJump: (time: number, endTime?: number, videoIndex?: number) => void;
  className?: string;
}

export interface QuestionCardProps {
  question: EditableQuestion;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onJumpToTime: (time: number, endTime?: number, videoIndex?: number) => void;
  onQuestionChange: (updates: Partial<EditableQuestion>) => void;
}

export interface VideoPreviewProps {
  videos: VideoInfo[];
  previewVideoIndex: number;
  onVideoIndexChange: (index: number) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackStartTime: number | null;
  playbackEndTime: number | null;
  videoContextStart: number | null; // Video context range start
  videoContextEnd: number | null; // Video context range end
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
  onPlayStateChange: (playing: boolean) => void;
  onClearPlaybackRange: () => void;
  onVideoContextChange?: (start: number, end: number) => void; // Callback to update video context
}

export interface QuestionFiltersProps {
  filterLevel: QuestionLevel | 'all';
  filterCode: string;
  filterValidation: 'all' | 'valid' | 'invalid' | 'unreviewed';
  searchQuery: string;
  uniqueCodes: string[];
  stats: QuestionStats;
  filteredCount: number;
  totalCount: number;
  validCount: number;
  invalidCount: number;
  unreviewedCount: number;
  onFilterLevelChange: (level: QuestionLevel | 'all') => void;
  onFilterCodeChange: (code: string) => void;
  onFilterValidationChange: (filter: 'all' | 'valid' | 'invalid' | 'unreviewed') => void;
  onSearchChange: (query: string) => void;
}

// Editable inline text component props
export interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
}

// Autosave data structure
export interface AutosaveQuestionData {
  instanceId: string;
  instanceName: string;
  lastSaved: string;
  questions: EditableQuestion[];
}

// Re-export types from questionGenerator for convenience
export type {
  GeneratedQuestion,
  QuestionStats,
  QuestionLevel,
  DistractorType,
  ExportedQuestions,
  Distractor,
} from '../../utils/questionGenerator';
