import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Default directories (fallback when no project folder is specified)
const DEFAULT_ANNOTATION_DIR = path.join(process.cwd(), 'data', 'annotation');
const DEFAULT_PREDICTION_DIR = path.join(process.cwd(), 'data', 'prediction');
const DEFAULT_AUTOSAVE_DIR = path.join(process.cwd(), 'data', 'autosave');

// Get directory based on project folder
function getDir(type: 'annotation' | 'prediction' | 'autosave', projectFolder?: string): string {
  if (projectFolder) {
    return path.join(process.cwd(), projectFolder, type);
  }
  switch (type) {
    case 'prediction':
      return DEFAULT_PREDICTION_DIR;
    case 'autosave':
      return DEFAULT_AUTOSAVE_DIR;
    default:
      return DEFAULT_ANNOTATION_DIR;
  }
}

// Ensure directories exist
async function ensureDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// GET - Load annotation, prediction, autosave, or check status of multiple instances
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const instanceId = searchParams.get('instanceId');
  const videoName = searchParams.get('videoName'); // Legacy support
  const type = searchParams.get('type') || 'annotation'; // 'annotation', 'prediction', 'autosave', or 'status'
  const instanceIds = searchParams.get('instanceIds'); // Comma-separated list for bulk status check
  const projectFolder = searchParams.get('projectFolder') || undefined;

  // Bulk status check for multiple instances
  if (type === 'status' && instanceIds) {
    const ids = instanceIds.split(',').map((id) => id.trim());
    const statuses: Record<string, 'completed' | 'in-progress' | 'not-started'> = {};

    const annotationDir = getDir('annotation', projectFolder);
    const autosaveDir = getDir('autosave', projectFolder);

    for (const id of ids) {
      const annotationPath = path.join(annotationDir, `${id}.json`);
      const autosavePath = path.join(autosaveDir, `${id}.json`);

      try {
        await fs.access(annotationPath);
        statuses[id] = 'completed';
      } catch {
        try {
          await fs.access(autosavePath);
          statuses[id] = 'in-progress';
        } catch {
          statuses[id] = 'not-started';
        }
      }
    }

    return NextResponse.json({ statuses });
  }

  const baseName = instanceId || (videoName ? videoName.replace(/\.[^/.]+$/, '') : null);

  if (!baseName) {
    return NextResponse.json({ error: 'instanceId or videoName is required' }, { status: 400 });
  }

  const dir = getDir(type as 'annotation' | 'prediction' | 'autosave', projectFolder);
  const filePath = path.join(dir, `${baseName}.json`);

  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

// POST - Save annotation or autosave
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instanceId, videoName, isAutosave, projectFolder, ...annotationData } = body;

    const baseName = instanceId || (videoName ? videoName.replace(/\.[^/.]+$/, '') : null);

    if (!baseName) {
      return NextResponse.json({ error: 'instanceId or videoName is required' }, { status: 400 });
    }

    const targetDir = getDir(isAutosave ? 'autosave' : 'annotation', projectFolder);
    await ensureDir(targetDir);

    const filePath = path.join(targetDir, `${baseName}.json`);

    const dataToSave = {
      instanceId: instanceId || videoName,
      ...annotationData,
      lastModified: new Date().toISOString(),
    };

    await fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2), 'utf-8');

    const relativePath = projectFolder
      ? `${projectFolder}/${isAutosave ? 'autosave' : 'annotation'}/${baseName}.json`
      : `data/${isAutosave ? 'autosave' : 'annotation'}/${baseName}.json`;

    return NextResponse.json({ success: true, filePath: relativePath });
  } catch (error) {
    console.error('Error saving annotation:', error);
    return NextResponse.json({ error: 'Failed to save annotation' }, { status: 500 });
  }
}
