'use client';

import { useState, useRef, useEffect, useCallback, MouseEvent } from 'react';
import type { LLMSettings } from './SettingsModal';
import { formatTime, getTimelinePosition } from '../utils/timeline';

interface CustomPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoPath: string;
  videoUrl: string;
  videoDuration: number;
  currentTime: number;
  selectedRange?: { startTime: number; endTime: number } | null;
  llmSettings: LLMSettings;
  onSeek?: (time: number) => void;
}

interface UsageStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export function CustomPromptModal({
  isOpen,
  onClose,
  videoPath,
  videoUrl,
  videoDuration,
  currentTime: externalCurrentTime,
  selectedRange,
  llmSettings,
}: CustomPromptModalProps) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);

  // Time range state - always enabled
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(videoDuration);

  // Mini player state
  const miniVideoRef = useRef<HTMLVideoElement>(null);
  const [miniCurrentTime, setMiniCurrentTime] = useState(0);
  const [isMiniPlaying, setIsMiniPlaying] = useState(false);
  const [isPlayingRange, setIsPlayingRange] = useState(false);

  // Timeline interaction state
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [isDraggingRange, setIsDraggingRange] = useState(false);
  const [rangeStartDragOffset, setRangeStartDragOffset] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  // Initialize time range from selected label if available
  useEffect(() => {
    if (isOpen && selectedRange) {
      setStartTime(selectedRange.startTime);
      setEndTime(selectedRange.endTime);
      // Seek mini player to start of range
      if (miniVideoRef.current) {
        miniVideoRef.current.currentTime = selectedRange.startTime;
      }
    } else if (isOpen) {
      setStartTime(0);
      setEndTime(videoDuration);
    }
  }, [isOpen, selectedRange, videoDuration]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setResponse('');
      setError(null);
      setUsage(null);
      setIsMiniPlaying(false);
      setIsPlayingRange(false);
    }
  }, [isOpen]);

  // Stop at end time when playing range
  useEffect(() => {
    if (isPlayingRange && miniCurrentTime >= endTime) {
      if (miniVideoRef.current) {
        miniVideoRef.current.pause();
        miniVideoRef.current.currentTime = endTime;
      }
      setIsPlayingRange(false);
    }
  }, [miniCurrentTime, endTime, isPlayingRange]);

  // Sync mini player time
  const handleMiniTimeUpdate = useCallback(() => {
    if (miniVideoRef.current) {
      setMiniCurrentTime(miniVideoRef.current.currentTime);
    }
  }, []);

  // Toggle mini player play/pause
  const toggleMiniPlay = useCallback(() => {
    if (miniVideoRef.current) {
      if (isMiniPlaying) {
        miniVideoRef.current.pause();
        setIsPlayingRange(false);
      } else {
        miniVideoRef.current.play();
      }
    }
  }, [isMiniPlaying]);

  // Pause playback
  const pausePlayback = useCallback(() => {
    if (miniVideoRef.current) {
      miniVideoRef.current.pause();
      setIsPlayingRange(false);
    }
  }, []);

  // Seek mini player
  const seekMiniTo = useCallback(
    (time: number) => {
      if (miniVideoRef.current) {
        miniVideoRef.current.currentTime = Math.max(0, Math.min(time, videoDuration));
        setMiniCurrentTime(time);
      }
    },
    [videoDuration]
  );

  // Timeline mouse handlers
  const handleTimelineMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!timelineRef.current || !videoDuration) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickedTime = (x / rect.width) * videoDuration;

      // Check if clicking near start handle (within 10px)
      const startX = (startTime / videoDuration) * rect.width;
      const endX = (endTime / videoDuration) * rect.width;

      if (Math.abs(x - startX) < 10) {
        setIsDraggingStart(true);
        e.preventDefault();
      } else if (Math.abs(x - endX) < 10) {
        setIsDraggingEnd(true);
        e.preventDefault();
      } else if (x > startX && x < endX) {
        // Clicking inside the range - drag the whole range
        setIsDraggingRange(true);
        setRangeStartDragOffset(clickedTime - startTime);
        e.preventDefault();
      } else {
        // Clicking outside - move playhead
        setIsDraggingPlayhead(true);
        seekMiniTo(clickedTime);
      }
    },
    [videoDuration, startTime, endTime, seekMiniTo]
  );

  const handleTimelineMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!timelineRef.current || !videoDuration) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = Math.max(0, Math.min((x / rect.width) * videoDuration, videoDuration));

      if (isDraggingPlayhead) {
        seekMiniTo(time);
      } else if (isDraggingStart) {
        const newStart = Math.floor(Math.max(0, Math.min(time, endTime - 1)));
        setStartTime(newStart);
      } else if (isDraggingEnd) {
        const newEnd = Math.ceil(Math.max(startTime + 1, Math.min(time, videoDuration)));
        setEndTime(newEnd);
      } else if (isDraggingRange) {
        const rangeDuration = endTime - startTime;
        let newStart = Math.floor(time - rangeStartDragOffset);
        newStart = Math.max(0, Math.min(newStart, videoDuration - rangeDuration));
        setStartTime(newStart);
        setEndTime(newStart + rangeDuration);
      }
    },
    [
      videoDuration,
      isDraggingPlayhead,
      isDraggingStart,
      isDraggingEnd,
      isDraggingRange,
      endTime,
      startTime,
      rangeStartDragOffset,
      seekMiniTo,
    ]
  );

  const handleTimelineMouseUp = useCallback(() => {
    setIsDraggingPlayhead(false);
    setIsDraggingStart(false);
    setIsDraggingEnd(false);
    setIsDraggingRange(false);
  }, []);

  // Global mouse up handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDraggingPlayhead(false);
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
      setIsDraggingRange(false);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Generate timeline ticks
  const generateTicks = useCallback(() => {
    const ticks: { time: number; isMajor: boolean }[] = [];
    const tickInterval = videoDuration > 60 ? 10 : videoDuration > 30 ? 5 : 1;
    for (let i = 0; i <= Math.floor(videoDuration); i += tickInterval) {
      ticks.push({ time: i, isMajor: i % (tickInterval * 5) === 0 || tickInterval >= 5 });
    }
    return ticks;
  }, [videoDuration]);

  const handleSubmit = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse('');
    setUsage(null);

    try {
      const requestBody: {
        videoPath: string;
        prompt: string;
        model: string;
        temperature: number;
        startOffset?: number;
        endOffset?: number;
      } = {
        videoPath,
        prompt: prompt.trim(),
        model: llmSettings.model,
        temperature: llmSettings.temperature,
        // Always include time range
        startOffset: startTime,
        endOffset: endTime,
      };

      const res = await fetch('/api/video-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setResponse(data.response);
      setUsage(data.usage);

      // Scroll to response
      setTimeout(() => {
        responseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Play the selected range (starts at startTime and stops at endTime)
  const playRange = useCallback(() => {
    if (miniVideoRef.current) {
      miniVideoRef.current.currentTime = startTime;
      setMiniCurrentTime(startTime);
      setIsPlayingRange(true);
      miniVideoRef.current.play();
    }
  }, [startTime]);

  // Sync with external video
  const syncWithMainVideo = useCallback(() => {
    seekMiniTo(externalCurrentTime);
  }, [externalCurrentTime, seekMiniTo]);

  if (!isOpen) return null;

  const ticks = generateTicks();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Ask AI about Video</h2>
              <p className="text-xs text-slate-500 truncate max-w-md" title={videoPath}>
                {videoPath.split('/').pop()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <svg
              className="w-4 h-4 text-slate-400"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Mini Video Player */}
          <div className="bg-slate-800/50 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Video Preview
                <span className="text-cyan-400 text-[10px] px-1.5 py-0.5 bg-cyan-500/20 rounded">
                  Clip: {formatTime(startTime)} - {formatTime(endTime)}
                </span>
              </label>
              <button
                onClick={syncWithMainVideo}
                className="px-2 py-1 text-[10px] bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                title="Sync with main video position"
              >
                Sync
              </button>
            </div>

            {/* Video Element */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={miniVideoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                onTimeUpdate={handleMiniTimeUpdate}
                onPlay={() => setIsMiniPlaying(true)}
                onPause={() => setIsMiniPlaying(false)}
                onLoadedMetadata={() => {
                  if (miniVideoRef.current && selectedRange) {
                    miniVideoRef.current.currentTime = selectedRange.startTime;
                  }
                }}
              />

              {/* Play/Pause overlay button */}
              <button
                onClick={toggleMiniPlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  {isMiniPlaying ? (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6 text-white ml-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </div>
              </button>

              {/* Time display overlay */}
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white font-mono">
                {formatTime(miniCurrentTime)} / {formatTime(videoDuration)}
              </div>

              {/* Playing range indicator */}
              {isPlayingRange && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-cyan-500/80 rounded text-xs text-white font-medium flex items-center gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Playing Range
                </div>
              )}
            </div>

            {/* Mini Timeline */}
            <div
              ref={timelineRef}
              className="relative h-12 bg-slate-900 rounded-lg cursor-pointer select-none"
              onMouseDown={handleTimelineMouseDown}
              onMouseMove={handleTimelineMouseMove}
              onMouseUp={handleTimelineMouseUp}
            >
              {/* Tick marks */}
              <div className="absolute inset-x-2 top-0 h-4">
                {ticks.map(({ time, isMajor }) => (
                  <div
                    key={time}
                    className="absolute top-0"
                    style={{ left: getTimelinePosition(time, videoDuration) }}
                  >
                    <div
                      className={`w-px ${isMajor ? 'h-3 bg-slate-500' : 'h-1.5 bg-slate-600'}`}
                    />
                    {isMajor && (
                      <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[8px] text-slate-500 whitespace-nowrap">
                        {formatTime(time)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Selected range highlight */}
              <div
                className="absolute top-4 h-6 bg-cyan-500/30 border-y border-cyan-500/50 cursor-move"
                style={{
                  left: `calc(${getTimelinePosition(startTime, videoDuration)} + 8px)`,
                  width: `calc(${((endTime - startTime) / videoDuration) * 100}% - 0px)`,
                }}
              />

              {/* Start handle */}
              <div
                className="absolute top-3 w-3 h-8 bg-cyan-500 rounded-sm cursor-ew-resize flex items-center justify-center hover:bg-cyan-400 transition-colors z-10"
                style={{ left: `calc(${getTimelinePosition(startTime, videoDuration)} + 4px)` }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingStart(true);
                }}
              >
                <div className="w-0.5 h-4 bg-white/50 rounded" />
              </div>

              {/* End handle */}
              <div
                className="absolute top-3 w-3 h-8 bg-cyan-500 rounded-sm cursor-ew-resize flex items-center justify-center hover:bg-cyan-400 transition-colors z-10"
                style={{ left: `calc(${getTimelinePosition(endTime, videoDuration)} + 4px)` }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingEnd(true);
                }}
              >
                <div className="w-0.5 h-4 bg-white/50 rounded" />
              </div>

              {/* Playhead */}
              <div
                className="absolute top-0 w-0.5 h-full bg-amber-400 z-20"
                style={{
                  left: `calc(${getTimelinePosition(miniCurrentTime, videoDuration)} + 8px)`,
                }}
              >
                <svg
                  className="absolute -top-0.5 -left-[4px]"
                  width="10"
                  height="8"
                  viewBox="0 0 10 8"
                >
                  <path d="M5 8L0 0h10L5 8z" fill="#fbbf24" />
                </svg>
              </div>
            </div>

            {/* Time Range Info and Controls */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">Start:</span>
                  <span className="text-cyan-400 font-mono">{formatTime(startTime)}</span>
                  <span className="text-slate-600">({startTime}s)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">End:</span>
                  <span className="text-cyan-400 font-mono">{formatTime(endTime)}</span>
                  <span className="text-slate-600">({endTime}s)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">Duration:</span>
                  <span className="text-white font-mono">{formatTime(endTime - startTime)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Pause button */}
                <button
                  onClick={pausePlayback}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors flex items-center gap-1"
                  title="Pause playback"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                  Pause
                </button>
                {/* Play Range button */}
                <button
                  onClick={playRange}
                  className={`px-2 py-1 rounded text-white transition-colors flex items-center gap-1 ${
                    isPlayingRange
                      ? 'bg-cyan-500 hover:bg-cyan-400'
                      : 'bg-cyan-600 hover:bg-cyan-500'
                  }`}
                  title="Play from start to end of range"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play Range
                </button>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span>Drag handles to adjust range</span>
              <span>•</span>
              <span>Click timeline to seek</span>
              <span>•</span>
              <span>Drag range to move</span>
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Your Prompt</label>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about the video... (e.g., 'What is happening in this scene?', 'Describe the main actions')"
              className="w-full h-24 px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Press <kbd className="px-1 py-0.5 bg-slate-700 rounded text-[9px]">Ctrl</kbd>+
              <kbd className="px-1 py-0.5 bg-slate-700 rounded text-[9px]">Enter</kbd> to send
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Response */}
          {(response || isLoading) && (
            <div ref={responseRef} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">Response</label>
                {usage && (
                  <span className="text-[10px] text-slate-500">
                    {usage.totalTokens.toLocaleString()} tokens
                  </span>
                )}
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 min-h-[100px] max-h-[200px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-slate-400">
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
                    <span className="text-sm">Analyzing video...</span>
                  </div>
                ) : (
                  <div className="text-sm text-slate-200 whitespace-pre-wrap">{response}</div>
                )}
              </div>
            </div>
          )}

          {/* Model Info */}
          <div className="text-[10px] text-slate-500 flex items-center gap-2">
            <span>Model: {llmSettings.model.replace('google/', '')}</span>
            <span>•</span>
            <span>Temp: {llmSettings.temperature}</span>
            <span>•</span>
            <span className="text-cyan-400">
              Clip: {startTime}s - {endTime}s
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900/50 shrink-0">
          <button
            onClick={() => {
              setPrompt('');
              setResponse('');
              setError(null);
              setUsage(null);
            }}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-300 transition-colors"
            disabled={isLoading}
          >
            Clear
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isLoading}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
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
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
