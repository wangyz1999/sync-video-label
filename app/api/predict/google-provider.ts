import { GoogleGenAI } from '@google/genai';
import {
  ACTION_SYSTEM_PROMPT,
  STATE_SYSTEM_PROMPT,
  WORLD_SYSTEM_PROMPT,
  SCENE_DISTRACTOR_SYSTEM_PROMPT,
  LEXICAL_DISTRACTOR_SYSTEM_PROMPT,
  buildUserPrompt,
  buildSceneDistractorUserPrompt,
  buildLexicalDistractorInput,
  buildLexicalDistractorUserPrompt,
} from './prompts';
import {
  ACTION_PREDICTION_SCHEMA,
  STATE_PREDICTION_SCHEMA,
  WORLD_PREDICTION_SCHEMA,
  SCENE_DISTRACTOR_SCHEMA,
  LEXICAL_DISTRACTOR_SCHEMA,
} from './schemas';
import {
  LabelFromLLM,
  SceneDistractorFromLLM,
  AnalysisPassResult,
  SceneDistractorResult,
  LexicalDistractorResult,
  LexicalDistractorsByType,
  UsageStats,
  GoogleUsageMetadata,
} from './types';
import { parseBase64DataUrl, toGoogleModelName } from './utils';

// Extract and normalize usage stats from Google AI response
function extractUsageStats(usageMetadata?: GoogleUsageMetadata): UsageStats {
  if (!usageMetadata) {
    return {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
  }

  return {
    promptTokens: usageMetadata.promptTokenCount || 0,
    completionTokens: usageMetadata.candidatesTokenCount || 0,
    totalTokens: usageMetadata.totalTokenCount || 0,
    // Google-specific fields
    cachedContentTokens: usageMetadata.cachedContentTokenCount,
    thoughtsTokens: usageMetadata.thoughtsTokenCount,
  };
}

// Analyze video for action, state, or world labels using Google AI Studio directly
export async function analyzeVideoPass(
  videoPath: string,
  videoIndex: number,
  totalVideos: number,
  instanceName: string,
  videoDuration: number,
  model: string,
  temperature: number,
  apiKey: string,
  passType: 'action' | 'state' | 'world',
  base64Video: string
): Promise<AnalysisPassResult> {
  const systemPrompt =
    passType === 'action'
      ? ACTION_SYSTEM_PROMPT
      : passType === 'state'
        ? STATE_SYSTEM_PROMPT
        : WORLD_SYSTEM_PROMPT;
  const schema =
    passType === 'action'
      ? ACTION_PREDICTION_SCHEMA
      : passType === 'state'
        ? STATE_PREDICTION_SCHEMA
        : WORLD_PREDICTION_SCHEMA;
  const passName =
    passType === 'action'
      ? 'Actions (SA, OA)'
      : passType === 'state'
        ? 'States (SS, OS)'
        : 'World (WO, WE)';

  const googleModelName = toGoogleModelName(model);
  const ai = new GoogleGenAI({ apiKey });
  const { mimeType, data: base64Data } = parseBase64DataUrl(base64Video);
  const userPrompt = buildUserPrompt(
    instanceName,
    videoPath,
    videoIndex,
    totalVideos,
    videoDuration
  );

  console.log(`  Pass: ${passName}`);

  try {
    const response = await ai.models.generateContent({
      model: googleModelName,
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\n${userPrompt}` },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        temperature: temperature,
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const messageContent = response.text;
    if (!messageContent) {
      throw new Error('No response content from Google AI');
    }

    let parsedLabels: { labels: LabelFromLLM[] };
    try {
      parsedLabels = JSON.parse(messageContent);
    } catch {
      console.error('Failed to parse Google AI response:', messageContent);
      throw new Error('Failed to parse Google AI response as JSON');
    }

    console.log(`  ${passName}: ${parsedLabels.labels.length} labels`);

    // Extract usage with Google-specific fields
    const usage = extractUsageStats(response.usageMetadata as GoogleUsageMetadata | undefined);

    return { labels: parsedLabels.labels, usage };
  } catch (error) {
    console.error('Google AI Studio API error:', error);
    throw new Error(
      `Google AI Studio API error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Analyze video for scene distractors using Google AI Studio directly
export async function analyzeSceneDistractors(
  videoPath: string,
  videoIndex: number,
  totalVideos: number,
  instanceName: string,
  videoDuration: number,
  model: string,
  temperature: number,
  apiKey: string,
  base64Video: string
): Promise<SceneDistractorResult> {
  const googleModelName = toGoogleModelName(model);
  const ai = new GoogleGenAI({ apiKey });
  const { mimeType, data: base64Data } = parseBase64DataUrl(base64Video);
  const userPrompt = buildSceneDistractorUserPrompt(
    instanceName,
    videoPath,
    videoIndex,
    totalVideos,
    videoDuration
  );

  console.log(`  Pass: Scene Distractors`);

  try {
    const response = await ai.models.generateContent({
      model: googleModelName,
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${SCENE_DISTRACTOR_SYSTEM_PROMPT}\n\n${userPrompt}` },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        temperature: temperature,
        responseMimeType: 'application/json',
        responseSchema: SCENE_DISTRACTOR_SCHEMA,
      },
    });

    const messageContent = response.text;
    if (!messageContent) {
      throw new Error('No response content from Google AI');
    }

    let parsedDistractors: SceneDistractorFromLLM;
    try {
      parsedDistractors = JSON.parse(messageContent);
    } catch {
      console.error('Failed to parse Google AI response:', messageContent);
      throw new Error('Failed to parse Google AI response as JSON');
    }

    const totalCount =
      (parsedDistractors.SA?.length || 0) +
      (parsedDistractors.SS?.length || 0) +
      (parsedDistractors.OA?.length || 0) +
      (parsedDistractors.OS?.length || 0) +
      (parsedDistractors.WO?.length || 0) +
      (parsedDistractors.WE?.length || 0);
    console.log(`  Scene Distractors: ${totalCount} items`);

    // Extract usage with Google-specific fields
    const usage = extractUsageStats(response.usageMetadata as GoogleUsageMetadata | undefined);

    return { distractors: parsedDistractors, usage };
  } catch (error) {
    console.error('Google AI Studio API error:', error);
    throw new Error(
      `Google AI Studio API error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Generate lexical distractors for captions (text-only, no video)
export async function analyzeLexicalDistractors(
  labels: Array<{ type: string; caption: string; value?: string }>,
  model: string,
  temperature: number,
  apiKey: string
): Promise<LexicalDistractorResult> {
  const googleModelName = toGoogleModelName(model);
  const ai = new GoogleGenAI({ apiKey });

  // Build input JSON from labels
  const inputData = buildLexicalDistractorInput(labels);
  const inputJson = JSON.stringify(inputData, null, 2);
  const userPrompt = buildLexicalDistractorUserPrompt(inputJson);

  console.log(`  Pass: Lexical Distractors (text-only)`);

  try {
    const response = await ai.models.generateContent({
      model: googleModelName,
      contents: [
        {
          role: 'user',
          parts: [{ text: `${LEXICAL_DISTRACTOR_SYSTEM_PROMPT}\n\n${userPrompt}` }],
        },
      ],
      config: {
        temperature: temperature,
        responseMimeType: 'application/json',
        responseSchema: LEXICAL_DISTRACTOR_SCHEMA,
      },
    });

    const messageContent = response.text;
    if (!messageContent) {
      throw new Error('No response content from Google AI');
    }

    let parsedDistractors: LexicalDistractorsByType;
    try {
      parsedDistractors = JSON.parse(messageContent);
    } catch {
      console.error('Failed to parse Google AI response:', messageContent);
      throw new Error('Failed to parse Google AI response as JSON');
    }

    // Count total lexical distractors
    let totalCount = 0;
    for (const type of ['SA', 'SS', 'OA', 'OS', 'WO', 'WE'] as const) {
      const items = parsedDistractors[type] || [];
      for (const item of items) {
        totalCount += item.distractors?.length || 0;
      }
    }
    console.log(`  Lexical Distractors: ${totalCount} items`);

    // Extract usage with Google-specific fields
    const usage = extractUsageStats(response.usageMetadata as GoogleUsageMetadata | undefined);

    return { distractors: parsedDistractors, usage };
  } catch (error) {
    console.error('Google AI Studio API error:', error);
    throw new Error(
      `Google AI Studio API error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
