import { EventType } from '../../types';

// Question suffix types
export type QuestionSuffix = 'IDENT' | 'EXIST' | 'ABSENT' | 'COUNT' | 'INTENT' | 'CAUSAL';

// Distractor types
export type DistractorType =
  | 'lexical'
  | 'scene'
  | 'temporal'
  | 'role'
  | 'cross-video'
  | 'binary'
  | 'count'
  | 'intent'
  | 'causal'
  | 'order';

// Question levels
export type QuestionLevel = 1 | 2 | 3;

// Level 1 question codes (Perception)
// EXIST codes are expanded to indicate distractor source: True, Lexical, Scene, Temporal, Role
export type Level1Code =
  | 'SA-IDENT'
  | 'SS-IDENT'
  | 'OA-IDENT'
  | 'OS-IDENT'
  | 'WO-IDENT'
  | 'WE-IDENT'
  // Base EXIST codes (for templates)
  | 'SA-EXIST'
  | 'SS-EXIST'
  | 'OA-EXIST'
  | 'OS-EXIST'
  | 'WO-EXIST'
  | 'WE-EXIST'
  // EXIST-True: Answer is True (label exists)
  | 'SA-EXIST-True'
  | 'SS-EXIST-True'
  | 'OA-EXIST-True'
  | 'OS-EXIST-True'
  | 'WO-EXIST-True'
  | 'WE-EXIST-True'
  // EXIST-Lexical: Answer is False (lexical distractor)
  | 'SA-EXIST-Lexical'
  | 'SS-EXIST-Lexical'
  | 'OA-EXIST-Lexical'
  | 'OS-EXIST-Lexical'
  | 'WO-EXIST-Lexical'
  | 'WE-EXIST-Lexical'
  // EXIST-Scene: Answer is False (scene distractor)
  | 'SA-EXIST-Scene'
  | 'SS-EXIST-Scene'
  | 'OA-EXIST-Scene'
  | 'OS-EXIST-Scene'
  | 'WO-EXIST-Scene'
  | 'WE-EXIST-Scene'
  // EXIST-Temporal: Answer is False (temporal distractor - outside context)
  | 'SA-EXIST-Temporal'
  | 'SS-EXIST-Temporal'
  | 'OA-EXIST-Temporal'
  | 'OS-EXIST-Temporal'
  | 'WO-EXIST-Temporal'
  | 'WE-EXIST-Temporal'
  // EXIST-Role: Answer is False (role distractor - wrong agent)
  | 'SA-EXIST-Role'
  | 'SS-EXIST-Role'
  | 'OA-EXIST-Role'
  | 'OS-EXIST-Role'
  | 'SA-ABSENT'
  | 'SS-ABSENT'
  | 'OA-ABSENT'
  | 'OS-ABSENT'
  | 'WO-ABSENT'
  | 'WE-ABSENT'
  | 'SA-COUNT'
  | 'OA-COUNT'
  | 'WO-COUNT'
  | 'WE-COUNT'
  // INTENT questions (Why did the player do X?)
  | 'SA-INTENT'
  | 'OA-INTENT'
  // CAUSAL questions (Why did Y happen?)
  | 'CAUSAL'
  // TIME questions (When did X happen?)
  | 'SA-TIME'
  | 'SS-TIME'
  | 'OA-TIME'
  | 'OS-TIME'
  | 'WO-TIME'
  | 'WE-TIME';

