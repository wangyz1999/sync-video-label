'use client';

export interface VideoProgress {
  action: 'pending' | 'loading' | 'done';
  state: 'pending' | 'loading' | 'done';
  world: 'pending' | 'loading' | 'done';
  sceneDistractors: 'pending' | 'loading' | 'done';
  lexicalDistractors: 'pending' | 'loading' | 'done';
}

export interface PredictionProgress {
  isActive: boolean;
  videos: VideoProgress[];
  error?: string;
}

interface PredictionProgressModalProps {
  progress: PredictionProgress;
  instanceName: string;
  onCancel?: () => void;
}

const STEPS = [
  { id: 'action', label: 'Player Actions', shortLabel: 'SA, OA' },
  { id: 'state', label: 'Player States', shortLabel: 'SS, OS' },
  { id: 'world', label: 'World Objects & Events', shortLabel: 'WO, WE' },
  { id: 'sceneDistractors', label: 'Scene Distractors', shortLabel: 'Plausible alternatives' },
  { id: 'lexicalDistractors', label: 'Lexical Distractors', shortLabel: 'Alternative captions' },
] as const;

function StepIndicator({ status }: { status: 'pending' | 'loading' | 'done' }) {
  if (status === 'loading') {
    return (
      <div className="w-5 h-5 flex items-center justify-center">
        <svg className="w-4 h-4 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24">
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
      </div>
    );
  }
  if (status === 'done') {
    return (
      <div className="w-5 h-5 flex items-center justify-center text-emerald-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  // pending
  return (
    <div className="w-5 h-5 flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-slate-600" />
    </div>
  );
}

function VideoCard({
  videoIndex,
  progress,
  totalVideos,
}: {
  videoIndex: number;
  progress: VideoProgress;
  totalVideos: number;
}) {
  const completedSteps = STEPS.filter((s) => progress[s.id] === 'done').length;
  const isComplete = completedSteps === STEPS.length;

  return (
    <div
      className={`rounded-lg border p-3 ${
        isComplete ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-800/50 border-slate-700'
      }`}
    >
      {/* Video header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400">
          Video {videoIndex + 1}
          {totalVideos > 1 ? ` / ${totalVideos}` : ''}
        </span>
        <span className={`text-xs ${isComplete ? 'text-emerald-400' : 'text-slate-500'}`}>
          {completedSteps}/{STEPS.length}
        </span>
      </div>

      {/* Steps */}
      <div className="space-y-1.5">
        {STEPS.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-2 text-xs ${
              progress[step.id] === 'done'
                ? 'text-slate-400'
                : progress[step.id] === 'loading'
                  ? 'text-violet-300'
                  : 'text-slate-500'
            }`}
          >
            <StepIndicator status={progress[step.id]} />
            <span className="truncate">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PredictionProgressModal({
  progress,
  instanceName,
  onCancel,
}: PredictionProgressModalProps) {
  if (!progress.isActive) return null;

  const totalVideos = progress.videos.length;
  const allDone = progress.videos.every(
    (v) =>
      v.action === 'done' &&
      v.state === 'done' &&
      v.world === 'done' &&
      v.sceneDistractors === 'done' &&
      v.lexicalDistractors === 'done'
  );

  // Calculate overall progress
  const totalSteps = totalVideos * 5; // 5 steps per video
  const completedSteps = progress.videos.reduce((sum, v) => {
    return (
      sum +
      (v.action === 'done' ? 1 : 0) +
      (v.state === 'done' ? 1 : 0) +
      (v.world === 'done' ? 1 : 0) +
      (v.sceneDistractors === 'done' ? 1 : 0) +
      (v.lexicalDistractors === 'done' ? 1 : 0)
    );
  }, 0);
  const overallProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                allDone
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
              }`}
            >
              {allDone ? (
                <svg
                  className="w-5 h-5 text-white"
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
              ) : (
                <svg
                  className="w-5 h-5 text-white animate-pulse"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-slate-100">
                {allDone ? 'Prediction Complete' : 'Generating Prediction'}
              </h2>
              <p className="text-xs text-slate-400">{instanceName}</p>
            </div>
            <span className="text-violet-400 font-mono text-sm">{overallProgress}%</span>
          </div>
        </div>

        {/* Progress content */}
        <div className="px-5 py-5 space-y-4">
          {/* Overall progress bar */}
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out ${
                allDone
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
              }`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          {/* Video cards */}
          {totalVideos === 1 ? (
            // Single video - show steps directly
            <div className="space-y-2">
              {STEPS.map((step) => {
                const status = progress.videos[0]?.[step.id] || 'pending';
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                      status === 'loading'
                        ? 'bg-violet-500/10 border border-violet-500/30'
                        : status === 'done'
                          ? 'bg-slate-800/30 border border-transparent'
                          : 'bg-slate-800/20 border border-transparent opacity-60'
                    }`}
                  >
                    <StepIndicator status={status} />
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm ${
                          status === 'loading'
                            ? 'text-violet-300'
                            : status === 'done'
                              ? 'text-slate-300'
                              : 'text-slate-500'
                        }`}
                      >
                        {step.label}
                      </div>
                      <div className="text-xs text-slate-500">{step.shortLabel}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Multiple videos - show cards in grid
            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto">
              {progress.videos.map((videoProgress, idx) => (
                <VideoCard
                  key={idx}
                  videoIndex={idx}
                  progress={videoProgress}
                  totalVideos={totalVideos}
                />
              ))}
            </div>
          )}

          {/* Error message */}
          {progress.error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-red-400 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-300">{progress.error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          {onCancel && !allDone && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
