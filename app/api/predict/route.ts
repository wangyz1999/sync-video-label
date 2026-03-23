import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

import {
  PredictRequest,
  SceneDistractorFromLLM,
  PredictionDistractor,
  LabelType,
  UsageStats,
  LexicalDistractorsByType,
  PredictionLabelWithLexical,
  AnalysisPassResult,
  SceneDistractorResult,
  LexicalDistractorResult,
} from './types';
import { getPredictionDir, ensureDir, videoToBase64, delay, isGoogleModel } from './utils';
import { calculateGoogleCost } from './pricing';
import * as googleProvider from './google-provider';
import * as openrouterProvider from './openrouter-provider';

// Disable timeout for this route (unlimited)
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// Delay between API requests (ms) to prevent overwhelming the API
const REQUEST_DELAY_MS = 300;

// Progress event types
type StepType = 'action' | 'state' | 'world' | 'sceneDistractors' | 'lexicalDistractors';
interface ProgressEvent {
  type: 'progress';
  videoIndex: number;
  step: StepType;
  status: 'loading' | 'done';
}
interface CompleteEvent {
  type: 'complete';
  prediction: object;
  filePath: string;
  usage: object;
}
interface ErrorEvent {
  type: 'error';
  error: string;
}
type SSEEvent = ProgressEvent | CompleteEvent | ErrorEvent;

// Transform scene distractors to storage format (no time range)
function transformDistractors(
  distractors: SceneDistractorFromLLM,
  instanceId: string,
  videoIndex: number,
  startCounter: number
): { distractors: PredictionDistractor[]; nextCounter: number } {
  const transformed: PredictionDistractor[] = [];
  let counter = startCounter;

  const types: LabelType[] = ['SA', 'SS', 'OA', 'OS', 'WO', 'WE'];
  for (const type of types) {
    const items = distractors[type] || [];
    for (const caption of items) {
      counter++;
      transformed.push({
        id: `distractor-${instanceId}-${counter}`,
        type,
        videoIndex,
        caption,
      });
    }
  }

  return { distractors: transformed, nextCounter: counter };
}

// Count total distractors
function countDistractors(distractors: SceneDistractorFromLLM): number {
  return (
    (distractors.SA?.length || 0) +
    (distractors.SS?.length || 0) +
    (distractors.OA?.length || 0) +
    (distractors.OS?.length || 0) +
    (distractors.WO?.length || 0) +
    (distractors.WE?.length || 0)
  );
}