// Level 2 question codes (Temporal Relation) - Format: {X}2{Y}-{SUFFIX}
// Complete bidirectional relationships for SA, SS, OA, OS, WO, WE
export type Level2Code =
  // SA as Reference -> All targets
  | 'SA2SS-IDENT'
  | 'SA2SS-EXIST'
  | 'SA2SS-EXIST-True'
  | 'SA2SS-EXIST-Lexical'
  | 'SA2SS-EXIST-Scene'
  | 'SA2SS-EXIST-Temporal'
  | 'SA2SS-EXIST-Role'
  | 'SA2SS-ABSENT'
  | 'SA2OA-IDENT'
  | 'SA2OA-EXIST'
  | 'SA2OA-EXIST-True'
  | 'SA2OA-EXIST-Lexical'
  | 'SA2OA-EXIST-Scene'
  | 'SA2OA-EXIST-Temporal'
  | 'SA2OA-EXIST-Role'
  | 'SA2OA-ABSENT'
  | 'SA2OS-IDENT'
  | 'SA2OS-EXIST'
  | 'SA2OS-EXIST-True'
  | 'SA2OS-EXIST-Lexical'
  | 'SA2OS-EXIST-Scene'
  | 'SA2OS-EXIST-Temporal'
  | 'SA2OS-EXIST-Role'
  | 'SA2OS-ABSENT'
  | 'SA2WO-IDENT'
  | 'SA2WO-EXIST'
  | 'SA2WO-EXIST-True'
  | 'SA2WO-EXIST-Lexical'
  | 'SA2WO-EXIST-Scene'
  | 'SA2WO-EXIST-Temporal'
  | 'SA2WO-ABSENT'
  | 'SA2WE-IDENT'
  | 'SA2WE-EXIST'
  | 'SA2WE-EXIST-True'
  | 'SA2WE-EXIST-Lexical'
  | 'SA2WE-EXIST-Scene'
  | 'SA2WE-EXIST-Temporal'
  | 'SA2WE-ABSENT'
  // SS as Reference -> All targets
  | 'SS2SA-IDENT'
  | 'SS2SA-EXIST'
  | 'SS2SA-EXIST-True'
  | 'SS2SA-EXIST-Lexical'
  | 'SS2SA-EXIST-Scene'
  | 'SS2SA-EXIST-Temporal'
  | 'SS2SA-EXIST-Role'
  | 'SS2SA-ABSENT'
  | 'SS2OA-IDENT'
  | 'SS2OA-EXIST'
  | 'SS2OA-EXIST-True'
  | 'SS2OA-EXIST-Lexical'
  | 'SS2OA-EXIST-Scene'
  | 'SS2OA-EXIST-Temporal'
  | 'SS2OA-EXIST-Role'
  | 'SS2OA-ABSENT'
  | 'SS2OS-IDENT'
  | 'SS2OS-EXIST'
  | 'SS2OS-EXIST-True'
  | 'SS2OS-EXIST-Lexical'
  | 'SS2OS-EXIST-Scene'
  | 'SS2OS-EXIST-Temporal'
  | 'SS2OS-EXIST-Role'
  | 'SS2OS-ABSENT'
  | 'SS2WO-IDENT'
  | 'SS2WO-EXIST'
  | 'SS2WO-EXIST-True'
  | 'SS2WO-EXIST-Lexical'
  | 'SS2WO-EXIST-Scene'
  | 'SS2WO-EXIST-Temporal'
  | 'SS2WO-ABSENT'
  | 'SS2WE-IDENT'
  | 'SS2WE-EXIST'
  | 'SS2WE-EXIST-True'
  | 'SS2WE-EXIST-Lexical'
  | 'SS2WE-EXIST-Scene'
  | 'SS2WE-EXIST-Temporal'
  | 'SS2WE-ABSENT'
  // OA as Reference -> All targets
  | 'OA2SA-IDENT'
  | 'OA2SA-EXIST'
  | 'OA2SA-EXIST-True'
  | 'OA2SA-EXIST-Lexical'
  | 'OA2SA-EXIST-Scene'
  | 'OA2SA-EXIST-Temporal'
  | 'OA2SA-EXIST-Role'
  | 'OA2SA-ABSENT'
  | 'OA2SS-IDENT'
  | 'OA2SS-EXIST'
  | 'OA2SS-EXIST-True'
  | 'OA2SS-EXIST-Lexical'
  | 'OA2SS-EXIST-Scene'
  | 'OA2SS-EXIST-Temporal'
  | 'OA2SS-EXIST-Role'
  | 'OA2SS-ABSENT'
  | 'OA2OS-IDENT'
  | 'OA2OS-EXIST'
  | 'OA2OS-EXIST-True'
  | 'OA2OS-EXIST-Lexical'
  | 'OA2OS-EXIST-Scene'
  | 'OA2OS-EXIST-Temporal'
  | 'OA2OS-EXIST-Role'
  | 'OA2OS-ABSENT'
  | 'OA2WO-IDENT'
  | 'OA2WO-EXIST'
  | 'OA2WO-EXIST-True'
  | 'OA2WO-EXIST-Lexical'
  | 'OA2WO-EXIST-Scene'
  | 'OA2WO-EXIST-Temporal'
  | 'OA2WO-ABSENT'
  | 'OA2WE-IDENT'
  | 'OA2WE-EXIST'
  | 'OA2WE-EXIST-True'
  | 'OA2WE-EXIST-Lexical'
  | 'OA2WE-EXIST-Scene'
  | 'OA2WE-EXIST-Temporal'
  | 'OA2WE-ABSENT'
  // OS as Reference -> All targets
  | 'OS2SA-IDENT'
  | 'OS2SA-EXIST'
  | 'OS2SA-EXIST-True'
  | 'OS2SA-EXIST-Lexical'
  | 'OS2SA-EXIST-Scene'
  | 'OS2SA-EXIST-Temporal'
  | 'OS2SA-EXIST-Role'
  | 'OS2SA-ABSENT'
  | 'OS2SS-IDENT'
  | 'OS2SS-EXIST'
  | 'OS2SS-EXIST-True'
  | 'OS2SS-EXIST-Lexical'
  | 'OS2SS-EXIST-Scene'
  | 'OS2SS-EXIST-Temporal'
  | 'OS2SS-EXIST-Role'
  | 'OS2SS-ABSENT'
  | 'OS2OA-IDENT'
  | 'OS2OA-EXIST'
  | 'OS2OA-EXIST-True'
  | 'OS2OA-EXIST-Lexical'
  | 'OS2OA-EXIST-Scene'
  | 'OS2OA-EXIST-Temporal'
  | 'OS2OA-EXIST-Role'
  | 'OS2OA-ABSENT'
  | 'OS2WO-IDENT'
  | 'OS2WO-EXIST'
  | 'OS2WO-EXIST-True'
  | 'OS2WO-EXIST-Lexical'
  | 'OS2WO-EXIST-Scene'
  | 'OS2WO-EXIST-Temporal'
  | 'OS2WO-ABSENT'
  | 'OS2WE-IDENT'
  | 'OS2WE-EXIST'
  | 'OS2WE-EXIST-True'
  | 'OS2WE-EXIST-Lexical'
  | 'OS2WE-EXIST-Scene'
  | 'OS2WE-EXIST-Temporal'
  | 'OS2WE-ABSENT'
  // WO as Reference -> All targets
  | 'WO2SA-IDENT'
  | 'WO2SA-EXIST'
  | 'WO2SA-EXIST-True'
  | 'WO2SA-EXIST-Lexical'
  | 'WO2SA-EXIST-Scene'
  | 'WO2SA-EXIST-Temporal'
  | 'WO2SA-EXIST-Role'
  | 'WO2SA-ABSENT'
  | 'WO2SS-IDENT'
  | 'WO2SS-EXIST'
  | 'WO2SS-EXIST-True'
  | 'WO2SS-EXIST-Lexical'
  | 'WO2SS-EXIST-Scene'
  | 'WO2SS-EXIST-Temporal'
  | 'WO2SS-EXIST-Role'
  | 'WO2SS-ABSENT'
  | 'WO2OA-IDENT'
  | 'WO2OA-EXIST'
  | 'WO2OA-EXIST-True'
  | 'WO2OA-EXIST-Lexical'
  | 'WO2OA-EXIST-Scene'
  | 'WO2OA-EXIST-Temporal'
  | 'WO2OA-EXIST-Role'
  | 'WO2OA-ABSENT'
  | 'WO2OS-IDENT'
  | 'WO2OS-EXIST'
  | 'WO2OS-EXIST-True'
  | 'WO2OS-EXIST-Lexical'
  | 'WO2OS-EXIST-Scene'
  | 'WO2OS-EXIST-Temporal'
  | 'WO2OS-EXIST-Role'
  | 'WO2OS-ABSENT'
  | 'WO2WE-IDENT'
  | 'WO2WE-EXIST'
  | 'WO2WE-EXIST-True'
  | 'WO2WE-EXIST-Lexical'
  | 'WO2WE-EXIST-Scene'
  | 'WO2WE-EXIST-Temporal'
  | 'WO2WE-ABSENT'
  // WE as Reference -> All targets
  | 'WE2SA-IDENT'
  | 'WE2SA-EXIST'
  | 'WE2SA-EXIST-True'
  | 'WE2SA-EXIST-Lexical'
  | 'WE2SA-EXIST-Scene'
  | 'WE2SA-EXIST-Temporal'
  | 'WE2SA-EXIST-Role'
  | 'WE2SA-ABSENT'
  | 'WE2SS-IDENT'
  | 'WE2SS-EXIST'
  | 'WE2SS-EXIST-True'
  | 'WE2SS-EXIST-Lexical'
  | 'WE2SS-EXIST-Scene'
  | 'WE2SS-EXIST-Temporal'
  | 'WE2SS-EXIST-Role'
  | 'WE2SS-ABSENT'
  | 'WE2OA-IDENT'
  | 'WE2OA-EXIST'
  | 'WE2OA-EXIST-True'
  | 'WE2OA-EXIST-Lexical'
  | 'WE2OA-EXIST-Scene'
  | 'WE2OA-EXIST-Temporal'
  | 'WE2OA-EXIST-Role'
  | 'WE2OA-ABSENT'
  | 'WE2OS-IDENT'
  | 'WE2OS-EXIST'
  | 'WE2OS-EXIST-True'
  | 'WE2OS-EXIST-Lexical'
  | 'WE2OS-EXIST-Scene'
  | 'WE2OS-EXIST-Temporal'
  | 'WE2OS-EXIST-Role'
  | 'WE2OS-ABSENT'
  | 'WE2WO-IDENT'
  | 'WE2WO-EXIST'
  | 'WE2WO-EXIST-True'
  | 'WE2WO-EXIST-Lexical'
  | 'WE2WO-EXIST-Scene'
  | 'WE2WO-EXIST-Temporal'
  | 'WE2WO-ABSENT'
  // TR (Timeline Reference) as Reference -> All targets
  | 'TR2SA-IDENT'
  | 'TR2SA-EXIST'
  | 'TR2SA-EXIST-True'
  | 'TR2SA-EXIST-Lexical'
  | 'TR2SA-EXIST-Scene'
  | 'TR2SA-EXIST-Temporal'
  | 'TR2SA-EXIST-Role'
  | 'TR2SA-ABSENT'
  | 'TR2SS-IDENT'
  | 'TR2SS-EXIST'
  | 'TR2SS-EXIST-True'
  | 'TR2SS-EXIST-Lexical'
  | 'TR2SS-EXIST-Scene'
  | 'TR2SS-EXIST-Temporal'
  | 'TR2SS-EXIST-Role'
  | 'TR2SS-ABSENT'
  | 'TR2OA-IDENT'
  | 'TR2OA-EXIST'
  | 'TR2OA-EXIST-True'
  | 'TR2OA-EXIST-Lexical'
  | 'TR2OA-EXIST-Scene'
  | 'TR2OA-EXIST-Temporal'
  | 'TR2OA-EXIST-Role'
  | 'TR2OA-ABSENT'
  | 'TR2OS-IDENT'
  | 'TR2OS-EXIST'
  | 'TR2OS-EXIST-True'
  | 'TR2OS-EXIST-Lexical'
  | 'TR2OS-EXIST-Scene'
  | 'TR2OS-EXIST-Temporal'
  | 'TR2OS-EXIST-Role'
  | 'TR2OS-ABSENT'
  | 'TR2WO-IDENT'
  | 'TR2WO-EXIST'
  | 'TR2WO-EXIST-True'
  | 'TR2WO-EXIST-Lexical'
  | 'TR2WO-EXIST-Scene'
  | 'TR2WO-EXIST-Temporal'
  | 'TR2WO-ABSENT'
  | 'TR2WE-IDENT'
  | 'TR2WE-EXIST'
  | 'TR2WE-EXIST-True'
  | 'TR2WE-EXIST-Lexical'
  | 'TR2WE-EXIST-Scene'
  | 'TR2WE-EXIST-Temporal'
  | 'TR2WE-ABSENT'
  // ORDER questions - temporal ordering within single video
  | 'SA-ORDER'
  | 'OA-ORDER'
  | 'WE-ORDER'
  | 'MIX-ORDER';

