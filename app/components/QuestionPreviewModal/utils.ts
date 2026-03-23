/**
 * Format time in seconds to MM:SS format (integer seconds)
 */
export function formatTime(seconds: number): string {
  const totalSeconds = Math.round(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Construct video URL from path
 */
export function getVideoUrl(path: string, url?: string): string {
  return url || `/api/video?path=${encodeURIComponent(path || '')}`;
}