// POST - Generate prediction using LLM with SSE progress streaming
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send SSE event
      const sendEvent = (event: SSEEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      try {
        const body = (await request.json()) as PredictRequest;
        const {
          instanceId,
          instanceName,
          videoPaths,
          videoDuration,
          model,
          temperature,
          provider = 'openrouter',
          projectFolder,
        } = body;

        // Determine which API key to use based on provider
        const googleModel = isGoogleModel(model);
        const useGoogleDirect = provider === 'google-ai-studio' && googleModel;

        let apiKey: string | undefined;

        if (useGoogleDirect) {
          apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
          if (!apiKey) {
            sendEvent({ type: 'error', error: 'Google API key not configured' });
            controller.close();
            return;
          }
        } else {
          apiKey = process.env.OPENROUTER_API_KEY;
          if (!apiKey) {
            sendEvent({ type: 'error', error: 'OpenRouter API key not configured' });
            controller.close();
            return;
          }
        }

        // Choose provider functions
        const analyzePass = useGoogleDirect
          ? googleProvider.analyzeVideoPass
          : openrouterProvider.analyzeVideoPass;

        const analyzeDistractors = useGoogleDirect
          ? googleProvider.analyzeSceneDistractors
          : openrouterProvider.analyzeSceneDistractors;

        const analyzeLexical = useGoogleDirect
          ? googleProvider.analyzeLexicalDistractors
          : openrouterProvider.analyzeLexicalDistractors;

        // Process all videos in parallel
        const PASSES_PER_VIDEO = 5; // action, state, world, sceneDistractors, lexicalDistractors

        // Store results per video
        interface VideoResults {
          actionResult: AnalysisPassResult | null;
          stateResult: AnalysisPassResult | null;
          worldResult: AnalysisPassResult | null;
          sceneDistractorResult: SceneDistractorResult | null;
          lexicalResult: LexicalDistractorResult | null;
        }
        const videoResults: VideoResults[] = videoPaths.map(() => ({
          actionResult: null,
          stateResult: null,
          worldResult: null,
          sceneDistractorResult: null,
          lexicalResult: null,
        }));

        // Create all promises for parallel execution
        const allPromises: Promise<void>[] = [];

        for (let videoIndex = 0; videoIndex < videoPaths.length; videoIndex++) {
          const videoPath = videoPaths[videoIndex];
          const baseDelayMs = videoIndex * PASSES_PER_VIDEO * REQUEST_DELAY_MS;

          // Load video once
          const base64VideoPromise = videoToBase64(videoPath);

          // Step 1: Action labels (SA, OA)
          const actionPromise = (async () => {
            const base64Video = await base64VideoPromise;
            await delay(baseDelayMs);
            const result = await analyzePass(
              videoPath,
              videoIndex,
              videoPaths.length,
              instanceName,
              videoDuration,
              model,
              temperature,
              apiKey!,
              'action',
              base64Video
            );
            videoResults[videoIndex].actionResult = result;
            sendEvent({ type: 'progress', videoIndex, step: 'action', status: 'done' });
            return result;
          })();

          // Step 2: State labels (SS, OS)
          const statePromise = (async () => {
            const base64Video = await base64VideoPromise;
            await delay(baseDelayMs + REQUEST_DELAY_MS);
            const result = await analyzePass(
              videoPath,
              videoIndex,
              videoPaths.length,
              instanceName,
              videoDuration,
              model,
              temperature,
              apiKey!,
              'state',
              base64Video
            );
            videoResults[videoIndex].stateResult = result;
            sendEvent({ type: 'progress', videoIndex, step: 'state', status: 'done' });
            return result;
          })();

          // Step 3: World labels (WO, WE)
          const worldPromise = (async () => {
            const base64Video = await base64VideoPromise;
            await delay(baseDelayMs + REQUEST_DELAY_MS * 2);
            const result = await analyzePass(
              videoPath,
              videoIndex,
              videoPaths.length,
              instanceName,
              videoDuration,
              model,
              temperature,
              apiKey!,
              'world',
              base64Video
            );
            videoResults[videoIndex].worldResult = result;
            sendEvent({ type: 'progress', videoIndex, step: 'world', status: 'done' });
            return result;
          })();

          // Step 4: Scene distractors
          const sceneDistractorPromise = (async () => {
            const base64Video = await base64VideoPromise;
            await delay(baseDelayMs + REQUEST_DELAY_MS * 3);
            const result = await analyzeDistractors(
              videoPath,
              videoIndex,
              videoPaths.length,
              instanceName,
              videoDuration,
              model,
              temperature,
              apiKey!,
              base64Video
            );
            videoResults[videoIndex].sceneDistractorResult = result;
            sendEvent({ type: 'progress', videoIndex, step: 'sceneDistractors', status: 'done' });
            return result;
          })();

          // Step 5: Lexical distractors (depends on action, state, AND world)
          const lexicalPromise = (async () => {
            const [actionResult, stateResult, worldResult] = await Promise.all([
              actionPromise,
              statePromise,
              worldPromise,
            ]);

            // Signal that lexical is now starting (action, state, AND world are done)
            sendEvent({
              type: 'progress',
              videoIndex,
              step: 'lexicalDistractors',
              status: 'loading',
            });

            const combinedLabels = [
              ...actionResult.labels,
              ...stateResult.labels,
              ...worldResult.labels,
            ];

            if (combinedLabels.length === 0) {
              sendEvent({
                type: 'progress',
                videoIndex,
                step: 'lexicalDistractors',
                status: 'done',
              });
              return null;
            }

            await delay(REQUEST_DELAY_MS);
            const result = await analyzeLexical(
              combinedLabels.map((l) => ({ type: l.type, caption: l.caption, value: l.value })),
              model,
              temperature,
              apiKey!
            );
            videoResults[videoIndex].lexicalResult = result;
            sendEvent({ type: 'progress', videoIndex, step: 'lexicalDistractors', status: 'done' });
            return result;
          })();

          allPromises.push(
            actionPromise.then(() => {}),
            statePromise.then(() => {}),
            worldPromise.then(() => {}),
            sceneDistractorPromise.then(() => {}),
            lexicalPromise.then(() => {})
          );
        }

        // Wait for all to complete
        await Promise.all(allPromises);

        // Collect and transform results
        const allLabelsWithLexical: PredictionLabelWithLexical[] = [];
        const allSceneDistractors: PredictionDistractor[] = [];
        const usageStats: Array<{
          action: UsageStats;
          state: UsageStats;
          world: UsageStats;
          sceneDistractors: UsageStats;
          lexicalDistractors: UsageStats | null;
        }> = [];
        let labelCounter = 0;
        let distractorCounter = 0;

        for (let videoIndex = 0; videoIndex < videoPaths.length; videoIndex++) {
          const { actionResult, stateResult, worldResult, sceneDistractorResult, lexicalResult } =
            videoResults[videoIndex];

          if (!actionResult || !stateResult || !worldResult || !sceneDistractorResult) {
            throw new Error(`Missing results for video ${videoIndex}`);
          }

          const combinedLabels = [
            ...actionResult.labels,
            ...stateResult.labels,
            ...worldResult.labels,
          ];

          // Transform labels
          let labelsWithLexical: PredictionLabelWithLexical[] = combinedLabels.map((label) => {
            labelCounter++;
            const startTime = Math.max(0, Math.min(label.startTime, Math.floor(videoDuration)));
            let endTime = Math.max(0, Math.min(label.endTime, Math.floor(videoDuration)));
            // Ensure end > start to prevent invalid time ranges
            if (endTime <= startTime) {
              endTime = startTime + 1;
            }
            return {
              id: `pred-${instanceId}-${labelCounter}`,
              type: label.type,
              videoIndex: videoIndex,
              startTime,
              endTime,
              caption: label.caption,
              quantity: 1,
              // Include other for OA/OS types (teammate or enemy)
              ...(label.other !== undefined && { other: label.other }),
              // Include intent for action types (SA/OA)
              ...(label.intent !== undefined && { intent: label.intent }),
              // Include intentDistractors for action types (SA/OA)
              ...(label.intentDistractors !== undefined && {
                intentDistractors: label.intentDistractors,
              }),
              // Include value for state types (SS/OS)
              ...(label.value !== undefined && { value: label.value }),
            };
          });

          // Apply lexical distractors if available
          if (lexicalResult) {
            const labelsByType: Record<string, typeof labelsWithLexical> = {};
            for (const label of labelsWithLexical) {
              if (!labelsByType[label.type]) labelsByType[label.type] = [];
              labelsByType[label.type].push(label);
            }

            labelsWithLexical = labelsWithLexical.map((label) => {
              const typeDistractors =
                lexicalResult.distractors[label.type as keyof LexicalDistractorsByType] || [];
              const typeLabels = labelsByType[label.type] || [];
              const labelIndex = typeLabels.indexOf(label);
              const matchingDistractor = typeDistractors.find((d) => d.id === labelIndex);
              return {
                ...label,
                lexicalDistractors: matchingDistractor?.distractors || undefined,
              };
            });
          }

          allLabelsWithLexical.push(...labelsWithLexical);

          // Transform scene distractors
          const { distractors: transformedDistractors, nextCounter: nextDistractorCounter } =
            transformDistractors(
              sceneDistractorResult.distractors,
              instanceId,
              videoIndex,
              distractorCounter
            );
          allSceneDistractors.push(...transformedDistractors);
          distractorCounter = nextDistractorCounter;

          usageStats.push({
            action: actionResult.usage,
            state: stateResult.usage,
            world: worldResult.usage,
            sceneDistractors: sceneDistractorResult.usage,
            lexicalDistractors: lexicalResult?.usage || null,
          });

          const lexicalCount = labelsWithLexical.reduce(
            (sum, l) => sum + (l.lexicalDistractors?.length || 0),
            0
          );
          console.log(
            `Video ${videoIndex + 1} processed: ${labelsWithLexical.length} labels, ${countDistractors(sceneDistractorResult.distractors)} scene distractors, ${lexicalCount} lexical distractors`
          );
        }

        // Build prediction object
        const prediction = {
          instanceId,
          instanceName,
          videoPaths,
          videoDuration,
          labels: allLabelsWithLexical,
          sceneDistractors: allSceneDistractors.length > 0 ? allSceneDistractors : undefined,
          lastModified: new Date().toISOString(),
          generatedBy: model,
        };

        // Save prediction to file
        const predictionDir = getPredictionDir(projectFolder);
        await ensureDir(predictionDir);
        const filePath = path.join(predictionDir, `${instanceId}.json`);
        await fs.writeFile(filePath, JSON.stringify(prediction, null, 2), 'utf-8');

        // Aggregate usage stats
        const aggregatedUsage = {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
          cached_content_tokens: 0,
          thoughts_tokens: 0,
        };

        for (const videoUsage of usageStats) {
          for (const passUsage of [
            videoUsage.action,
            videoUsage.state,
            videoUsage.world,
            videoUsage.sceneDistractors,
          ]) {
            aggregatedUsage.prompt_tokens += passUsage.promptTokens || 0;
            aggregatedUsage.completion_tokens += passUsage.completionTokens || 0;
            aggregatedUsage.total_tokens += passUsage.totalTokens || 0;
            aggregatedUsage.cached_content_tokens += passUsage.cachedContentTokens || 0;
            aggregatedUsage.thoughts_tokens += passUsage.thoughtsTokens || 0;
          }
          if (videoUsage.lexicalDistractors) {
            aggregatedUsage.prompt_tokens += videoUsage.lexicalDistractors.promptTokens || 0;
            aggregatedUsage.completion_tokens +=
              videoUsage.lexicalDistractors.completionTokens || 0;
            aggregatedUsage.total_tokens += videoUsage.lexicalDistractors.totalTokens || 0;
            aggregatedUsage.cached_content_tokens +=
              videoUsage.lexicalDistractors.cachedContentTokens || 0;
            aggregatedUsage.thoughts_tokens += videoUsage.lexicalDistractors.thoughtsTokens || 0;
          }
        }

        // Calculate cost for Google models
        let cost: number | null = null;
        if (useGoogleDirect && googleModel) {
          cost = calculateGoogleCost(
            model,
            aggregatedUsage.prompt_tokens,
            aggregatedUsage.completion_tokens,
            aggregatedUsage.cached_content_tokens
          );
        }

        const detailedUsage = {
          ...aggregatedUsage,
          cost: cost,
          perVideo: usageStats,
        };

        // Send completion event
        const relativePath = projectFolder
          ? `${projectFolder}/prediction/${instanceId}.json`
          : `data/prediction/${instanceId}.json`;
        sendEvent({
          type: 'complete',
          prediction,
          filePath: relativePath,
          usage: detailedUsage,
        });
      } catch (error) {
        console.error('Prediction generation error:', error);
        sendEvent({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
