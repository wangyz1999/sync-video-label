import { useState, useRef, useCallback, useEffect } from 'react';
import { VideoFile } from '../types';

const FPS = 30;
const FRAME_DURATION = 1 / FPS;

export function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentVideo = videos[currentVideoIndex];

  // Handle video file selection
  const addVideos = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('video/'));
    if (fileArray.length === 0) return;

    const newVideos: VideoFile[] = fileArray.map((file) => ({
      file,
      name: file.name,
      url: URL.createObjectURL(file),
      duration: 0,
    }));

    setVideos((prev) => {
      if (prev.length === 0) {
        return newVideos;
      }
      return [...prev, ...newVideos];
    });
  }, []);

  // Handle video metadata loaded
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      setVideoDuration(duration);
      setVideos((prev) => prev.map((v, i) => (i === currentVideoIndex ? { ...v, duration } : v)));
    }
  }, [currentVideoIndex]);

  // Handle time update
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // Seek to specific time
  const seekTo = useCallback(
    (time: number) => {
      if (videoRef.current) {
        const clampedTime = Math.max(0, Math.min(time, videoDuration));
        videoRef.current.currentTime = clampedTime;
        setCurrentTime(clampedTime);
      }
    },
    [videoDuration]
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

  // Move to next video
  const moveToNextVideo = useCallback((): boolean => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex((prev) => prev + 1);
      setCurrentTime(0);
      setIsPlaying(false);
      return true;
    }
    return false;
  }, [currentVideoIndex, videos.length]);

  // Check if can move to next video
  const canMoveToNextVideo = currentVideoIndex < videos.length - 1;

  // Cleanup object URLs
  useEffect(() => {
    const currentVideos = videos;
    return () => {
      currentVideos.forEach((v) => URL.revokeObjectURL(v.url));
    };
  }, [videos]);

  return {
    videoRef,
    videos,
    currentVideo,
    currentVideoIndex,
    videoDuration,
    currentTime,
    isPlaying,
    setIsPlaying,
    addVideos,
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
    moveToNextVideo,
    canMoveToNextVideo,
    setCurrentVideoIndex,
    setVideoDuration,
    setCurrentTime,
    resetForNewVideo: useCallback(() => {
      setCurrentTime(0);
      setIsPlaying(false);
    }, []),
  };
}
