import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Get questions directory based on project folder
function getQuestionsDir(projectFolder?: string): string {
  if (projectFolder) {
    return path.join(process.cwd(), projectFolder, 'questions');
  }
  return path.join(process.cwd(), 'data', 'questions');
}

// POST - Save questions to file
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.instanceId || !data.questions) {
      return NextResponse.json(
        { error: 'Missing required fields: instanceId and questions' },
        { status: 400 }
      );
    }

    // Create questions directory if it doesn't exist
    const questionsDir = getQuestionsDir(data.projectFolder);
    await fs.mkdir(questionsDir, { recursive: true });

    // Generate filename based on instance ID and timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${data.instanceId}-${timestamp}.json`;
    const filePath = path.join(questionsDir, filename);

    // Write questions to file
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    const relativePath = data.projectFolder
      ? `${data.projectFolder}/questions/${filename}`
      : `data/questions/${filename}`;

    return NextResponse.json({
      success: true,
      filePath: relativePath,
      questionCount: data.questions.length,
    });
  } catch (error) {
    console.error('Error saving questions:', error);
    return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 });
  }
}

// GET - List available question files or get specific file
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const instanceId = searchParams.get('instanceId');
    const projectFolder = searchParams.get('projectFolder') || undefined;

    const questionsDir = getQuestionsDir(projectFolder);

    // Check if directory exists
    try {
      await fs.access(questionsDir);
    } catch {
      return NextResponse.json({ files: [] });
    }

    // List all question files
    const files = await fs.readdir(questionsDir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    // If instanceId is provided, filter and return the latest file for that instance
    if (instanceId) {
      const instanceFiles = jsonFiles
        .filter((f) => f.startsWith(instanceId))
        .sort()
        .reverse();

      if (instanceFiles.length === 0) {
        return NextResponse.json({ files: [] });
      }

      // Return the latest file content
      const latestFile = instanceFiles[0];
      const filePath = path.join(questionsDir, latestFile);
      const content = await fs.readFile(filePath, 'utf-8');

      return NextResponse.json({
        file: latestFile,
        data: JSON.parse(content),
      });
    }

    // Return list of all files
    const fileInfos = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(questionsDir, file);
        const stat = await fs.stat(filePath);
        return {
          name: file,
          size: stat.size,
          modified: stat.mtime.toISOString(),
        };
      })
    );

    return NextResponse.json({ files: fileInfos });
  } catch (error) {
    console.error('Error listing questions:', error);
    return NextResponse.json({ error: 'Failed to list questions' }, { status: 500 });
  }
}
