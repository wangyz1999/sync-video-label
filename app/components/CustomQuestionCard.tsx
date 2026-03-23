'use client';

import { CustomQuestion } from '../types';

interface CustomQuestionCardProps {
  question: CustomQuestion;
  isSelected: boolean;
  showVideoIndex?: boolean;
  videoDuration?: number; // Video duration for time range validation
  onSelect: () => void;
  onUpdate: (updates: Partial<CustomQuestion>) => void;
  onDelete: () => void;
  onPlaySegment?: (startTime: number) => void; // Optional: play segment callback
}

export function CustomQuestionCard({
  question,
  isSelected,
  showVideoIndex = false,
  videoDuration = 0,
  onSelect,
  onUpdate,
  onDelete,
  onPlaySegment,
}: CustomQuestionCardProps) {
  // Check if required fields are missing
  const isMissingQuestion = !question.question || question.question.trim() === '';
  const isMissingCorrectOption = !question.correctOption || question.correctOption.trim() === '';
  const hasMissingFields = isMissingQuestion || isMissingCorrectOption;

  const addDistractor = () => {
    onUpdate({
      distractorOptions: [...question.distractorOptions, ''],
    });
  };

  const updateDistractor = (index: number, value: string) => {
    const newDistractors = [...question.distractorOptions];
    newDistractors[index] = value;
    onUpdate({ distractorOptions: newDistractors });
  };

  const removeDistractor = (index: number) => {
    const newDistractors = question.distractorOptions.filter((_, i) => i !== index);
    onUpdate({ distractorOptions: newDistractors });
  };

  return (
    <div
      className={`rounded-lg transition-all cursor-pointer ${
        isSelected
          ? 'bg-slate-800 ring-2 ring-amber-500 shadow-lg shadow-amber-500/20'
          : hasMissingFields
            ? 'bg-slate-800/80 ring-2 ring-red-500 shadow-lg shadow-red-500/20'
            : 'bg-slate-800/60 hover:bg-slate-800/80 ring-1 ring-slate-600'
      }`}
      onClick={onSelect}
    >
      <div className="p-2 space-y-1.5">
        {/* Header row: Badge, multi-video checkbox, time range, delete */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap py-1">
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            {showVideoIndex && (
              <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300 ring-1 ring-slate-600 shrink-0">
                V{(question.videoIndex ?? 0) + 1}
              </span>
            )}
            {/* Custom Question badge */}
            <span
              className="px-1 py-0.5 rounded text-[10px] font-bold bg-purple-500 text-white ring-1 ring-purple-600 flex items-center gap-0.5 shrink-0"
              title="Custom Question"
            >
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              CUSTOM
            </span>
            {/* Multi-video checkbox */}
            <label className="flex items-center gap-0.5 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={question.isMultiVideo || false}
                onChange={(e) => {
                  onUpdate({ isMultiVideo: e.target.checked });
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs text-slate-400">multi video</span>
            </label>
            {/* Time Range */}
            {videoDuration > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  min={0}
                  max={question.endTime !== undefined ? question.endTime - 1 : videoDuration}
                  step={1}
                  value={question.startTime ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : parseInt(e.target.value) || 0;
                    onUpdate({ startTime: val });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Start"
                  className="w-12 px-1 py-0.5 rounded bg-slate-700/50 border border-slate-600 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs text-slate-500">-</span>
                <input
                  type="number"
                  min={question.startTime !== undefined ? question.startTime + 1 : 0}
                  max={videoDuration}
                  step={1}
                  value={question.endTime ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : parseInt(e.target.value) || 0;
                    onUpdate({ endTime: val });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="End"
                  className="w-12 px-1 py-0.5 rounded bg-slate-700/50 border border-slate-600 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                {question.startTime !== undefined && onPlaySegment && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlaySegment(question.startTime!);
                    }}
                    className="p-0.5 rounded text-xs text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center shrink-0"
                    title="Play segment"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}
            {hasMissingFields && (
              <span className="text-xs text-red-400 font-medium shrink-0">⚠</span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-0.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors shrink-0"
            title="Delete question"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Question text */}
        <div>
          <textarea
            value={question.question}
            onChange={(e) => onUpdate({ question: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder="Enter question text..."
            rows={1}
            className={`w-full px-1.5 py-0.5 rounded bg-slate-700/50 border text-slate-200 text-xs placeholder-slate-500 focus:outline-none resize-none ${
              isMissingQuestion
                ? 'border-red-500 focus:border-red-400'
                : 'border-slate-600 focus:border-amber-500'
            }`}
          />
        </div>

        {/* Correct Option */}
        <div>
          <label className="block text-xs text-slate-400 mb-0.5">Correct Option</label>
          <input
            type="text"
            value={question.correctOption}
            onChange={(e) => onUpdate({ correctOption: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder="Enter correct answer..."
            className={`w-full px-1.5 py-0.5 rounded bg-slate-700/50 border text-slate-200 text-xs placeholder-slate-500 focus:outline-none ${
              isMissingCorrectOption
                ? 'border-red-500 focus:border-red-400'
                : 'border-slate-600 focus:border-amber-500'
            }`}
          />
        </div>

        {/* Distractor Options */}
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="block text-xs text-slate-400">Distractors</label>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addDistractor();
              }}
              className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors flex items-center gap-1"
              title="Add distractor"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
          <div className="space-y-1">
            {question.distractorOptions.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No distractors yet</p>
            ) : (
              question.distractorOptions.map((distractor, index) => (
                <div key={index} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={distractor}
                    onChange={(e) => updateDistractor(index, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder={`Distractor ${index + 1}...`}
                    className="flex-1 px-1.5 py-0.5 rounded bg-slate-700/50 border border-slate-600 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDistractor(index);
                    }}
                    className="p-0.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                    title="Remove distractor"
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
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
