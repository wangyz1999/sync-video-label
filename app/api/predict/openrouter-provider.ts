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
} from './types';
import { isGoogleModel } from './utils';

// OpenRouter API response usage format
interface OpenRouterUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

// Extract and normalize usage stats from OpenRouter response
function extractUsageStats(usage?: OpenRouterUsage): UsageStats {
  return {
    promptTokens: usage?.prompt_tokens || 0,
    completionTokens: usage?.completion_tokens || 0,
    totalTokens: usage?.total_tokens || 0,
  };
}

// Build content array for OpenRouter video request
function buildVideoContent(
  textPrompt: string,
  base64Video: string
): Array<{ type: string; text?: string; video_url?: { url: string } }> {
  return [
    {
      type: 'text',
      text: textPrompt,
    },
    {
      type: 'video_url',
      video_url: {
        url: base64Video,
      },
    },
  ];
}

// Parse error response from OpenRouter
async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const errorData = await response.json();
    return (
      errorData.error?.message ||
      errorData.error?.code ||
      errorData.message ||
      errorData.detail ||
      (typeof errorData.error === 'string' ? errorData.error : null) ||
      JSON.stringify(errorData)
    );
  } catch {
    try {
      const errorText = await response.text();
      return errorText || `HTTP ${response.status} ${response.statusText}`;
    } catch {
      return `HTTP ${response.status} ${response.statusText}`;
    }
  }
}

// Call OpenRouter API with proper configuration
async function callOpenRouter(
  model: string,
  systemPrompt: string,
  content: Array<{ type: string; text?: string; video_url?: { url: string } }>,
  temperature: number,
  apiKey: string,
  schemaName: string,
  schema: object
): Promise<{ content: string; usage: OpenRouterUsage }> {
  const googleModel = isGoogleModel(model);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
      'X-Title': process.env.OPENROUTER_SITE_NAME || 'Video Timeline Captioner',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: content,
        },
      ],
      temperature: temperature,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: schemaName,
          strict: true,
          schema: schema,
        },
      },
      usage: {
        include: true,
      },
      // Force google-ai-studio provider for Google models
      ...(googleModel && {
        provider: {
          order: ['google-ai-studio'],
          require_parameters: true,
        },
      }),
    }),
  });

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    console.error(`OpenRouter API error [${response.status}]:`, errorMessage);
    throw new Error(`OpenRouter API error ${response.status}: ${errorMessage}`);
  }

  const result = await response.json();
  const messageContent = result.choices?.[0]?.message?.content;

  if (!messageContent) {
    throw new Error('No response content from LLM');
  }

  return { content: messageContent, usage: result.usage };
}

// Analyze video for action, state, or world labels using OpenRouter
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

  const userPrompt = buildUserPrompt(
    instanceName,
    videoPath,
    videoIndex,
    totalVideos,
    videoDuration
  );
  const content = buildVideoContent(userPrompt, base64Video);

  console.log(`  Pass: ${passName}`);

  const { content: responseContent, usage } = await callOpenRouter(
    model,
    systemPrompt,
    content,
    temperature,
    apiKey,
    `video_prediction_${passType}`,
    schema
  );

  let parsedLabels: { labels: LabelFromLLM[] };
  try {
    parsedLabels = JSON.parse(responseContent);
  } catch {
    console.error('Failed to parse LLM response:', responseContent);
    throw new Error('Failed to parse LLM response as JSON');
  }

  console.log(`  ${passName}: ${parsedLabels.labels.length} labels`);

  return { labels: parsedLabels.labels, usage: extractUsageStats(usage) };
}

// Analyze video for scene distractors using OpenRouter
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
  const userPrompt = buildSceneDistractorUserPrompt(
    instanceName,
    videoPath,
    videoIndex,
    totalVideos,
    videoDuration
  );
  const content = buildVideoContent(userPrompt, base64Video);

  console.log(`  Pass: Scene Distractors`);

  const { content: responseContent, usage } = await callOpenRouter(
    model,
    SCENE_DISTRACTOR_SYSTEM_PROMPT,
    content,
    temperature,
    apiKey,
    'scene_distractors',
    SCENE_DISTRACTOR_SCHEMA
  );

  let parsedDistractors: SceneDistractorFromLLM;
  try {
    parsedDistractors = JSON.parse(responseContent);
  } catch {
    console.error('Failed to parse LLM response:', responseContent);
    throw new Error('Failed to parse LLM response as JSON');
  }

  const totalCount =
    (parsedDistractors.SA?.length || 0) +
    (parsedDistractors.SS?.length || 0) +
    (parsedDistractors.OA?.length || 0) +
    (parsedDistractors.OS?.length || 0) +
    (parsedDistractors.WO?.length || 0) +
    (parsedDistractors.WE?.length || 0);
  console.log(`  Scene Distractors: ${totalCount} items`);

  return { distractors: parsedDistractors, usage: extractUsageStats(usage) };
}

// Generate lexical distractors for captions (text-only, no video)
export async function analyzeLexicalDistractors(
  labels: Array<{ type: string; caption: string; value?: string }>,
  model: string,
  temperature: number,
  apiKey: string
): Promise<LexicalDistractorResult> {
  // Build input JSON from labels
  const inputData = buildLexicalDistractorInput(labels);
  const inputJson = JSON.stringify(inputData, null, 2);
  const userPrompt = buildLexicalDistractorUserPrompt(inputJson);

  console.log(`  Pass: Lexical Distractors (text-only)`);

  // Text-only content
  const content: Array<{ type: string; text?: string }> = [
    {
      type: 'text',
      text: userPrompt,
    },
  ];

  const googleModel = isGoogleModel(model);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
      'X-Title': process.env.OPENROUTER_SITE_NAME || 'Video Timeline Captioner',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: LEXICAL_DISTRACTOR_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: content,
        },
      ],
      temperature: temperature,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'lexical_distractors',
          strict: true,
          schema: LEXICAL_DISTRACTOR_SCHEMA,
        },
      },
      usage: {
        include: true,
      },
      // Force google-ai-studio provider for Google models
      ...(googleModel && {
        provider: {
          order: ['google-ai-studio'],
          require_parameters: true,
        },
      }),
    }),
  });

  if (!response.ok) {
    let errorMessage: string;
    try {
      const errorData = await response.json();
      errorMessage =
        errorData.error?.message ||
        errorData.error?.code ||
        errorData.message ||
        JSON.stringify(errorData);
    } catch {
      errorMessage = `HTTP ${response.status} ${response.statusText}`;
    }
    console.error(`OpenRouter API error [${response.status}]:`, errorMessage);
    throw new Error(`OpenRouter API error ${response.status}: ${errorMessage}`);
  }

  const result = await response.json();
  const messageContent = result.choices?.[0]?.message?.content;

  if (!messageContent) {
    throw new Error('No response content from LLM');
  }

  let parsedDistractors: LexicalDistractorsByType;
  try {
    parsedDistractors = JSON.parse(messageContent);
  } catch {
    console.error('Failed to parse LLM response:', messageContent);
    throw new Error('Failed to parse LLM response as JSON');
  }

  // Count total lexical distractors
  let lexicalCount = 0;
  for (const type of ['SA', 'SS', 'OA', 'OS', 'WO', 'WE'] as const) {
    const items = parsedDistractors[type] || [];
    for (const item of items) {
      lexicalCount += item.distractors?.length || 0;
    }
  }
  console.log(`  Lexical Distractors: ${lexicalCount} items`);

  return { distractors: parsedDistractors, usage: extractUsageStats(result.usage) };
}
