// Event label types
export type EventType = 'SA' | 'SS' | 'OA' | 'OS' | 'WO' | 'WE';

export interface EventTypeInfo {
  code: EventType;
  fullName: string;
  description: string;
  color: string;
}

export const EVENT_TYPES: EventTypeInfo[] = [
  {
    code: 'SA',
    fullName: 'Self-Action',
    description: 'Actions performed by the POV player',
    color: '#ef4444',
  },
  {
    code: 'SS',
    fullName: 'Self-State',
    description: 'Status of the POV player (current HP, Ammo, etc.)',
    color: '#f97316',
  },
  {
    code: 'OA',
    fullName: 'Other-Action',
    description: 'Actions performed by teammates or enemies',
    color: '#eab308',
  },
  {
    code: 'OS',
    fullName: 'Other-State',
    description: 'Visual/UI status of teammates or enemies',
    color: '#22c55e',
  },
  {
    code: 'WO',
    fullName: 'World-Object',
    description: 'Inanimate environment objects or landmarks',
    color: '#3b82f6',
  },
  {
    code: 'WE',
    fullName: 'World-Event',
    description: 'Environmental changes or system-level events',
    color: '#a855f7',
  },
];

// Single label/annotation entry
export interface LabelEntry {
  id: string;
  type: EventType;
  videoIndex: number; // Which video this label belongs to (0-indexed)
  startTime: number; // in seconds (integer)
  endTime: number; // in seconds (integer)
  caption: string; // For SA/OA: action, For SS/OS: "stateType is value", For WO/WE: full caption
  other?: string; // For OA/OS only: describes who the "other" is (e.g., "teammate", "enemy", "NPC")
  intent?: string; // For SA/OA only: the intent (e.g., "shoot" to "kill enemy")
  stateType?: string; // For SS/OS only: the state type/variable (e.g., "active weapon")
  value?: string; // For SS/OS only: the state value (e.g., "G7 Scout")
  quantity?: number; // For WO only: positive integer count
  isCountable?: boolean; // For WO only: whether this object can be counted (default: true)
  lexicalDistractors?: string[]; // Optional list of lexical distractors
  intentDistractors?: string[]; // For SA/OA only: intent distractors
}

// Causal relationship between two labels
export interface CausalRelation {
  id: string;
  videoIndex: number; // Which video this causal relation belongs to
  causeId: string; // ID of the label that causes
  effectId: string; // ID of the label that is caused
  causalDistractors?: string[]; // Optional list of causal distractors
}

// Scene distractor entry - no time range, no quantity, no lexical distractors
export interface SceneDistractor {
  id: string;
  type: EventType;
  videoIndex: number; // Which video this belongs to (0-indexed)
  caption: string; // The distractor text
}

// Custom question entry - manually specified question with answer and distractors
export interface CustomQuestion {
  id: string;
  videoIndex: number; // Which video this question belongs to (0-indexed)
  question: string; // The question text
  correctOption: string; // The correct answer option
  distractorOptions: string[]; // List of distractor options
  startTime?: number; // Optional: start time in seconds
  endTime?: number; // Optional: end time in seconds
  isMultiVideo?: boolean; // Whether this question spans multiple videos
}

// Video layout options for grid display
// Regular grids: '1x1', '1x2', '2x2', '1x3', '2x3', '1x4', '1x5', '1x6'
// Special layouts: '2+1' (2 top, 1 bottom), '3+2' (3 top, 2 bottom), 'focused' (active video large, others small on side)
export type VideoLayout =
  | '1x1'
  | '1x2'
  | '2x2'
  | '1x3'
  | '2x3'
  | '1x4'
  | '1x5'
  | '1x6'
  | '2+1'
  | '3+2'
  | 'focused';

export interface LayoutConfig {
  code: VideoLayout;
  rows: number;
  cols: number;
  label: string;
  isSpecial?: boolean; // Special layouts need custom positioning
}

export const VIDEO_LAYOUTS: LayoutConfig[] = [
  { code: '1x1', rows: 1, cols: 1, label: '1×1' },
  { code: '1x2', rows: 1, cols: 2, label: '1×2' },
  { code: '2x2', rows: 2, cols: 2, label: '2×2' },
  { code: '2+1', rows: 2, cols: 2, label: '2+1', isSpecial: true }, // 2 top, 1 bottom centered
  { code: '1x3', rows: 1, cols: 3, label: '1×3' },
  { code: '2x3', rows: 2, cols: 3, label: '2×3' },
  { code: '3+2', rows: 2, cols: 3, label: '3+2', isSpecial: true }, // 3 top, 2 bottom centered
  { code: '1x4', rows: 1, cols: 4, label: '1×4' },
  { code: '1x5', rows: 1, cols: 5, label: '1×5' },
  { code: '1x6', rows: 1, cols: 6, label: '1×6' },
  { code: 'focused', rows: 1, cols: 1, label: 'Focus', isSpecial: true }, // Active video large, others small on side
];

// Video info for loaded videos
export interface VideoInfo {
  url: string; // Object URL or path
  name: string; // Display name
  duration: number; // Duration in seconds
  path: string; // Original path from project file
}

// Single instance containing multiple videos
export interface Instance {
  id: string;
  name?: string;
  videos: string[]; // Paths to video files
  prediction?: string; // Optional path to prediction file (relative to data/prediction/)
  annotations?: string[]; // Optional paths to pre-existing annotation files
}

// Project file structure (imported JSON)
export interface ProjectFile {
  name?: string;
  folder?: string; // Project folder path (e.g., 'data/project-a')
  basePath?: string; // Legacy: Base path for relative video/annotation paths
  instances: Instance[];
}

// Loaded instance with video data
export interface LoadedInstance {
  id: string;
  name: string;
  videos: VideoInfo[];
  duration: number; // Maximum duration among all videos
  predictionPath?: string; // Path to prediction file if specified in project
  projectFolder?: string; // Project folder path for saving annotations/questions
}

// The annotation state for an instance (multiple videos)
export interface InstanceAnnotation {
  instanceId: string;
  instanceName: string;
  videoPaths: string[];
  videoDuration: number; // Shared timeline duration
  labels: LabelEntry[]; // Labels with videoIndex
  sceneDistractors?: SceneDistractor[]; // Scene-level distractors (spans full video)
  causalRelations?: CausalRelation[]; // Causal relationships between labels
  customQuestions?: CustomQuestion[]; // Custom manually specified questions
  lastModified: string; // ISO date string
}

// Legacy single video annotation (for backwards compatibility)
export interface AnnotationState {
  videoName: string;
  videoDuration: number;
  labels: LabelEntry[];
  lastModified: string;
}

// Video file info (legacy, for file drop support)
export interface VideoFile {
  file: File;
  name: string;
  url: string;
  duration: number;
}
