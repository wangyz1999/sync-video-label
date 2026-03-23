import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DEFAULT_AUTOSAVE_DIR = path.join(process.cwd(), 'data', 'autosave_question');

// Get autosave directory based on project folder
function getAutosaveDir(projectFolder?: string): string {
  if (projectFolder) {
    return path.join(process.cwd(), projectFolder, 'autosave_question');
  }
  return DEFAULT_AUTOSAVE_DIR;
}

// Ensure autosave directory exists
async function ensureDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// GET - Load autosave for an instance
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const instanceId = searchParams.get('instanceId');
  const projectFolder = searchParams.get('projectFolder') || undefined;

  if (!instanceId) {
    return NextResponse.json({ error: 'instanceId is required' }, { status: 400 });
  }

  try {
    const autosaveDir = getAutosaveDir(projectFolder);
    await ensureDir(autosaveDir);

    // Sanitize filename
    const safeInstanceId = instanceId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const filePath = path.join(autosaveDir, `${safeInstanceId}.json`);

    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return NextResponse.json(JSON.parse(data));
    } catch (error: unknown) {
      // File doesn't exist - return 404
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        return NextResponse.json({ error: 'No autosave found' }, { status: 404 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error loading autosave:', error);
    return NextResponse.json({ error: 'Failed to load autosave' }, { status: 500 });
  }
}

// POST - Save autosave for an instance
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.instanceId) {
      return NextResponse.json({ error: 'instanceId is required' }, { status: 400 });
    }

    const autosaveDir = getAutosaveDir(data.projectFolder);
    await ensureDir(autosaveDir);

    // Sanitize filename
    const safeInstanceId = data.instanceId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const filePath = path.join(autosaveDir, `${safeInstanceId}.json`);

    // Update lastSaved timestamp
    data.lastSaved = new Date().toISOString();

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      path: filePath,
      lastSaved: data.lastSaved,
    });
  } catch (error) {
    console.error('Error saving autosave:', error);
    return NextResponse.json({ error: 'Failed to save autosave' }, { status: 500 });
  }
}

// DELETE - Delete autosave for an instance
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const instanceId = searchParams.get('instanceId');
  const projectFolder = searchParams.get('projectFolder') || undefined;

  if (!instanceId) {
    return NextResponse.json({ error: 'instanceId is required' }, { status: 400 });
  }

  try {
    const autosaveDir = getAutosaveDir(projectFolder);
    const safeInstanceId = instanceId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const filePath = path.join(autosaveDir, `${safeInstanceId}.json`);

    await fs.unlink(filePath);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json({ success: true }); // File already doesn't exist
    }
    console.error('Error deleting autosave:', error);
    return NextResponse.json({ error: 'Failed to delete autosave' }, { status: 500 });
  }
}
