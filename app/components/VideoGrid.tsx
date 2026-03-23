'use client';

import { useRef, useEffect, RefObject } from 'react';
import {
  VideoInfo,
  VideoLayout,
  VIDEO_LAYOUTS,
  LayoutConfig,
  LabelEntry,
  EventType,
} from '../types';
import { VideoCaption } from './VideoCaption';
import type { CaptionAlignment } from './SettingsModal';

interface VideoGridProps {
  videos: VideoInfo[];
  videoRefs: RefObject<(HTMLVideoElement | null)[]>;
  currentTime: number;
  isPlaying: boolean;
  activeVideoIndex: number;
  layout: VideoLayout;
  labels?: LabelEntry[]; // Labels to display as captions
  showCaptions?: boolean; // Show/hide captions
  captionFontSize?: number; // Font size for captions in pixels
  captionAlignment?: CaptionAlignment; // Caption horizontal alignment
  visibleTypes?: Set<EventType>; // Filter: which label types to show in captions
  onLoadedMetadata: (index: number, duration: number) => void;
  onTimeUpdate: (time: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onVideoClick: (index: number) => void;
  onLayoutChange: (layout: VideoLayout) => void;
}

function getLayoutConfig(layout: VideoLayout): LayoutConfig {
  return VIDEO_LAYOUTS.find((l) => l.code === layout) || VIDEO_LAYOUTS[0];
}

function getSuggestedLayouts(videoCount: number): VideoLayout[] {
  const suggestions: VideoLayout[] = [];

  if (videoCount === 1) {
    suggestions.push('1x1');
  } else if (videoCount === 2) {
    suggestions.push('1x2', 'focused');
  } else if (videoCount === 3) {
    suggestions.push('2+1', '1x3', 'focused');
  } else if (videoCount === 4) {
    suggestions.push('2x2', '1x4', 'focused');
  } else if (videoCount === 5) {
    suggestions.push('3+2', '2x3', '1x5', 'focused');
  } else if (videoCount === 6) {
    suggestions.push('2x3', '1x6', 'focused');
  } else if (videoCount > 6) {
    suggestions.push('focused');
  }

  return suggestions;
}

// Get grid style for special layouts
function getGridStyle(
  layout: VideoLayout,
  layoutConfig: LayoutConfig,
  videoCount: number
): React.CSSProperties {
  if (layout === '2+1') {
    // 2 top, 1 bottom centered - use 2 columns
    return {
      display: 'grid',
      gridTemplateRows: 'repeat(2, 1fr)',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '2px',
    };
  } else if (layout === '3+2') {
    // 3 top, 2 bottom centered - use 6 columns for flexibility
    return {
      display: 'grid',
      gridTemplateRows: 'repeat(2, 1fr)',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: '2px',
    };
  } else if (layout === 'focused') {
    // Focused layout: main video on left (75%), side videos stacked on right (25%)
    const sideVideoCount = Math.max(1, videoCount - 1);
    return {
      display: 'grid',
      gridTemplateRows: `repeat(${sideVideoCount}, 1fr)`,
      gridTemplateColumns: '3fr 1fr',
      gap: '2px',
    };
  }

  // Regular grid
  return {
    display: 'grid',
    gridTemplateRows: `repeat(${layoutConfig.rows}, 1fr)`,
    gridTemplateColumns: `repeat(${layoutConfig.cols}, 1fr)`,
    gap: '2px',
  };
}

// Get cell style for special layouts
function getCellStyle(
  layout: VideoLayout,
  index: number,
  totalVideos: number,
  activeVideoIndex: number
): React.CSSProperties | undefined {
  if (layout === '2+1' && totalVideos >= 3) {
    // 2 top, 1 bottom centered
    if (index === 2) {
      // Third video spans both columns, centered
      return { gridColumn: '1 / 3', justifySelf: 'center', width: '50%' };
    }
  } else if (layout === '3+2' && totalVideos >= 5) {
    // 3 top (each span 2 columns), 2 bottom (each span 2 columns, offset by 1)
    if (index < 3) {
      // Top row: each video spans 2 columns
      return { gridColumn: `${index * 2 + 1} / ${index * 2 + 3}` };
    } else {
      // Bottom row: offset by 1 column for centering
      const bottomIndex = index - 3;
      return { gridColumn: `${bottomIndex * 2 + 2} / ${bottomIndex * 2 + 4}` };
    }
  } else if (layout === 'focused' && totalVideos > 1) {
    // Focused layout: active video spans all rows in first column
    const focusedIndex = activeVideoIndex >= 0 ? activeVideoIndex : 0;
    const sideVideoCount = totalVideos - 1;

    if (index === focusedIndex) {
      // Main focused video - spans all rows in first column
      return {
        gridColumn: '1',
        gridRow: `1 / ${sideVideoCount + 1}`,
      };
    }
    // Side videos - calculate their row position
    // Skip the focused video when counting position
    const sidePosition = index < focusedIndex ? index : index - 1;
    return {
      gridColumn: '2',
      gridRow: `${sidePosition + 1}`,
    };
  }
  return undefined;
}

export function VideoGrid({
  videos,
  videoRefs,
  currentTime,
  isPlaying,
  activeVideoIndex,
  layout,
  labels = [],
  showCaptions = true,
  captionFontSize = 14,
  captionAlignment = 'center',
  visibleTypes,
  onLoadedMetadata,
  onTimeUpdate,
  onPlay,
  onPause,
  onVideoClick,
  onLayoutChange,
}: VideoGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutConfig = getLayoutConfig(layout);
  const suggestedLayouts = getSuggestedLayouts(videos.length);

  // Sync all videos to currentTime when seeking
  useEffect(() => {
    const refs = videoRefs.current;
    if (!refs) return;

    refs.forEach((video) => {
      if (video && Math.abs(video.currentTime - currentTime) > 0.1) {
        video.currentTime = currentTime;
      }
    });
  }, [currentTime, videoRefs]);

  // Play/pause all videos together
  useEffect(() => {
    const refs = videoRefs.current;
    if (!refs) return;

    refs.forEach((video) => {
      if (video) {
        if (isPlaying) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });
  }, [isPlaying, videoRefs]);

  if (videos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900 rounded-xl border-2 border-dashed border-slate-700">
        <div className="text-center text-slate-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
            />
          </svg>
          <p className="text-lg mb-1">No videos loaded</p>
          <p className="text-sm">Import a project to start labeling</p>
        </div>
      </div>
    );
  }

  const gridStyle = getGridStyle(layout, layoutConfig, videos.length);
  const isSpecialLayout = layoutConfig.isSpecial;

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Layout selector */}
      <div className="flex items-center gap-2 text-sm shrink-0">
        <span className="text-slate-400">Layout:</span>
        {suggestedLayouts.map((l) => {
          const config = getLayoutConfig(l);
          return (
            <button
              key={l}
              onClick={() => onLayoutChange(l)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                layout === l
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Video grid */}
      <div ref={containerRef} className="flex-1 min-h-0 rounded-xl bg-black" style={gridStyle}>
        {videos.map((video, index) => {
          const cellStyle = getCellStyle(layout, index, videos.length, activeVideoIndex);

          return (
            <div
              key={index}
              className={`relative bg-slate-900 cursor-pointer transition-all overflow-hidden ${
                activeVideoIndex === index ? 'ring-2 ring-amber-400 ring-inset' : ''
              }`}
              style={cellStyle}
              onClick={() => onVideoClick(index)}
            >
              <video
                ref={(el) => {
                  if (videoRefs.current) {
                    videoRefs.current[index] = el;
                  }
                }}
                src={video.url}
                className="w-full h-full object-contain bg-black"
                onLoadedMetadata={(e) => {
                  const target = e.target as HTMLVideoElement;
                  onLoadedMetadata(index, target.duration);
                }}
                onTimeUpdate={(e) => {
                  // Only report time from the first video to avoid conflicts
                  if (index === 0) {
                    const target = e.target as HTMLVideoElement;
                    onTimeUpdate(target.currentTime);
                  }
                }}
                onPlay={() => {
                  if (index === 0) onPlay();
                }}
                onPause={() => {
                  if (index === 0) onPause();
                }}
                muted={index !== activeVideoIndex} // Only active video has sound
              />

              {/* Video label overlay */}
              <div className="absolute top-2 left-2 flex items-center gap-2 z-30">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    activeVideoIndex === index
                      ? 'bg-amber-500 text-slate-900'
                      : 'bg-slate-800/80 text-slate-300'
                  }`}
                >
                  V{index + 1}
                </span>
                {video.name && (
                  <span className="px-2 py-0.5 rounded text-xs bg-slate-800/80 text-slate-400 truncate max-w-[150px]">
                    {video.name}
                  </span>
                )}
              </div>

              {/* Captions overlay - in focused layout, only show for the focused video */}
              {showCaptions &&
                (layout !== 'focused' ||
                  index === (activeVideoIndex >= 0 ? activeVideoIndex : 0)) && (
                  <VideoCaption
                    labels={labels}
                    currentTime={currentTime}
                    videoIndex={index}
                    fontSize={captionFontSize}
                    alignment={captionAlignment}
                    visibleTypes={visibleTypes}
                  />
                )}
            </div>
          );
        })}

        {/* Empty slots if layout has more cells than videos (only for non-special layouts) */}
        {!isSpecialLayout &&
          Array.from({
            length: Math.max(0, layoutConfig.rows * layoutConfig.cols - videos.length),
          }).map((_, i) => <div key={`empty-${i}`} className="bg-slate-900/50" />)}
      </div>
    </div>
  );
}
