import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'data', 'project-example', 'project_example.json');
  try {
    const text = await fs.readFile(filePath, 'utf-8');
    return new NextResponse(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return NextResponse.json({ error: 'Example project not found' }, { status: 404 });
  }
}
