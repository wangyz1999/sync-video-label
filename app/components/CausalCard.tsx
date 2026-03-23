'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { CausalRelation, LabelEntry, EVENT_TYPES } from '../types';

interface CausalCardProps {
  relation: CausalRelation;
  causeLabel: LabelEntry | undefined;
  effectLabel: LabelEntry | undefined;
  availableLabels: LabelEntry[]; // All labels available for selection
  isSelected: boolean;
  showVideoIndex?: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<CausalRelation>) => void;
  onDelete: () => void;
  onSelectCause: () => void;
  onSelectEffect: () => void;
  onSetCauseLabel: (labelId: string) => void;
  onSetEffectLabel: (labelId: string) => void;
}

// Get event info by code
const getEventInfo = (code: string) => EVENT_TYPES.find((e) => e.code === code);

// Format label display text
const formatLabelText = (label: LabelEntry | undefined) => {
  if (!label) return 'Select label...';

  const isAction = label.type === 'SA' || label.type === 'OA';
  const isState = label.type === 'SS' || label.type === 'OS';

  if (isAction) {
    return `${label.caption || '?'}${label.intent ? ` to ${label.intent}` : ''}`;
  } else if (isState) {
    return `${label.caption || '?'}${label.value ? ` is ${label.value}` : ''}`;
  }
  return label.caption || '?';
};