// Level 3 question codes (Cross-Video Relation)
// Cross-video codes use dynamic video indices: V{n}-{X}2V{m}-{Y}-{SUFFIX}
// e.g., V3-SS2V1-SA-IDENT means Video 3's SS refers to Video 1's SA
// Reference types (X): SA, SS, OA, OS, WO, WE
// Answer types (Y): SA, SS, OA, OS, WO, WE
// Suffixes: IDENT, EXIST (with distractor type suffixes for EXIST)
// We use a template-style type that allows any video number
export type Level3CrossVideoCode =
  | `V${number}-${EventType}2V${number}-${EventType}-IDENT`
  | `V${number}-${EventType}2V${number}-${EventType}-EXIST`
  // EXIST with distractor type suffixes (like Level 1 and Level 2)
  | `V${number}-${EventType}2V${number}-${EventType}-EXIST-True`
  | `V${number}-${EventType}2V${number}-${EventType}-EXIST-Lexical`
  | `V${number}-${EventType}2V${number}-${EventType}-EXIST-Scene`
  | `V${number}-${EventType}2V${number}-${EventType}-EXIST-CrossVideo`;

// POV-ID: Identity & Attribution - Which video corresponds to player who did X?
// Only SA (Self Action) is supported
export type Level3PovIdCode = 'SA-POV-ID';

