'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { VideoPreviewProps } from './types';
import { formatTime, getVideoUrl } from './utils';

/**
 * Video preview panel with playback controls, auto-stop at end time,
 * and draggable video context range
 */
export function VideoPreview({
  videos,
  previewVideoIndex,
  onVideoIndexChange,
  videoRef,
  isPlaying,
  currentTime,
  duration,
  playbackStartTime,
  playbackEndTime,
  videoContextStart,
  videoContextEnd,
  onPlayPause,
  onSeek,
  onTimeUpdate,
  onLoadedMetadata,
  onPlayStateChange,
  onClearPlaybackRange,
  onVideoContextChange,
}: VideoPreviewProps) {
  const currentVideo = videos[previewVideoIndex];
  const endTimeRef = useRef<number | null>(playbackEndTime);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Drag state for context handles
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);

  // Immediately update end time ref when prop changes
  useEffect(() => {
    endTimeRef.current = playbackEndTime;
  }, [playbackEndTime]);

  // Monitor playback and stop at end time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdateWithStop = () => {
      onTimeUpdate();

      // Check if we need to stop at end time
      if (endTimeRef.current !== null && video.currentTime >= endTimeRef.current) {
        video.pause();
        onPlayStateChange(false);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdateWithStop);
    return () => video.removeEventListener('timeupdate', handleTimeUpdateWithStop);
  }, [videoRef, onTimeUpdate, onPlayStateChange]);

  // Handle drag for context range
  const handleMouseDown = useCallback(
    (handle: 'start' | 'end') => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(handle);
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !timelineRef.current || !onVideoContextChange) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      const time = percent * duration;

      if (isDragging === 'start') {
        const newStart = Math.min(time, (videoContextEnd ?? duration) - 1);
        onVideoContextChange(Math.max(0, newStart), videoContextEnd ?? duration);
      } else {
        const newEnd = Math.max(time, (videoContextStart ?? 0) + 1);
        onVideoContextChange(videoContextStart ?? 0, Math.min(duration, newEnd));
      }
    },
    [isDragging, duration, videoContextStart, videoContextEnd, onVideoContextChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  // Add/remove mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Calculate positions for timeline markers
  const startPercent =
    playbackStartTime !== null && duration > 0 ? (playbackStartTime / duration) * 100 : null;
  const endPercent =
    playbackEndTime !== null && duration > 0 ? (playbackEndTime / duration) * 100 : null;
  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Video context markers (above timeline)
  const contextStartPercent =
    videoContextStart !== null && duration > 0 ? (videoContextStart / duration) * 100 : null;
  const contextEndPercent =
    videoContextEnd !== null && duration > 0 ? (videoContextEnd / duration) * 100 : null;

  return (
    <div className="flex-1 flex flex-col bg-slate-900/50 min-w-0">
      {/* Video selector tabs */}
      {videos.length > 1 && (
        <div className="flex border-b border-slate-700 shrink-0">
          {videos.map((video, idx) => (
            <button
              key={idx}
              onClick={() => onVideoIndexChange(idx)}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                previewVideoIndex === idx
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              Video {idx + 1}
            </button>
          ))}
        </div>
      )}

      {/* Video container */}
      <div className="flex-1 flex flex-col p-3 gap-3 min-h-0">
        <div className="relative bg-black rounded-lg overflow-hidden flex-1 min-h-0">
          <video
            ref={videoRef}
            src={getVideoUrl(currentVideo?.path || '', currentVideo?.url)}
            className="w-full h-full object-contain"
            onLoadedMetadata={onLoadedMetadata}
            onPlay={() => onPlayStateChange(true)}
            onPause={() => onPlayStateChange(false)}
            onEnded={() => onPlayStateChange(false)}
          />

          {/* Current time overlay */}
          <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/70 text-xs font-mono text-white">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Video context indicator */}
          {videoContextStart !== null && videoContextEnd !== null && (
            <div className="absolute top-2 right-2 px-2 py-1 rounded bg-amber-600/80 text-xs font-mono text-white">
              Context: {formatTime(videoContextStart)} - {formatTime(videoContextEnd)}
            </div>
          )}

          {/* Playing range indicator */}
          {playbackStartTime !== null && playbackEndTime !== null && (
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-violet-600/80 text-xs font-mono text-white">
              Target: {formatTime(playbackStartTime)} → {formatTime(playbackEndTime)}
            </div>
          )}
        </div>

        {/* Video controls */}
        <div className="shrink-0 space-y-1">
          {/* Video context markers above timeline */}
          {(contextStartPercent !== null || contextEndPercent !== null) && (
            <div className="relative h-4 text-[9px] font-mono mb-1">
              {/* Context start marker */}
              {contextStartPercent !== null && (
                <div
                  className="absolute bottom-0 flex flex-col items-center"
                  style={{ left: `${contextStartPercent}%`, transform: 'translateX(-50%)' }}
                >
                  <span className="text-amber-400 whitespace-nowrap">
                    {formatTime(videoContextStart!)}
                  </span>
                  <div className="w-0.5 h-1.5 bg-amber-500" />
                </div>
              )}

              {/* Context end marker */}
              {contextEndPercent !== null && (
                <div
                  className="absolute bottom-0 flex flex-col items-center"
                  style={{ left: `${contextEndPercent}%`, transform: 'translateX(-50%)' }}
                >
                  <span className="text-amber-400 whitespace-nowrap">
                    {formatTime(videoContextEnd!)}
                  </span>
                  <div className="w-0.5 h-1.5 bg-amber-500" />
                </div>
              )}
            </div>
          )}

          {/* Timeline scrubber with custom styling */}
          <div className="relative h-5" ref={timelineRef}>
            {/* Track background */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 bg-slate-700 rounded-lg overflow-hidden">
              {/* Video context range highlight (amber) */}
              {contextStartPercent !== null && contextEndPercent !== null && (
                <div
                  className="absolute inset-y-0 bg-amber-500/25 border-x border-amber-500/50"
                  style={{
                    left: `${contextStartPercent}%`,
                    width: `${contextEndPercent - contextStartPercent}%`,
                  }}
                />
              )}

              {/* Selected playback range highlight (purple, on top of context) */}
              {startPercent !== null && endPercent !== null && (
                <div
                  className="absolute inset-y-0 bg-violet-500/40"
                  style={{
                    left: `${startPercent}%`,
                    width: `${endPercent - startPercent}%`,
                  }}
                />
              )}
            </div>

            {/* Draggable context start handle */}
            {contextStartPercent !== null && onVideoContextChange && (
              <div
                className={`absolute top-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center z-10 ${isDragging === 'start' ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                style={{ left: `${contextStartPercent}%`, transform: 'translateX(-50%)' }}
                onMouseDown={handleMouseDown('start')}
              >
                <div
                  className={`w-1.5 h-4 rounded-sm ${isDragging === 'start' ? 'bg-amber-400' : 'bg-amber-500'} shadow-lg`}
                />
              </div>
            )}

            {/* Draggable context end handle */}
            {contextEndPercent !== null && onVideoContextChange && (
              <div
                className={`absolute top-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center z-10 ${isDragging === 'end' ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                style={{ left: `${contextEndPercent}%`, transform: 'translateX(-50%)' }}
                onMouseDown={handleMouseDown('end')}
              >
                <div
                  className={`w-1.5 h-4 rounded-sm ${isDragging === 'end' ? 'bg-amber-400' : 'bg-amber-500'} shadow-lg`}
                />
              </div>
            )}

            {/* Current time indicator (vertical bar) - positioned relative to track */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-violet-400 pointer-events-none z-5"
              style={{
                left: `${currentPercent}%`,
                transform: 'translateX(-50%)',
              }}
            />

            {/* Invisible range input for interaction */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0"
            />
          </div>

          {/* Start/End markers below timeline */}
          {(startPercent !== null || endPercent !== null) && (
            <div className="relative h-4 text-[9px] font-mono">
              {/* Start marker */}
              {startPercent !== null && (
                <div
                  className="absolute flex flex-col items-center"
                  style={{ left: `${startPercent}%`, transform: 'translateX(-50%)' }}
                >
                  <div className="w-0.5 h-1.5 bg-emerald-500" />
                  <span className="text-emerald-400 whitespace-nowrap">
                    {formatTime(playbackStartTime!)}
                  </span>
                </div>
              )}

              {/* End marker */}
              {endPercent !== null && (
                <div
                  className="absolute flex flex-col items-center"
                  style={{ left: `${endPercent}%`, transform: 'translateX(-50%)' }}
                >
                  <div className="w-0.5 h-1.5 bg-red-500" />
                  <span className="text-red-400 whitespace-nowrap">
                    {formatTime(playbackEndTime!)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Playback controls */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {/* Skip back 5s */}
            <button
              onClick={() => onSeek(Math.max(0, currentTime - 5))}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
              title="Back 5 seconds"
            >
              <svg
                className="w-4 h-4 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
                />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={onPlayPause}
              className="p-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors"
            >
              {isPlaying ? (
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
                    d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
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
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </button>

            {/* Skip forward 5s */}
            <button
              onClick={() => onSeek(Math.min(duration, currentTime + 5))}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
              title="Forward 5 seconds"
            >
              <svg
                className="w-4 h-4 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
                />
              </svg>
            </button>

            {/* Clear playback range */}
            {(playbackStartTime !== null || playbackEndTime !== null) && (
              <button
                onClick={onClearPlaybackRange}
                className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 transition-colors"
                title="Clear playback range"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Help text */}
      <div className="px-3 py-2 border-t border-slate-700 text-[10px] text-slate-500 text-center">
        💡 Click time badges to play • Drag amber handles to adjust context range
      </div>
    </div>
  );
}