export function CausalCard({
  relation,
  causeLabel,
  effectLabel,
  availableLabels,
  isSelected,
  showVideoIndex = false,
  onSelect,
  onUpdate,
  onDelete,
  onSelectCause,
  onSelectEffect,
  onSetCauseLabel,
  onSetEffectLabel,
}: CausalCardProps) {
  const [distractorInput, setDistractorInput] = useState('');
  const [showDistractorInput, setShowDistractorInput] = useState(false);
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');
  const [showCauseDropdown, setShowCauseDropdown] = useState(false);
  const [showEffectDropdown, setShowEffectDropdown] = useState(false);
  const [causeSearch, setCauseSearch] = useState('');
  const [effectSearch, setEffectSearch] = useState('');
  const causeDropdownRef = useRef<HTMLDivElement>(null);
  const effectDropdownRef = useRef<HTMLDivElement>(null);
  const causeSearchRef = useRef<HTMLInputElement>(null);
  const effectSearchRef = useRef<HTMLInputElement>(null);

  const causeEventInfo = causeLabel ? getEventInfo(causeLabel.type) : null;
  const effectEventInfo = effectLabel ? getEventInfo(effectLabel.type) : null;

  // Filter labels for the same video as the relation
  const labelsForVideo = availableLabels.filter((l) => l.videoIndex === relation.videoIndex);

  // Filter labels by search term
  const filterLabels = (labels: LabelEntry[], search: string) => {
    if (!search.trim()) return labels;
    const searchLower = search.toLowerCase();
    return labels.filter((label) => {
      const text = formatLabelText(label).toLowerCase();
      const type = label.type.toLowerCase();
      return text.includes(searchLower) || type.includes(searchLower);
    });
  };

  const filteredCauseLabels = filterLabels(labelsForVideo, causeSearch);
  const filteredEffectLabels = filterLabels(labelsForVideo, effectSearch);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (showCauseDropdown && causeSearchRef.current) {
      causeSearchRef.current.focus();
    }
  }, [showCauseDropdown]);

  useEffect(() => {
    if (showEffectDropdown && effectSearchRef.current) {
      effectSearchRef.current.focus();
    }
  }, [showEffectDropdown]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (causeDropdownRef.current && !causeDropdownRef.current.contains(event.target as Node)) {
        setShowCauseDropdown(false);
        setCauseSearch('');
      }
      if (effectDropdownRef.current && !effectDropdownRef.current.contains(event.target as Node)) {
        setShowEffectDropdown(false);
        setEffectSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if both labels are selected
  const isMissingLabels = !causeLabel || !effectLabel;

  const handleAddDistractorTag = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const current = relation.causalDistractors || [];
    if (!current.includes(trimmed)) {
      onUpdate({ causalDistractors: [...current, trimmed] });
    }
    setDistractorInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, value: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddDistractorTag(value);
    }
  };

  const removeDistractorTag = (index: number) => {
    const updated = [...(relation.causalDistractors || [])];
    updated.splice(index, 1);
    onUpdate({ causalDistractors: updated });
  };

  const handleEditTag = (index: number) => {
    setEditingTagIndex(index);
    setEditingTagValue(relation.causalDistractors?.[index] || '');
  };

  const handleSaveEditedTag = () => {
    if (editingTagIndex === null) return;
    const trimmed = editingTagValue.trim();
    const updated = [...(relation.causalDistractors || [])];
    if (trimmed) {
      updated[editingTagIndex] = trimmed;
    } else {
      updated.splice(editingTagIndex, 1);
    }
    onUpdate({ causalDistractors: updated });
    setEditingTagIndex(null);
    setEditingTagValue('');
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEditedTag();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingTagIndex(null);
      setEditingTagValue('');
    }
  };

  return (
    <div
      className={`rounded-lg transition-all cursor-pointer ${
        isSelected
          ? 'bg-slate-800 ring-2 ring-amber-500 shadow-lg shadow-amber-500/20'
          : isMissingLabels
            ? 'bg-slate-800/80 ring-2 ring-red-500 shadow-lg shadow-red-500/20'
            : 'bg-slate-800/60 hover:bg-slate-800/80 ring-1 ring-slate-700'
      }`}
      onClick={onSelect}
    >
      <div className="p-2 space-y-1.5">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {showVideoIndex && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300 ring-1 ring-slate-600">
                V{(relation.videoIndex ?? 0) + 1}
              </span>
            )}
            <span className="px-2 py-0.5 rounded text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-teal-500 shadow-sm">
              Causal
            </span>
            {isMissingLabels && (
              <span className="text-xs text-red-400 font-medium">⚠ Select labels</span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
            title="Delete causal relation"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Cause label selector */}
        <div className="relative" ref={causeDropdownRef}>
          <label className="text-[10px] text-slate-500 uppercase tracking-wide">Cause</label>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCauseDropdown(!showCauseDropdown);
              setShowEffectDropdown(false);
              onSelectCause();
            }}
            className={`w-full px-2 py-1 rounded text-left text-xs transition-colors ${
              causeLabel
                ? 'bg-slate-700/50 border border-slate-600 hover:border-cyan-500'
                : 'bg-slate-700/50 border border-dashed border-slate-500 hover:border-cyan-500'
            }`}
          >
            <div className="flex items-center gap-2">
              {causeEventInfo && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                  style={{ backgroundColor: causeEventInfo.color }}
                >
                  {causeLabel?.type}
                </span>
              )}
              <span
                className={causeLabel ? 'text-slate-200 flex-1 truncate' : 'text-slate-500 flex-1'}
              >
                {formatLabelText(causeLabel)}
              </span>
              <svg
                className={`w-3 h-3 text-slate-400 transition-transform ${showCauseDropdown ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </button>
          {/* Cause dropdown */}
          {showCauseDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl">
              {/* Search input */}
              <div className="p-1.5 border-b border-slate-700">
                <input
                  ref={causeSearchRef}
                  type="text"
                  value={causeSearch}
                  onChange={(e) => setCauseSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Escape') {
                      setShowCauseDropdown(false);
                      setCauseSearch('');
                    } else if (e.key === 'Enter' && filteredCauseLabels.length === 1) {
                      const label = filteredCauseLabels[0];
                      if (label.id !== relation.effectId) {
                        onSetCauseLabel(label.id);
                        setShowCauseDropdown(false);
                        setCauseSearch('');
                      }
                    }
                  }}
                  placeholder="Type to filter..."
                  className="w-full px-2 py-1 rounded bg-slate-700/50 border border-slate-600 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              {/* Label list */}
              <div className="max-h-64 overflow-y-auto">
                {labelsForVideo.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-500">No labels available</div>
                ) : filteredCauseLabels.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-500">No matches found</div>
                ) : (
                  filteredCauseLabels.map((label) => {
                    const eventInfo = getEventInfo(label.type);
                    const isCurrentEffect = label.id === relation.effectId;
                    return (
                      <button
                        key={label.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetCauseLabel(label.id);
                          setShowCauseDropdown(false);
                          setCauseSearch('');
                        }}
                        disabled={isCurrentEffect}
                        className={`w-full px-2 py-1.5 text-left text-xs hover:bg-slate-700 transition-colors flex items-center gap-2 ${
                          label.id === relation.causeId ? 'bg-cyan-500/20' : ''
                        } ${isCurrentEffect ? 'opacity-40 cursor-not-allowed' : ''}`}
                        title={isCurrentEffect ? 'Already selected as effect' : undefined}
                      >
                        {eventInfo && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white shrink-0"
                            style={{ backgroundColor: eventInfo.color }}
                          >
                            {label.type}
                          </span>
                        )}
                        <span className="text-slate-200 truncate">{formatLabelText(label)}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Effect label selector */}
        <div className="relative" ref={effectDropdownRef}>
          <label className="text-[10px] text-slate-500 uppercase tracking-wide">Effect</label>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowEffectDropdown(!showEffectDropdown);
              setShowCauseDropdown(false);
              onSelectEffect();
            }}
            className={`w-full px-2 py-1 rounded text-left text-xs transition-colors ${
              effectLabel
                ? 'bg-slate-700/50 border border-slate-600 hover:border-cyan-500'
                : 'bg-slate-700/50 border border-dashed border-slate-500 hover:border-cyan-500'
            }`}
          >
            <div className="flex items-center gap-2">
              {effectEventInfo && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                  style={{ backgroundColor: effectEventInfo.color }}
                >
                  {effectLabel?.type}
                </span>
              )}
              <span
                className={effectLabel ? 'text-slate-200 flex-1 truncate' : 'text-slate-500 flex-1'}
              >
                {formatLabelText(effectLabel)}
              </span>
              <svg
                className={`w-3 h-3 text-slate-400 transition-transform ${showEffectDropdown ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </button>
          {/* Effect dropdown */}
          {showEffectDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl">
              {/* Search input */}
              <div className="p-1.5 border-b border-slate-700">
                <input
                  ref={effectSearchRef}
                  type="text"
                  value={effectSearch}
                  onChange={(e) => setEffectSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Escape') {
                      setShowEffectDropdown(false);
                      setEffectSearch('');
                    } else if (e.key === 'Enter' && filteredEffectLabels.length === 1) {
                      const label = filteredEffectLabels[0];
                      if (label.id !== relation.causeId) {
                        onSetEffectLabel(label.id);
                        setShowEffectDropdown(false);
                        setEffectSearch('');
                      }
                    }
                  }}
                  placeholder="Type to filter..."
                  className="w-full px-2 py-1 rounded bg-slate-700/50 border border-slate-600 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              {/* Label list */}
              <div className="max-h-64 overflow-y-auto">
                {labelsForVideo.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-500">No labels available</div>
                ) : filteredEffectLabels.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-500">No matches found</div>
                ) : (
                  filteredEffectLabels.map((label) => {
                    const eventInfo = getEventInfo(label.type);
                    const isCurrentCause = label.id === relation.causeId;
                    return (
                      <button
                        key={label.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetEffectLabel(label.id);
                          setShowEffectDropdown(false);
                          setEffectSearch('');
                        }}
                        disabled={isCurrentCause}
                        className={`w-full px-2 py-1.5 text-left text-xs hover:bg-slate-700 transition-colors flex items-center gap-2 ${
                          label.id === relation.effectId ? 'bg-cyan-500/20' : ''
                        } ${isCurrentCause ? 'opacity-40 cursor-not-allowed' : ''}`}
                        title={isCurrentCause ? 'Already selected as cause' : undefined}
                      >
                        {eventInfo && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white shrink-0"
                            style={{ backgroundColor: eventInfo.color }}
                          >
                            {label.type}
                          </span>
                        )}
                        <span className="text-slate-200 truncate">{formatLabelText(label)}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Causal Distractors */}
        <div>
          {!showDistractorInput &&
          (!relation.causalDistractors || relation.causalDistractors.length === 0) ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDistractorInput(true);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
              title="Add causal distractor"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Causal Distractor
            </button>
          ) : relation.causalDistractors && relation.causalDistractors.length > 0 ? (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="text-xs text-slate-500">Causal Distractor</label>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDistractorInput(!showDistractorInput);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  title="Add causal distractor"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {relation.causalDistractors.map((tag, idx) =>
                  editingTagIndex === idx ? (
                    <input
                      key={idx}
                      type="text"
                      value={editingTagValue}
                      onChange={(e) => setEditingTagValue(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={handleSaveEditedTag}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 min-w-[120px] px-1.5 py-0.5 bg-cyan-500/30 text-cyan-200 rounded text-xs ring-1 ring-cyan-500 focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded text-xs ring-1 ring-cyan-500/30 cursor-text"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleEditTag(idx);
                      }}
                      title="Double-click to edit"
                    >
                      {tag}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDistractorTag(idx);
                        }}
                        className="hover:text-cyan-200"
                      >
                        <svg
                          className="w-2.5 h-2.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  )
                )}
              </div>
            </div>
          ) : null}

          {showDistractorInput && (
            <input
              type="text"
              value={distractorInput}
              onChange={(e) => setDistractorInput(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, distractorInput)}
              onBlur={() => {
                handleAddDistractorTag(distractorInput);
                setShowDistractorInput(false);
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="Causal distractor (Enter)..."
              className="w-full px-2 py-1 rounded bg-slate-700/50 border border-cyan-500 text-slate-200 text-xs placeholder-slate-500 focus:outline-none"
              autoFocus
            />
          )}
        </div>
      </div>
    </div>
  );
}
