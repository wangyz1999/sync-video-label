// Request and response types for prediction API

export interface PredictRequest {
  instanceId: string;
  instanceName: string;
  videoPaths: string[];
  videoDuration: number;
  model: string;
  temperature: number;
  provider?: 'openrouter' | 'google-ai-studio';
  projectFolder?: string;
}

// Label types from LLM response
export type PlayerLabelType = 'SA' | 'SS' | 'OA' | 'OS';
export type WorldLabelType = 'WO' | 'WE';
export type LabelType = PlayerLabelType | WorldLabelType;

export interface LabelFromLLM {
  type: LabelType;
  startTime: number;
  endTime: number;
  caption: string;
  // For OA/OS types: describes who the "other" is (e.g., "teammate", "enemy", "NPC")
  other?: string;
  // For SA/OA action types: action → intent
  intent?: string;
  // For SA/OA action types: alternative plausible intents (3 alternatives)
  intentDistractors?: string[];
  // For SS/OS state types: variable → value (caption is variable, value is the state value)
  value?: string;
}

// Scene distractors from LLM response - uses same 6 types as frame labels
export interface SceneDistractorFromLLM {
  SA: string[];
  SS: string[];
  OA: string[];
  OS: string[];
  WO: string[];
  WE: string[];
}

// Transformed label for storage
export interface PredictionLabel {
  id: string;
  type: string;
  videoIndex: number;
  startTime: number;
  endTime: number;
  caption: string;
  quantity: number;
  // For OA/OS types: describes who the "other" is (e.g., "teammate", "enemy", "NPC")
  other?: string;
  // For SA/OA action types
  intent?: string;
  // For SA/OA action types: alternative plausible intents
  intentDistractors?: string[];
  // For SS/OS state types
  value?: string;
}

// Transformed scene distractor for storage - uses EventType (SA, SS, OA, OS, WO, WE)
// No time range - scene distractors don't have timestamps
export interface PredictionDistractor {
  id: string;
  type: LabelType;
  videoIndex: number;
  caption: string;
}

// Lexical distractor input/output types
export interface LexicalDistractorInput {
  id: number;
  caption: string;
}

export interface LexicalDistractorOutput {
  id: number;
  distractors: string[];
}

export interface LexicalDistractorsByType {
  SA?: LexicalDistractorOutput[];
  SS?: LexicalDistractorOutput[];
  OA?: LexicalDistractorOutput[];
  OS?: LexicalDistractorOutput[];
  WO?: LexicalDistractorOutput[];
  WE?: LexicalDistractorOutput[];
}

export interface LexicalDistractorResult {
  distractors: LexicalDistractorsByType;
  usage: UsageStats;
}

// Usage metadata from Google AI Studio
// Reference: https://ai.google.dev/api/generate-content#usagemetadata
export interface GoogleUsageMetadata {
  promptTokenCount: number;
  cachedContentTokenCount?: number;
  candidatesTokenCount: number;
  thoughtsTokenCount?: number;
  totalTokenCount: number;
}

// Normalized usage stats for consistent reporting
export interface UsageStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  // Google-specific fields (optional)
  cachedContentTokens?: number;
  thoughtsTokens?: number;
}

// Result from a single analysis pass
export interface AnalysisPassResult {
  labels: LabelFromLLM[];
  usage: UsageStats;
}

// Result from scene distractor analysis
export interface SceneDistractorResult {
  distractors: SceneDistractorFromLLM;
  usage: UsageStats;
}

// Combined result from all analysis passes for a video
export interface VideoAnalysisResult {
  labels: LabelFromLLM[];
  sceneDistractors: SceneDistractorFromLLM;
  usage: {
    player: UsageStats;
    world: UsageStats;
    sceneDistractors: UsageStats;
  };
}

// Label with lexical distractors (for storage)
export interface PredictionLabelWithLexical extends PredictionLabel {
  lexicalDistractors?: string[];
  // Inherited from PredictionLabel: other, intent, intentDistractors (for SA/OA) and value (for SS/OS)
}

// Final prediction object saved to file
export interface Prediction {
  instanceId: string;
  instanceName: string;
  videoPaths: string[];
  videoDuration: number;
  labels: PredictionLabel[];
  sceneDistractors?: PredictionDistractor[];
  lastModified: string;
  generatedBy: string;
}

// Provider type
export type Provider = 'openrouter' | 'google-ai-studio';
