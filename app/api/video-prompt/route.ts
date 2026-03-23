import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { videoToBase64, parseBase64DataUrl, toGoogleModelName } from '../predict/utils';

interface VideoPromptRequest {
  videoPath: string;
  prompt: string;
  model: string;
  temperature: number;
  startOffset?: number; // in seconds
  endOffset?: number; // in seconds
}

export async function POST(request: NextRequest) {
  try {
    const body: VideoPromptRequest = await request.json();
    const { videoPath, prompt, model, temperature, startOffset, endOffset } = body;

    if (!videoPath || !prompt) {
      return NextResponse.json({ error: 'videoPath and prompt are required' }, { status: 400 });
    }

    // Get API key from environment
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY environment variable not set' },
        { status: 500 }
      );
    }

    // Convert video to base64
    console.log(`Reading video: ${videoPath}`);
    const base64Video = await videoToBase64(videoPath);
    const { mimeType, data: base64Data } = parseBase64DataUrl(base64Video);

    // Initialize Google AI
    const googleModelName = toGoogleModelName(model);
    const ai = new GoogleGenAI({ apiKey });

    console.log(`Sending prompt to ${googleModelName}...`);

    // Build the video part with optional clipping
    interface VideoPart {
      inlineData: {
        mimeType: string;
        data: string;
      };
      videoMetadata?: {
        startOffset: string;
        endOffset: string;
      };
    }

    const videoPart: VideoPart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };

    // Add video metadata for clipping if offsets are provided
    if (startOffset !== undefined && endOffset !== undefined) {
      videoPart.videoMetadata = {
        startOffset: `${Math.floor(startOffset)}s`,
        endOffset: `${Math.ceil(endOffset)}s`,
      };
      console.log(`Clipping video: ${startOffset}s - ${endOffset}s`);
    }

    const response = await ai.models.generateContent({
      model: googleModelName,
      contents: [
        {
          role: 'user',
          parts: [videoPart, { text: prompt }],
        },
      ],
      config: {
        temperature: temperature,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('No response content from Google AI');
    }

    // Extract usage stats
    const usage = response.usageMetadata
      ? {
          promptTokens: response.usageMetadata.promptTokenCount || 0,
          completionTokens: response.usageMetadata.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata.totalTokenCount || 0,
        }
      : null;

    console.log('Response received successfully');

    return NextResponse.json({
      response: responseText,
      usage,
      model: googleModelName,
    });
  } catch (error) {
    console.error('Video prompt error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