// ORDER: Temporal Ordering Across Videos - Which sequence is correct? (MV = Multi-Video)
export type Level3OrderCode = 'SA-ORDER-MV' | 'OA-ORDER-MV' | 'WE-ORDER-MV' | 'MIX-ORDER-MV';

// Combined Level 3 codes
export type Level3Code = Level3CrossVideoCode | Level3PovIdCode | Level3OrderCode;

export type QuestionCode = Level1Code | Level2Code | Level3Code | 'CUSTOM';

// Answer/Distractor option interface
export interface QuestionOption {
  option: string;
  start?: number;
  end?: number;
}

// Distractor with type
export interface Distractor extends QuestionOption {
  type: DistractorType;
}

// Reference label metadata
export interface LabelReference {
  id: string;
  type: EventType;
  start: number;
  end: number;
  caption: string;
}

// Video context range - the clip shown for the question
export interface VideoContext {
  start: number;
  end: number;
}

// Generated question interface
export interface GeneratedQuestion {
  id: string;
  level: QuestionLevel;
  code: QuestionCode;
  question: string;
  answer: QuestionOption;
  distractors: Distractor[]; // Currently selected/active distractors
  allDistractors?: Distractor[]; // All available distractors for this question
  // Metadata
  videoIndex?: number;
  videoIndices?: number[]; // For Level 3: which videos are presented (can include extra videos beyond required 2)
  videoContext?: VideoContext; // The video clip context for this question
  referenceLabel?: LabelReference;
  targetLabel?: LabelReference;
}

// Question template for phrasing
export interface QuestionTemplate {
  code: QuestionCode;
  template: string;
  answerType: EventType | EventType[];
  referenceType?: EventType | EventType[];
}

// Statistics for generated questions
export interface QuestionStats {
  total: number;
  byLevel: Record<QuestionLevel, number>;
  byCode: Record<string, number>;
  byDistractorType: Record<DistractorType, number>;
}

// Export format for saving
export interface ExportedQuestions {
  instanceId: string;
  instanceName: string;
  generatedAt: string;
  stats: QuestionStats;
  questions: GeneratedQuestion[];
}
