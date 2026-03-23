'use client';

import { VideoInfo } from '../types';

interface VideoTabsProps {
  videos: VideoInfo[];
  activeIndex: number;  // -1 means "All videos"
  onTabClick: (index: number) => void;
  labelCounts?: number[];  // Number of labels per video
  totalLabelCount?: number;  // Total labels across all videos
}

export function VideoTabs({
  videos,
  activeIndex,
  onTabClick,
  labelCounts = [],
  totalLabelCount = 0,
}: VideoTabsProps) {
  if (videos.length <= 1) {
    return null;
  }

  const isAllActive = activeIndex === -1;

  return (
    <div className="flex items-center gap-1 mb-2">
      <span className="text-xs text-slate-500 mr-2">Timeline for:</span>
      
      {/* All Videos tab */}
      <button
        onClick={() => onTabClick(-1)}
        className={`px-3 py-1.5 rounded-t-lg text-sm font-medium transition-all flex items-center gap-2 ${
          isAllActive
            ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
            : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`}
      >
        <span>All</span>
        {totalLabelCount > 0 && (
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            isAllActive ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'
          }`}>
            {totalLabelCount}
          </span>
        )}
      </button>

      <div className="w-px h-5 bg-slate-700 mx-1" />

      {/* Individual video tabs */}
      {videos.map((video, index) => {
        const labelCount = labelCounts[index] || 0;
        const isActive = activeIndex === index;
        
        return (
          <button
            key={index}
            onClick={() => onTabClick(index)}
            className={`px-3 py-1.5 rounded-t-lg text-sm font-medium transition-all flex items-center gap-2 ${
              isActive
                ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>Video {index + 1}</span>
            {labelCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                isActive ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'
              }`}>
                {labelCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
