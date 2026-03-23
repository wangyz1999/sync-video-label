import { useState, useRef, useCallback, useEffect } from 'react';
import { VideoInfo, VideoLayout, LoadedInstance, ProjectFile } from '../types';

const FPS = 30;
const FRAME_DURATION = 1 / FPS;

// Export type for use in other hooks
export type VideoInstance = LoadedInstance;

export function useMultiVideoPlayer() {
  // Video element refs array
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Project state
  const [project, setProject] = useState<ProjectFile | null>(null);
  const [instances, setInstances] = useState<LoadedInstance[]>([]);
  const [currentInstanceIndex, setCurrentInstanceIndex] = useState(0);

  // Video state
  const [videoDurations, setVideoDurations] = useState<number[]>([]);
  const [duration, setDuration] = useState(0); // Max duration for timeline
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0); // Which video tab is active
  const [layout, setLayout] = useState<VideoLayout>('1x1');

  const currentInstance = instances[currentInstanceIndex];

  // Load project from JSON
  const loadProject = useCallback(async (projectData: ProjectFile, baseUrl: string = '') => {
    setProject(projectData);

    // Process instances
    const loadedInstances: LoadedInstance[] = [];

    for (let i = 0; i < projectData.instances.length; i++) {
      const inst = projectData.instances[i];
      const videos: VideoInfo[] = [];

      for (let j = 0; j < inst.videos.length; j++) {
        const videoPath = inst.videos[j];
        // Construct URL - baseUrl is API endpoint like '/api/video?path='
        const url = baseUrl ? `${baseUrl}${encodeURIComponent(videoPath)}` : videoPath;

        videos.push({
          url,
          name: videoPath.split('/').pop() || `Video ${j + 1}`,
          duration: 0,
          path: videoPath,
        });
      }

      loadedInstances.push({
        id: inst.id || `instance-${i}`,
        name: inst.name || `Instance ${i + 1}`,
        videos,
        duration: 0,
        predictionPath: inst.prediction,
        projectFolder: projectData.folder,
      });
    }

    setInstances(loadedInstances);
    setCurrentInstanceIndex(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setActiveVideoIndex(0);

    // Set initial layout based on video count
    if (loadedInstances.length > 0) {
      const videoCount = loadedInstances[0].videos.length;
      if (videoCount === 1) setLayout('1x1');
      else if (videoCount === 2) setLayout('1x2');
      else if (videoCount === 3) setLayout('2+1');
      else if (videoCount === 4) setLayout('2x2');
      else if (videoCount === 5) setLayout('3+2');
      else setLayout('2x3');
    }

    return loadedInstances;
  }, []);

  // Handle video metadata loaded
  const handleLoadedMetadata = useCallback(
    (index: number, videoDuration: number) => {
      setVideoDurations((prev) => {
        const newDurations = [...prev];
        newDurations[index] = videoDuration;
        return newDurations;
      });

      // Update instance duration to max of all videos
      setInstances((prev) =>
        prev.map((inst, i) => {
          if (i !== currentInstanceIndex) return inst;

          const updatedVideos = inst.videos.map((v, j) =>
            j === index ? { ...v, duration: videoDuration } : v
          );
          const maxDuration = Math.max(
            ...updatedVideos.map((v) => v.duration).filter((d) => d > 0)
          );

          return {
            ...inst,
            videos: updatedVideos,
            duration: maxDuration,
          };
        })
      );
    },
    [currentInstanceIndex]
  );

  // Update shared timeline duration when video durations change
  useEffect(() => {
    if (videoDurations.length > 0) {
      const maxDuration = Math.max(...videoDurations.filter((d) => d > 0));
      if (maxDuration > 0 && maxDuration !== duration) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDuration(maxDuration);
      }
    }
  }, [videoDurations, duration]);

  // Get expected layout for video count
  const getExpectedLayout = useCallback((count: number): VideoLayout => {
    if (count === 1) return '1x1';
    if (count === 2) return '1x2';
    if (count === 3) return '2+1';
    if (count === 4) return '2x2';
    if (count === 5) return '3+2';
    return '2x3';
  }, []);

  // Update layout when instance changes (only on instance switch, not on manual layout change)
  useEffect(() => {
    if (currentInstance) {
      const expectedLayout = getExpectedLayout(currentInstance.videos.length);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLayout(expectedLayout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentInstance?.id, getExpectedLayout]);

  // Handle time update from videos
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  // Toggle play/pause for all videos
  const togglePlay = useCallback(() => {
    const refs = videoRefs.current;
    if (!refs || refs.length === 0) return;

    if (isPlaying) {
      refs.forEach((video) => video?.pause());
    } else {
      refs.forEach((video) => video?.play().catch(() => {}));
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Seek all videos to specific time
  const seekTo = useCallback(
    (time: number) => {
      const clampedTime = Math.max(0, Math.min(time, duration));
      setCurrentTime(clampedTime);

      const refs = videoRefs.current;
      if (refs) {
        refs.forEach((video) => {
          if (video) {
            video.currentTime = clampedTime;
          }
        });
      }
    },
    [duration]
  );

  // Move by seconds
  const moveBySeconds = useCallback(
    (seconds: number) => {
      seekTo(currentTime + seconds);
    },
    [currentTime, seekTo]
  );

  // Move by frames
  const moveByFrames = useCallback(
    (frames: number) => {
      seekTo(currentTime + frames * FRAME_DURATION);
    },
    [currentTime, seekTo]
  );

  // Previous/Next frame
  const prevFrame = useCallback(() => moveByFrames(-1), [moveByFrames]);
  const nextFrame = useCallback(() => moveByFrames(1), [moveByFrames]);

  // Previous/Next second
  const prevSecond = useCallback(() => moveBySeconds(-1), [moveBySeconds]);
  const nextSecond = useCallback(() => moveBySeconds(1), [moveBySeconds]);

  // Go to start/end
  const goToStart = useCallback(() => seekTo(0), [seekTo]);
  const goToEnd = useCallback(() => seekTo(duration), [seekTo, duration]);

  // Move to previous instance
  const moveToPrevInstance = useCallback((): boolean => {
    if (currentInstanceIndex > 0) {
      setCurrentInstanceIndex((prev) => prev - 1);
      setCurrentTime(0);
      setIsPlaying(false);
      setActiveVideoIndex(0);
      setVideoDurations([]);
      return true;
    }
    return false;
  }, [currentInstanceIndex]);

  // Move to next instance
  const moveToNextInstance = useCallback((): boolean => {
    if (currentInstanceIndex < instances.length - 1) {
      setCurrentInstanceIndex((prev) => prev + 1);
      setCurrentTime(0);
      setIsPlaying(false);
      setActiveVideoIndex(0);
      setVideoDurations([]);
      return true;
    }
    return false;
  }, [currentInstanceIndex, instances.length]);

  // Check navigation availability
  const canMoveToPrevInstance = currentInstanceIndex > 0;
  const canMoveToNextInstance = currentInstanceIndex < instances.length - 1;

  // Reset state for new instance
  const resetForNewInstance = useCallback(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    setActiveVideoIndex(0);
    setVideoDurations([]);
  }, []);

  // Clear all data
  const clearProject = useCallback(() => {
    setProject(null);
    setInstances([]);
    setCurrentInstanceIndex(0);
    setVideoDurations([]);
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setActiveVideoIndex(0);
  }, []);

  return {
    videoRefs,
    project,
    instances,
    currentInstance,
    currentInstanceIndex,
    duration,
    currentTime,
    isPlaying,
    activeVideoIndex,
    layout,
    setIsPlaying,
    setActiveVideoIndex,
    setLayout,
    loadProject,
    handleLoadedMetadata,
    handleTimeUpdate,
    togglePlay,
    seekTo,
    moveBySeconds,
    moveByFrames,
    prevFrame,
    nextFrame,
    prevSecond,
    nextSecond,
    goToStart,
    goToEnd,
    moveToPrevInstance,
    moveToNextInstance,
    canMoveToPrevInstance,
    canMoveToNextInstance,
    setCurrentInstanceIndex,
    resetForNewInstance,
    clearProject,
  };
}
