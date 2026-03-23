'use client';

import { QuestionCardProps, Distractor } from './types';
import { LEVEL_COLORS, DISTRACTOR_COLORS } from './constants';
import { TimeBadge } from './TimeBadge';
import { EditableText } from './EditableText';
import { EVENT_TYPES } from '../../types';

/**
 * Individual question card with expandable details and inline editing
 */
export function QuestionCard({
  question,
  index,
  isExpanded,
  onToggle,
  onJumpToTime,
  onQuestionChange,
}: QuestionCardProps) {
  // Handle validation toggle
  const handleValidationToggle = (e: React.MouseEvent, isValid: boolean | undefined) => {
    e.stopPropagation();
    // Cycle: undefined -> true -> false -> undefined
    let newValue: boolean | undefined;
    if (question.isValid === undefined) {
      newValue = true;
    } else if (question.isValid === true) {
      newValue = false;
    } else {
      newValue = undefined;
    }
    if (isValid !== undefined) {
      newValue = isValid;
    }
    onQuestionChange({ isValid: newValue });
  };

  // Handle question text change
  const handleQuestionTextChange = (text: string) => {
    onQuestionChange({ question: text, isEdited: true });
  };

  // Handle answer change
  const handleAnswerChange = (option: string) => {
    onQuestionChange({
      answer: { ...question.answer, option },
      isEdited: true,
    });
  };

  // Handle distractor change
  const handleDistractorChange = (index: number, option: string) => {
    const newDistractors = [...question.distractors];
    newDistractors[index] = { ...newDistractors[index], option };
    onQuestionChange({ distractors: newDistractors, isEdited: true });
  };

  // Handle distractor type change
  const handleDistractorTypeChange = (index: number, type: Distractor['type']) => {
    const newDistractors = [...question.distractors];
    newDistractors[index] = { ...newDistractors[index], type };
    onQuestionChange({ distractors: newDistractors, isEdited: true });
  };

  // Handle distractor delete
  const handleDistractorDelete = (index: number) => {
    const newDistractors = question.distractors.filter((_, i) => i !== index);
    onQuestionChange({ distractors: newDistractors, isEdited: true });
  };

  // Handle add distractor
  const handleAddDistractor = () => {
    const newDistractors: Distractor[] = [
      ...question.distractors,
      { type: 'lexical', option: 'New distractor' },
    ];
    onQuestionChange({ distractors: newDistractors, isEdited: true });
  };

  // Handle toggle distractor from available pool
  const handleToggleDistractor = (distractor: Distractor) => {
    const isSelected = question.distractors.some(
      (d) => d.option === distractor.option && d.type === distractor.type
    );

    if (isSelected) {
      // Remove from selected
      const newDistractors = question.distractors.filter(
        (d) => !(d.option === distractor.option && d.type === distractor.type)
      );
      onQuestionChange({ distractors: newDistractors, isEdited: true });
    } else {
      // Add to selected
      const newDistractors = [...question.distractors, distractor];
      onQuestionChange({ distractors: newDistractors, isEdited: true });
    }
  };

  // Check if a distractor is selected
  const isDistractorSelected = (distractor: Distractor) => {
    return question.distractors.some(
      (d) => d.option === distractor.option && d.type === distractor.type
    );
  };

  // Get validation status color and icon
  const getValidationStatus = () => {
    if (question.isValid === true) {
      return { color: 'bg-emerald-500', icon: '✓', label: 'Valid' };
    } else if (question.isValid === false) {
      return { color: 'bg-red-500', icon: '✗', label: 'Invalid' };
    }
    return { color: 'bg-slate-600', icon: '?', label: 'Not reviewed' };
  };

  const validationStatus = getValidationStatus();

  return (
    <div
      className={`bg-slate-800/50 rounded-lg border transition-colors overflow-hidden ${
        question.isValid === true
          ? 'border-emerald-500/50'
          : question.isValid === false
            ? 'border-red-500/50'
            : 'border-slate-700 hover:border-slate-600'
      }`}
    >
      {/* Question Header */}
      <div className="p-3 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-3">
          {/* Index & Level */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <span className="text-xs text-slate-500 font-mono w-8 text-center">#{index + 1}</span>
            <span
              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white ${LEVEL_COLORS[question.level]}`}
            >
              {question.level}
            </span>
          </div>

          {/* Question Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
                {question.code}
              </span>
              {question.videoIndex !== undefined && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-600 text-slate-400">
                  V{question.videoIndex + 1}
                </span>
              )}
              {question.isEdited && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Edited
                </span>
              )}
              {/* Video context range badge */}
              {question.videoContext && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-pointer hover:bg-amber-500/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    onJumpToTime(
                      question.videoContext!.start,
                      question.videoContext!.end,
                      question.videoIndex
                    );
                  }}
                  title="Video context range - Click to preview"
                >
                  ◐ {Math.floor(question.videoContext.start)}s -{' '}
                  {Math.floor(question.videoContext.end)}s
                </span>
              )}
              {/* Quick time jump for answer */}
              {(question.answer.start !== undefined || question.answer.end !== undefined) && (
                <TimeBadge
                  start={question.answer.start}
                  end={question.answer.end}
                  videoIndex={question.videoIndex}
                  onJump={onJumpToTime}
                />
              )}
            </div>
            <p className="text-sm text-slate-200">{question.question}</p>
          </div>

          {/* Validation toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => handleValidationToggle(e, undefined)}
              className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white ${validationStatus.color} hover:opacity-80 transition-opacity`}
              title={`${validationStatus.label} - Click to cycle`}
            >
              {validationStatus.icon}
            </button>

            {/* Expand indicator */}
            <svg
              className={`w-5 h-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-slate-700/50">
          {/* Editable Question Text */}
          <div className="mt-3 mb-3">
            <label className="text-xs text-slate-500 font-medium mb-1.5 block">Question Text</label>
            <div className="p-2 rounded bg-slate-700/30 border border-slate-600">
              <EditableText
                value={question.question}
                onChange={handleQuestionTextChange}
                className="text-sm text-slate-200"
                multiline
              />
            </div>
          </div>

          {/* Video Context info - editable */}
          {question.videoContext && (
            <div className="mb-3 flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Video Context:</span>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                <input
                  type="number"
                  value={Math.floor(question.videoContext.start)}
                  onChange={(e) => {
                    e.stopPropagation();
                    const newStart = Math.max(0, parseInt(e.target.value) || 0);
                    onQuestionChange({
                      videoContext: { ...question.videoContext!, start: newStart },
                      isEdited: true,
                    });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-12 px-1 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-center border border-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  min={0}
                />
                <span className="text-amber-400">-</span>
                <input
                  type="number"
                  value={Math.floor(question.videoContext.end)}
                  onChange={(e) => {
                    e.stopPropagation();
                    const newEnd = Math.max(
                      question.videoContext!.start + 1,
                      parseInt(e.target.value) || 0
                    );
                    onQuestionChange({
                      videoContext: { ...question.videoContext!, end: newEnd },
                      isEdited: true,
                    });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-12 px-1 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-center border border-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  min={0}
                />
                <span className="text-amber-400 ml-1">s</span>
              </div>
              <span className="text-slate-500">
                ({Math.floor(question.videoContext.end - question.videoContext.start)}s clip)
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onJumpToTime(
                    question.videoContext!.start,
                    question.videoContext!.end,
                    question.videoIndex
                  );
                }}
                className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-medium transition-colors"
                title="Preview context range"
              >
                ▶ Preview
              </button>
            </div>
          )}

          {/* Validation buttons */}
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Validation:</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuestionChange({ isValid: true });
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                question.isValid === true
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-300'
              }`}
            >
              ✓ Valid
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuestionChange({ isValid: false });
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                question.isValid === false
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-red-500/20 hover:text-red-300'
              }`}
            >
              ✗ Invalid
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuestionChange({ isValid: undefined });
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                question.isValid === undefined
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              ? Unreviewed
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Answer */}
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1.5 block">Answer</label>
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <div className="flex-1">
                    <EditableText
                      value={question.answer.option}
                      onChange={handleAnswerChange}
                      className="text-sm text-emerald-200"
                    />
                  </div>
                </div>
                {(question.answer.start !== undefined || question.answer.end !== undefined) && (
                  <TimeBadge
                    start={question.answer.start}
                    end={question.answer.end}
                    videoIndex={question.videoIndex}
                    onJump={onJumpToTime}
                    className="mt-1.5"
                  />
                )}
              </div>
            </div>

            {/* Distractors */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-slate-500 font-medium">
                  Selected Distractors ({question.distractors.length})
                </label>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddDistractor();
                  }}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-400 hover:bg-violet-600 hover:text-white transition-colors"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-1.5">
                {question.distractors.map((d, i) => (
                  <div key={i} className={`p-2 rounded border ${DISTRACTOR_COLORS[d.type]} group`}>
                    <div className="flex items-start gap-2">
                      <select
                        value={d.type}
                        onChange={(e) =>
                          handleDistractorTypeChange(i, e.target.value as Distractor['type'])
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-200 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
                      >
                        <option value="lexical">lexical</option>
                        <option value="scene">scene</option>
                        <option value="temporal">temporal</option>
                        <option value="role">role</option>
                        <option value="cross-video">cross-video</option>
                        <option value="binary">binary</option>
                        <option value="count">count</option>
                        <option value="intent">intent</option>
                        <option value="causal">causal</option>
                      </select>
                      <div className="flex-1 min-w-0">
                        <EditableText
                          value={d.option}
                          onChange={(value) => handleDistractorChange(i, value)}
                          className="text-sm"
                        />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDistractorDelete(i);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                        title="Delete distractor"
                      >
                        <svg
                          className="w-3 h-3"
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
                    </div>
                    {(d.start !== undefined || d.end !== undefined) && (
                      <TimeBadge
                        start={d.start}
                        end={d.end}
                        videoIndex={question.videoIndex}
                        onJump={onJumpToTime}
                        className="mt-1"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* All Available Distractors - Compact View */}
          {question.allDistractors && question.allDistractors.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="text-xs text-slate-500 font-medium">
                    Distractor Pool ({question.allDistractors.length} available)
                  </label>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Click to toggle • {question.distractors.length} selected
                  </p>
                </div>
              </div>

              {/* Group by type for better organization */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {Object.entries(
                  question.allDistractors.reduce(
                    (acc, d) => {
                      if (!acc[d.type]) acc[d.type] = [];
                      acc[d.type].push(d);
                      return acc;
                    },
                    {} as Record<string, typeof question.allDistractors>
                  )
                ).map(([type, distractors]) => (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${DISTRACTOR_COLORS[type as Distractor['type']].replace('bg-', 'text-').replace('/10', '')}`}
                      >
                        {type}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {distractors.filter((d) => isDistractorSelected(d)).length}/
                        {distractors.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {distractors.map((d, i) => {
                        const isSelected = isDistractorSelected(d);
                        return (
                          <button
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleDistractor(d);
                            }}
                            className={`group relative px-2 py-1 rounded text-xs border transition-all ${
                              isSelected
                                ? `${DISTRACTOR_COLORS[d.type]} ring-1 ring-violet-400 font-medium`
                                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                            }`}
                            title={d.option}
                          >
                            <div className="flex items-center gap-1.5">
                              {isSelected && (
                                <svg
                                  className="w-3 h-3 text-violet-400 shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                              <span className="truncate max-w-[200px]">{d.option}</span>
                              {(d.start !== undefined || d.end !== undefined) && (
                                <span className="text-[9px] opacity-60 font-mono shrink-0">
                                  {Math.floor(d.start || 0)}-{Math.floor(d.end || 0)}s
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reference & Target Labels */}
          {(question.referenceLabel || question.targetLabel) && (
            <div className="mt-3 pt-3 border-t border-slate-700/50 grid grid-cols-2 gap-4">
              {question.referenceLabel && (
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1 block">
                    Reference Label
                  </label>
                  <div className="p-2 rounded bg-slate-700/50 text-xs">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                        style={{
                          backgroundColor: EVENT_TYPES.find(
                            (e) => e.code === question.referenceLabel?.type
                          )?.color,
                        }}
                      >
                        {question.referenceLabel.type}
                      </span>
                      <TimeBadge
                        start={question.referenceLabel.start}
                        end={question.referenceLabel.end}
                        videoIndex={question.videoIndex}
                        onJump={onJumpToTime}
                      />
                    </div>
                    <p className="text-slate-300 truncate">{question.referenceLabel.caption}</p>
                  </div>
                </div>
              )}
              {question.targetLabel && (
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1 block">
                    Target Label
                  </label>
                  <div className="p-2 rounded bg-slate-700/50 text-xs">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                        style={{
                          backgroundColor: EVENT_TYPES.find(
                            (e) => e.code === question.targetLabel?.type
                          )?.color,
                        }}
                      >
                        {question.targetLabel.type}
                      </span>
                      <TimeBadge
                        start={question.targetLabel.start}
                        end={question.targetLabel.end}
                        videoIndex={question.videoIndex}
                        onJump={onJumpToTime}
                      />
                    </div>
                    <p className="text-slate-300 truncate">{question.targetLabel.caption}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
