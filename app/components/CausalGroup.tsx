'use client';

import { useState } from 'react';
import { CausalRelation, LabelEntry } from '../types';
import { CausalCard } from './CausalCard';

interface CausalGroupProps {
  relations: CausalRelation[];
  labels: LabelEntry[];
  selectedRelationId: string | null;
  showVideoIndex?: boolean;
  onSelectRelation: (id: string) => void;
  onUpdateRelation: (id: string, updates: Partial<CausalRelation>) => void;
  onDeleteRelation: (id: string) => void;
  onSelectCauseLabel: (relationId: string) => void;
  onSelectEffectLabel: (relationId: string) => void;
  onSetCauseLabel?: (relationId: string, labelId: string) => void;
  onSetEffectLabel?: (relationId: string, labelId: string) => void;
}

export function CausalGroup({
  relations,
  labels,
  selectedRelationId,
  showVideoIndex = false,
  onSelectRelation,
  onUpdateRelation,
  onDeleteRelation,
  onSelectCauseLabel,
  onSelectEffectLabel,
  onSetCauseLabel,
  onSetEffectLabel,
}: CausalGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (relations.length === 0) return null;

  // Check if any relation is missing labels
  const hasMissingLabels = relations.some((r) => {
    const causeLabel = labels.find((l) => l.id === r.causeId);
    const effectLabel = labels.find((l) => l.id === r.effectId);
    return !causeLabel || !effectLabel;
  });

  const missingCount = relations.filter((r) => {
    const causeLabel = labels.find((l) => l.id === r.causeId);
    const effectLabel = labels.find((l) => l.id === r.effectId);
    return !causeLabel || !effectLabel;
  }).length;

  return (
    <div className="space-y-2">
      {/* Group header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-all ${
          hasMissingLabels
            ? 'bg-red-500/10 hover:bg-red-500/15 ring-1 ring-red-500/30'
            : 'bg-slate-800/40 hover:bg-slate-800/60'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-teal-500 shadow-sm">
            Causal
          </span>
          <span className="text-sm font-medium text-slate-300">Relations</span>
          <span className="text-xs text-slate-500 font-mono">{relations.length}</span>
          {hasMissingLabels && (
            <span className="text-xs text-red-400 font-medium">⚠ {missingCount} incomplete</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Group content */}
      {isExpanded && (
        <div className="pl-2 space-y-2">
          {relations.map((relation) => {
            const causeLabel = labels.find((l) => l.id === relation.causeId);
            const effectLabel = labels.find((l) => l.id === relation.effectId);

            return (
              <CausalCard
                key={relation.id}
                relation={relation}
                causeLabel={causeLabel}
                effectLabel={effectLabel}
                availableLabels={labels}
                isSelected={selectedRelationId === relation.id}
                showVideoIndex={showVideoIndex}
                onSelect={() => onSelectRelation(relation.id)}
                onUpdate={(updates) => onUpdateRelation(relation.id, updates)}
                onDelete={() => onDeleteRelation(relation.id)}
                onSelectCause={() => onSelectCauseLabel(relation.id)}
                onSelectEffect={() => onSelectEffectLabel(relation.id)}
                onSetCauseLabel={(labelId) => onSetCauseLabel?.(relation.id, labelId)}
                onSetEffectLabel={(labelId) => onSetEffectLabel?.(relation.id, labelId)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
