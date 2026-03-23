import { promises as fs } from 'fs';
import path from 'path';

export const DEFAULT_PREDICTION_DIR = path.join(process.cwd(), 'data', 'prediction');

// Get prediction directory based on project folder
export function getPredictionDir(projectFolder?: string): string {
  if (projectFolder) {
    return path.join(process.cwd(), projectFolder, 'prediction');
  }
  return DEFAULT_PREDICTION_DIR;
}

// Ensure directory exists
export async function ensureDir(dir: string): Promise<void> {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// MIME type mapping for video files
const VIDEO_MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/mov',
  '.mpeg': 'video/mpeg',
};

// Read video and convert to base64 data URL
export async function videoToBase64(videoPath: string): Promise<string> {
  // Resolve path - support both relative and absolute
  let resolvedPath: string;

  if (path.isAbsolute(videoPath)) {
    resolvedPath = videoPath;
  } else {
    // Try relative to data/videos first
    resolvedPath = path.join(process.cwd(), 'data', 'videos', videoPath);

    try {
      await fs.access(resolvedPath);
    } catch {
      // Try relative to project root
      resolvedPath = path.join(process.cwd(), videoPath);
    }
  }

  const videoBuffer = await fs.readFile(resolvedPath);
  const base64Video = videoBuffer.toString('base64');

  // Determine MIME type
  const ext = path.extname(resolvedPath).toLowerCase();
  const mimeType = VIDEO_MIME_TYPES[ext] || 'video/mp4';

  return `data:${mimeType};base64,${base64Video}`;
}

// Parse base64 data URL into components
export function parseBase64DataUrl(dataUrl: string): { mimeType: string; data: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid base64 video format');
  }
  return {
    mimeType: match[1],
    data: match[2],
  };
}

// Add delay between API calls
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Convert OpenRouter model name to Google model name
export function toGoogleModelName(model: string): string {
  return model.replace('google/', '');
}

// Check if model is a Google model
export function isGoogleModel(model: string): boolean {
  return model.startsWith('google/') || model.includes('gemini');
}
