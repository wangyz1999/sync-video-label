'use client';

interface HeaderProps {
  onImportPrediction: () => void;
  onGeneratePrediction: () => void;
  onBatchGenerate: () => void;
  onSaveAnnotation: () => void;
  onPreviewQuestions: () => void;
  onShowInstructions: () => void;
  onShowSettings: () => void;
  onAskAI: () => void;
  canSave: boolean;
  canImportPrediction: boolean;
  canGeneratePrediction: boolean;
  canBatchGenerate: boolean;
  canAskAI: boolean;
  isGenerating: boolean;
}

export function Header({
  onImportPrediction,
  onGeneratePrediction,
  onBatchGenerate,
  onSaveAnnotation,
  onPreviewQuestions,
  onShowInstructions,
  onShowSettings,
  onAskAI,
  canSave,
  canImportPrediction,
  canGeneratePrediction,
  canBatchGenerate,
  canAskAI,
  isGenerating,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
          GameplayQA Multi-Video Timeline Captioner
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {/* Settings button */}
        <button
          onClick={onShowSettings}
          className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
          title="AI Settings"
        >
          <svg
            className="w-5 h-5 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        <button
          onClick={onShowInstructions}
          className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
          title="Instructions"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
        <div className="w-px h-6 bg-slate-700" />

        {/* Ask AI button */}
        <button
          onClick={onAskAI}
          disabled={!canAskAI}
          className="px-3 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-600 flex items-center gap-1.5"
          title={canAskAI ? 'Ask AI about the current video' : 'Load a video first'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <span className="whitespace-nowrap">Ask AI</span>
        </button>

        {/* Generate Prediction button */}
        <button
          onClick={onGeneratePrediction}
          disabled={!canGeneratePrediction || isGenerating}
          className="px-3 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-600 flex items-center gap-1.5"
          title={
            canGeneratePrediction
              ? 'Generate AI prediction for current instance'
              : 'Load a project first'
          }
        >
          {isGenerating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="whitespace-nowrap">Generating...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <span className="whitespace-nowrap">Generate</span>
            </>
          )}
        </button>

        {/* Batch Generate button */}
        <button
          onClick={onBatchGenerate}
          disabled={!canBatchGenerate}
          className="px-3 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-600 flex items-center gap-1.5"
          title={
            canBatchGenerate
              ? 'Generate predictions for multiple instances'
              : 'Load a project first'
          }
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <span className="whitespace-nowrap">Batch</span>
        </button>

        <button
          onClick={onImportPrediction}
          className="px-3 py-2 text-sm font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          disabled={!canImportPrediction}
          title={
            canImportPrediction ? 'Load prediction for current instance' : 'Load a project first'
          }
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="whitespace-nowrap">Import</span>
        </button>
        <button
          onClick={onSaveAnnotation}
          className="px-3 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          disabled={!canSave}
          title={canSave ? 'Save annotation to file' : 'Add labels to save'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
          <span className="whitespace-nowrap">Save</span>
        </button>
        <button
          onClick={onPreviewQuestions}
          className="px-3 py-2 text-sm font-medium rounded-lg bg-violet-600 hover:bg-violet-500 transition-colors flex items-center gap-1.5"
          title="Preview Questions"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="whitespace-nowrap">Preview</span>
        </button>
      </div>
    </header>
  );
}
