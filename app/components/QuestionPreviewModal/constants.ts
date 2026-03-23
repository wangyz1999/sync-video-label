import { DistractorType, QuestionLevel } from './types';

// Color mapping for distractor types
export const DISTRACTOR_COLORS: Record<DistractorType, string> = {
  lexical: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  scene: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  temporal: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  role: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'cross-video': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  binary: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  count: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  intent: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  causal: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  order: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
};

// Level colors
export const LEVEL_COLORS: Record<QuestionLevel, string> = {
  1: 'bg-emerald-500',
  2: 'bg-amber-500',
  3: 'bg-rose-500',
};

// Level names
export const LEVEL_NAMES: Record<QuestionLevel, string> = {
  1: 'Perception',
  2: 'Temporal',
  3: 'Cross-Video',
};
