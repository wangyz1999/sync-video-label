'use client';

import { RefObject, DragEvent } from 'react';
import { VideoFile, LabelEntry } from '../types';
import { formatTime } from '../utils/timeline';

interface VideoPlayerProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  currentVideo: VideoFile | undefined;
  videoDuration: number;
  currentTime: number;
  isPlaying: boolean;
  selectedLabel: LabelEntry | null;
  onLoadedMetadata: () => void;
  onTimeUpdate: () => void;
  onPlay: () => void;
  onPause: () => void;
  onTogglePlay: () => void;
  onPrevFrame: () => void;
  onNextFrame: () => void;
  onPrevSecond: () => void;
  onNextSecond: () => void;
  onGoToStart: () => void;
  onGoToEnd: () => void;
  onSeek: (time: number) => void;
  onFileDrop: (files: FileList) => void;
  onFileSelect: () => void;
}

export function VideoPlayer({
  videoRef,
  currentVideo,
  videoDuration,
  currentTime,
  isPlaying,
  selectedLabel,
  onLoadedMetadata,
  onTimeUpdate,
  onPlay,
  onPause,
  onTogglePlay,
  onPrevFrame,
  onNextFrame,
  onPrevSecond,
  onNextSecond,
  onGoToStart,
  onGoToEnd,
  onSeek,
  onFileDrop,
  onFileSelect,
}: VideoPlayerProps) {
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      onFileDrop(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const playSelectedSegment = () => {
    if (!selectedLabel || !videoRef.current) return;
    onSeek(selectedLabel.startTime);
    videoRef.current.play();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Video container */}
      <div
        className="relative rounded-xl overflow-hidden bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center aspect-video"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {currentVideo ? (
          <video
            ref={videoRef}
            src={currentVideo.url}
            className="max-w-full max-h-full object-contain"
            onLoadedMetadata={onLoadedMetadata}
            onTimeUpdate={onTimeUpdate}
            onPlay={onPlay}
            onPause={onPause}
          />
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-4 cursor-pointer p-8"
            onClick={onFileSelect}
          >
            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg text-slate-300">Drop video files here</p>
              <p className="text-sm text-slate-500">or click to browse</p>
            </div>
          </div>
        )}
      </div>

      {/* Playback controls */}
      {currentVideo && (
        <div className="grid grid-cols-3 items-center">
          {/* Left spacer */}
          <div />
          
          {/* Center - main controls */}
          <div className="flex items-center justify-center gap-2">
            {/* Go to start */}
            <button
              onClick={onGoToStart}
              className="px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs transition-colors flex items-center gap-1"
              title="Go to start (Home)"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
              </svg>
              Start
            </button>

            {/* Second controls */}
            <button
              onClick={onPrevSecond}
              className="px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs transition-colors"
              title="Previous second (Left arrow)"
            >
              ← 1s
            </button>
            
            {/* Frame controls */}
            <button
              onClick={onPrevFrame}
              className="px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs transition-colors"
              title="Previous frame (Ctrl+Left)"
            >
              ← Frame
            </button>
            
            {/* Play/Pause */}
            <button
              onClick={onTogglePlay}
              className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 flex items-center justify-center transition-colors"
              title="Play/Pause (Space)"
            >
              {isPlaying ? (
                <svg className="w-5 h-5 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            
            {/* Frame controls */}
            <button
              onClick={onNextFrame}
              className="px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs transition-colors"
              title="Next frame (Ctrl+Right)"
            >
              Frame →
            </button>
            
            {/* Second controls */}
            <button
              onClick={onNextSecond}
              className="px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs transition-colors"
              title="Next second (Right arrow)"
            >
              1s →
            </button>

            {/* Go to end */}
            <button
              onClick={onGoToEnd}
              className="px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs transition-colors flex items-center gap-1"
              title="Go to end (End)"
            >
              End
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 18h2V6h-2v12zM6 18l8.5-6L6 6v12z" />
              </svg>
            </button>
          </div>

          {/* Right - Play Selection button */}
          <div className="flex justify-end">
            {selectedLabel && (
              <button
                onClick={playSelectedSegment}
                className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs transition-colors flex items-center gap-1"
                title="Play selected segment"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play Selection
              </button>
            )}
          </div>
        </div>
      )}

      {/* Time display */}
      {currentVideo && (
        <div className="text-center text-sm text-slate-400">
          {formatTime(currentTime)} / {formatTime(videoDuration)}
          {selectedLabel && (
            <span className="ml-4 text-violet-400">
              Selected: {formatTime(selectedLabel.startTime)} - {formatTime(selectedLabel.endTime)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
