'use client';

import { useState, KeyboardEvent } from 'react';
import { LabelEntry, EventTypeInfo } from '../types';

interface LabelCardProps {
  label: LabelEntry;
  eventInfo: EventTypeInfo;
  isSelected: boolean;
  isFocused?: boolean; // When true, shows a highlight animation
  videoDuration: number;
  showVideoIndex?: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<LabelEntry>) => void;
  onDelete: () => void;
  onMarkAsSceneDistractor?: () => void;
  onPlaySegment?: (startTime: number) => void;
}

// Check if the event type is an action type (SA or OA)
const isActionType = (type: string) => type === 'SA' || type === 'OA';
// Check if the event type is a state type (SS or OS)
const isStateType = (type: string) => type === 'SS' || type === 'OS';
// Check if the event type is an "other" type (OA or OS)
const isOtherType = (type: string) => type === 'OA' || type === 'OS';

export function LabelCard({
  label,
  eventInfo,
  isSelected,
  isFocused = false,
  videoDuration,
  showVideoIndex = false,
  onSelect,
  onUpdate,
  onDelete,
  onMarkAsSceneDistractor,
  onPlaySegment,
}: LabelCardProps) {
  const [lexicalInput, setLexicalInput] = useState('');
  const [showLexicalInput, setShowLexicalInput] = useState(false);
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');

  // Intent distractor state (for SA/OA)
  const [intentInput, setIntentInput] = useState('');
  const [showIntentInput, setShowIntentInput] = useState(false);
  const [editingIntentTagIndex, setEditingIntentTagIndex] = useState<number | null>(null);
  const [editingIntentTagValue, setEditingIntentTagValue] = useState('');

  // Local state for number inputs to allow empty/partial input during editing
  const [startTimeInput, setStartTimeInput] = useState<string | null>(null);
  const [endTimeInput, setEndTimeInput] = useState<string | null>(null);
  const [quantityInput, setQuantityInput] = useState<string | null>(null);

  // Check if caption is missing (for action/state types, check the appropriate fields)
  const isMissingCaption = !label.caption || label.caption.trim() === '';
  // Intent and value are optional, so no missing check needed
  // Overall missing status - only caption is required
  const hasMissingFields = isMissingCaption;

  const handleAddLexicalTag = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const current = label.lexicalDistractors || [];
    if (!current.includes(trimmed)) {
      onUpdate({ lexicalDistractors: [...current, trimmed] });
    }
    setLexicalInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, value: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLexicalTag(value);
    }
  };

  const removeLexicalTag = (index: number) => {
    const updated = [...(label.lexicalDistractors || [])];
    updated.splice(index, 1);
    onUpdate({ lexicalDistractors: updated });
  };

  const handleEditTag = (index: number) => {
    setEditingTagIndex(index);
    setEditingTagValue(label.lexicalDistractors?.[index] || '');
  };

  const handleSaveEditedTag = () => {
    if (editingTagIndex === null) return;
    const trimmed = editingTagValue.trim();
    const updated = [...(label.lexicalDistractors || [])];
    if (trimmed) {
      updated[editingTagIndex] = trimmed;
    } else {
      updated.splice(editingTagIndex, 1);
    }
    onUpdate({ lexicalDistractors: updated });
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

  // Intent distractor handlers (for SA/OA)
  const handleAddIntentTag = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const current = label.intentDistractors || [];
    if (!current.includes(trimmed)) {
      onUpdate({ intentDistractors: [...current, trimmed] });
    }
    setIntentInput('');
  };

  const handleIntentKeyDown = (e: KeyboardEvent<HTMLInputElement>, value: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIntentTag(value);
    }
  };

  const removeIntentTag = (index: number) => {
    const updated = [...(label.intentDistractors || [])];
    updated.splice(index, 1);
    onUpdate({ intentDistractors: updated });
  };

  const handleEditIntentTag = (index: number) => {
    setEditingIntentTagIndex(index);
    setEditingIntentTagValue(label.intentDistractors?.[index] || '');
  };

  const handleSaveEditedIntentTag = () => {
    if (editingIntentTagIndex === null) return;
    const trimmed = editingIntentTagValue.trim();
    const updated = [...(label.intentDistractors || [])];
    if (trimmed) {
      updated[editingIntentTagIndex] = trimmed;
    } else {
      updated.splice(editingIntentTagIndex, 1);
    }
    onUpdate({ intentDistractors: updated });
    setEditingIntentTagIndex(null);
    setEditingIntentTagValue('');
  };

  const handleEditIntentKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEditedIntentTag();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingIntentTagIndex(null);
      setEditingIntentTagValue('');
    }
  };

  return (
    <div
      className={`rounded-lg transition-all cursor-pointer ${
        isSelected
          ? 'bg-slate-800 ring-2 ring-amber-500 shadow-lg shadow-amber-500/20'
          : isFocused
            ? 'bg-slate-800 ring-2 ring-cyan-400 shadow-lg shadow-cyan-400/30 animate-pulse'
            : hasMissingFields
              ? 'bg-slate-800/80 ring-2 ring-red-500 shadow-lg shadow-red-500/20'
              : 'bg-slate-800/60 hover:bg-slate-800/80 ring-1 ring-slate-700'
      }`}
      onClick={onSelect}
    >
      <div className="p-2.5 space-y-1.5">
        {/* Header row: Type badge, time, qty, delete */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {showVideoIndex && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300 ring-1 ring-slate-600">
                V{(label.videoIndex ?? 0) + 1}
              </span>
            )}
            <span
              className="px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: eventInfo.color }}
            >
              {label.type}
            </span>
            {/* Other input for OA/OS types */}
            {isOtherType(label.type) && (
              <input
                type="text"
                value={label.other || ''}
                onChange={(e) => onUpdate({ other: e.target.value || undefined })}
                onClick={(e) => e.stopPropagation()}
                placeholder="who?"
                className={`w-18 px-1.5 py-0.5 rounded text-xs font-medium border focus:outline-none ${
                  !label.other
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 placeholder-amber-400/60'
                    : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                }`}
                title="Describe who (e.g., teammate, enemy, NPC, boss)"
              />
            )}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500">Start</span>
              <input
                type="number"
                min={0}
                max={label.endTime - 1}
                value={startTimeInput !== null ? startTimeInput : label.startTime}
                onChange={(e) => {
                  setStartTimeInput(e.target.value);
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) {
                    const clamped = Math.max(0, Math.min(val, label.endTime - 1));
                    onUpdate({ startTime: clamped });
                  }
                  setStartTimeInput(null);
                }}
                onFocus={(e) => {
                  setStartTimeInput(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-6 px-1 py-0.5 rounded bg-slate-700/50 border border-slate-600 text-slate-300 text-xs focus:border-amber-500 focus:outline-none hover:border-slate-500"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500">End</span>
              <input
                type="number"
                min={label.startTime + 1}
                max={Math.floor(videoDuration)}
                value={endTimeInput !== null ? endTimeInput : label.endTime}
                onChange={(e) => {
                  setEndTimeInput(e.target.value);
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) {
                    const clamped = Math.max(
                      label.startTime + 1,
                      Math.min(val, Math.floor(videoDuration))
                    );
                    onUpdate({ endTime: clamped });
                  }
                  setEndTimeInput(null);
                }}
                onFocus={(e) => {
                  setEndTimeInput(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-6 px-1 py-0.5 rounded bg-slate-700/50 border border-slate-600 text-slate-300 text-xs focus:border-amber-500 focus:outline-none hover:border-slate-500"
              />
            </div>
            {label.type === 'WO' && (
              <>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">Count</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={quantityInput !== null ? quantityInput : (label.quantity ?? 1)}
                    onChange={(e) => {
                      setQuantityInput(e.target.value);
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1 && Number.isInteger(val)) {
                        onUpdate({ quantity: val });
                      }
                      setQuantityInput(null);
                    }}
                    onFocus={(e) => {
                      setQuantityInput(e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-6 px-1 py-0.5 rounded bg-slate-700/50 border border-slate-600 text-slate-300 text-xs focus:border-amber-500 focus:outline-none hover:border-slate-500"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <label
                    className="flex items-center gap-1.5 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={label.isCountable !== false}
                      onChange={(e) => {
                        onUpdate({ isCountable: e.target.checked });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-700/50 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer"
                      title="Whether this object can be counted in questions"
                    />
                    <span className="text-slate-500">Countable</span>
                  </label>
                </div>
              </>
            )}
            {/* Play segment button */}
            {onPlaySegment && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlaySegment(label.startTime);
                }}
                className="p-1 rounded text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
                title="Play segment"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5.14v14l11-7z" />
                </svg>
              </button>
            )}
            {hasMissingFields && (
              <span className="text-xs text-red-400 font-medium">⚠ Required</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onMarkAsSceneDistractor && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsSceneDistractor();
                }}
                className="p-1 rounded text-slate-500 hover:bg-orange-500/20 hover:text-orange-400 transition-colors"
                title="Mark as Scene Distractor"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
              title="Delete label"
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
        </div>

        {/* Caption - split for action/state types, single line for others */}
        <div className="min-w-0">
          {isActionType(label.type) ? (
            // Action types (SA/OA): action "to" intent
            <div className="flex items-center gap-1 min-w-0">
              <input
                type="text"
                value={label.caption}
                onChange={(e) => onUpdate({ caption: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                placeholder="action..."
                className={`flex-1 min-w-0 px-2 py-1 rounded bg-slate-700/50 border text-slate-200 text-xs placeholder-slate-500 focus:outline-none ${
                  isMissingCaption
                    ? 'border-red-500 focus:border-red-400'
                    : 'border-slate-600 focus:border-amber-500'
                }`}
              />
              <span className="text-xs text-slate-500 font-medium px-1 shrink-0">to</span>
              <input
                type="text"
                value={label.intent || ''}
                onChange={(e) => onUpdate({ intent: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                placeholder="intent..."
                className="flex-1 min-w-0 px-2 py-1 rounded bg-slate-700/50 border border-slate-600 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          ) : isStateType(label.type) ? (
            // State types (SS/OS): variable "is" value
            <div className="flex items-center gap-1 min-w-0">
              <input
                type="text"
                value={label.caption}
                onChange={(e) => onUpdate({ caption: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                placeholder="variable..."
                className={`flex-1 min-w-0 px-2 py-1 rounded bg-slate-700/50 border text-slate-200 text-xs placeholder-slate-500 focus:outline-none ${
                  isMissingCaption
                    ? 'border-red-500 focus:border-red-400'
                    : 'border-slate-600 focus:border-amber-500'
                }`}
              />
              <span className="text-xs text-slate-500 font-medium px-1 shrink-0">is</span>
              <input
                type="text"
                value={label.value || ''}
                onChange={(e) => onUpdate({ value: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                placeholder="value..."
                className="flex-1 min-w-0 px-2 py-1 rounded bg-slate-700/50 border border-slate-600 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          ) : (
            // Other types (WO/WE): single caption
            <input
              type="text"
              value={label.caption}
              onChange={(e) => onUpdate({ caption: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              placeholder={`${eventInfo.fullName} caption...`}
              className={`w-full px-2 py-1 rounded bg-slate-700/50 border text-slate-200 text-xs placeholder-slate-500 focus:outline-none ${
                isMissingCaption
                  ? 'border-red-500 focus:border-red-400'
                  : 'border-slate-600 focus:border-amber-500'
              }`}
            />
          )}
        </div>

        {/* Lexical Distractors */}
        <div>
          {!showLexicalInput &&
          (!label.lexicalDistractors || label.lexicalDistractors.length === 0) ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLexicalInput(true);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
              title="Add lexical distractor"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Lexical Distractor
            </button>
          ) : label.lexicalDistractors && label.lexicalDistractors.length > 0 ? (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="text-xs text-slate-500">Lexical Distractor</label>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLexicalInput(!showLexicalInput);
                  }}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  title="Add lexical distractor"
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
                {label.lexicalDistractors.map((tag, idx) =>
                  editingTagIndex === idx ? (
                    <input
                      key={idx}
                      type="text"
                      value={editingTagValue}
                      onChange={(e) => setEditingTagValue(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={handleSaveEditedTag}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 min-w-[120px] px-1.5 py-0.5 bg-blue-500/30 text-blue-200 rounded text-xs ring-1 ring-blue-500 focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs ring-1 ring-blue-500/30 cursor-text"
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
                          removeLexicalTag(idx);
                        }}
                        className="hover:text-blue-200"
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

          {showLexicalInput && (
            <input
              type="text"
              value={lexicalInput}
              onChange={(e) => setLexicalInput(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, lexicalInput)}
              onBlur={() => {
                handleAddLexicalTag(lexicalInput);
                setShowLexicalInput(false);
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="Lexical (Enter)..."
              className="w-full px-2 py-1 rounded bg-slate-700/50 border border-blue-500 text-slate-200 text-xs placeholder-slate-500 focus:outline-none"
              autoFocus
            />
          )}
        </div>

        {/* Intent Distractors - only for SA/OA types */}
        {isActionType(label.type) && (
          <div>
            {!showIntentInput &&
            (!label.intentDistractors || label.intentDistractors.length === 0) ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowIntentInput(true);
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
                title="Add intent distractor"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Intent Distractor
              </button>
            ) : label.intentDistractors && label.intentDistractors.length > 0 ? (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <label className="text-xs text-slate-500">Intent Distractor</label>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowIntentInput(!showIntentInput);
                    }}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                    title="Add intent distractor"
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
                  {label.intentDistractors.map((tag, idx) =>
                    editingIntentTagIndex === idx ? (
                      <input
                        key={idx}
                        type="text"
                        value={editingIntentTagValue}
                        onChange={(e) => setEditingIntentTagValue(e.target.value)}
                        onKeyDown={handleEditIntentKeyDown}
                        onBlur={handleSaveEditedIntentTag}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 min-w-[120px] px-1.5 py-0.5 bg-purple-500/30 text-purple-200 rounded text-xs ring-1 ring-purple-500 focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs ring-1 ring-purple-500/30 cursor-text"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleEditIntentTag(idx);
                        }}
                        title="Double-click to edit"
                      >
                        {tag}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeIntentTag(idx);
                          }}
                          className="hover:text-purple-200"
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

            {showIntentInput && (
              <input
                type="text"
                value={intentInput}
                onChange={(e) => setIntentInput(e.target.value)}
                onKeyDown={(e) => handleIntentKeyDown(e, intentInput)}
                onBlur={() => {
                  handleAddIntentTag(intentInput);
                  setShowIntentInput(false);
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Intent distractor (Enter)..."
                className="w-full px-2 py-1 rounded bg-slate-700/50 border border-purple-500 text-slate-200 text-xs placeholder-slate-500 focus:outline-none"
                autoFocus
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
