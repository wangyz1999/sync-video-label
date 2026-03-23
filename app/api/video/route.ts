import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { existsSync, statSync } from 'fs';

// Serve video files from data/videos directory
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoPath = searchParams.get('path');

  if (!videoPath) {
    return NextResponse.json({ error: 'path is required' }, { status: 400 });
  }

  // Resolve the video path - support both relative and absolute paths
  let resolvedPath: string;

  if (path.isAbsolute(videoPath)) {
    resolvedPath = videoPath;
  } else {
    // Try relative to data/videos first
    resolvedPath = path.join(process.cwd(), 'data', 'videos', videoPath);

    // If not found, try relative to project root
    if (!existsSync(resolvedPath)) {
      resolvedPath = path.join(process.cwd(), videoPath);
    }
  }

  // Security check - ensure path is within allowed directories
  const dataDir = path.join(process.cwd(), 'data');
  const rootDir = process.cwd();

  if (!resolvedPath.startsWith(dataDir) && !resolvedPath.startsWith(rootDir)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  if (!existsSync(resolvedPath)) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  try {
    const stat = statSync(resolvedPath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    // Get content type based on extension
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska',
    };
    const contentType = contentTypes[ext] || 'video/mp4';

    if (range) {
      // Handle range requests for video seeking
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const fileBuffer = await fs.readFile(resolvedPath);
      const chunk = fileBuffer.slice(start, end + 1);

      return new NextResponse(chunk, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': contentType,
        },
      });
    } else {
      // Return full file
      const fileBuffer = await fs.readFile(resolvedPath);

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
        },
      });
    }
  } catch (error) {
    console.error('Error serving video:', error);
    return NextResponse.json({ error: 'Failed to serve video' }, { status: 500 });
  }
}
