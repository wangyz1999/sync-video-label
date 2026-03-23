import { useState, useCallback, useEffect, useRef } from 'react';

interface LoopSegment {
  startTime: number;
  endTime: number;
}

interface UseLoopPlaybackOptions {
  currentTime: number;
  isPlaying: boolean;
  seekTo: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
}

export function useLoopPlayback({ currentTime, isPlaying, seekTo }: UseLoopPlaybackOptions) {
  const [loopSegment, setLoopSegment] = useState<LoopSegment | null>(null);
  const prevIsPlayingRef = useRef(isPlaying);

  // Start loop playback for a segment
  const handleLoopPlaySegment = useCallback(
    (startTime: number, endTime: number) => {
      setLoopSegment({ startTime, endTime });
      seekTo(startTime);
    },
    [seekTo]
  );

  // Stop loop playback
  const stopLoopPlayback = useCallback(() => {
    setLoopSegment(null);
  }, []);

  // Effect to handle loop playback - restart when reaching end of segment
  useEffect(() => {
    if (!loopSegment || !isPlaying) return;

    // Check if current time has reached or passed the end of the loop segment
    // Use a larger buffer (0.15s) because timeupdate events are infrequent (~250ms intervals)
    if (currentTime >= loopSegment.endTime - 0.15) {
      seekTo(loopSegment.startTime);
    }
  }, [currentTime, loopSegment, isPlaying, seekTo]);

  // Track play state changes to stop loop when user pauses
  // Using ref comparison to avoid setState in effect
  useEffect(() => {
    const wasPlaying = prevIsPlayingRef.current;
    prevIsPlayingRef.current = isPlaying;

    // User paused while loop was active - stop the loop
    if (wasPlaying && !isPlaying && loopSegment) {
      // Use setTimeout to defer the state update outside the effect
      const timeoutId = setTimeout(() => {
        setLoopSegment(null);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isPlaying, loopSegment]);

  return {
    loopSegment,
    handleLoopPlaySegment,
    stopLoopPlayback,
  };
}
