// Google AI model pricing (per 1M tokens in USD)
// Reference: https://ai.google.dev/pricing

interface ModelPricing {
  input: number;        // Per 1M input tokens
  inputLong?: number;   // Per 1M input tokens for prompts > 200k
  output: number;       // Per 1M output tokens (including thinking)
  outputLong?: number;  // Per 1M output tokens for prompts > 200k
  cached?: number;      // Per 1M cached tokens
  cachedLong?: number;  // Per 1M cached tokens for prompts > 200k
}

// Pricing for Google AI models (Paid Tier)
const GOOGLE_MODEL_PRICING: Record<string, ModelPricing> = {
  // Gemini 3 Pro Preview
  'gemini-3-pro-preview': {
    input: 2.00,
    inputLong: 4.00,
    output: 12.00,
    outputLong: 18.00,
    cached: 0.20,
    cachedLong: 0.40,
  },
  // Gemini 3 Flash Preview
  'gemini-3-flash-preview': {
    input: 0.50,
    output: 3.00,
    cached: 0.05,
  },
  // Gemini 2.5 Pro
  'gemini-2.5-pro': {
    input: 1.25,
    inputLong: 2.50,
    output: 10.00,
    outputLong: 15.00,
    cached: 0.125,
    cachedLong: 0.25,
  },
  'gemini-2.5-pro-preview': {
    input: 1.25,
    inputLong: 2.50,
    output: 10.00,
    outputLong: 15.00,
    cached: 0.125,
    cachedLong: 0.25,
  },
  'gemini-2.5-pro-preview-05-06': {
    input: 1.25,
    inputLong: 2.50,
    output: 10.00,
    outputLong: 15.00,
    cached: 0.125,
    cachedLong: 0.25,
  },
  // Gemini 2.5 Flash
  'gemini-2.5-flash': {
    input: 0.30,
    output: 2.50,
    cached: 0.03,
  },
  'gemini-2.5-flash-preview': {
    input: 0.30,
    output: 2.50,
    cached: 0.03,
  },
  'gemini-2.5-flash-preview-05-20': {
    input: 0.30,
    output: 2.50,
    cached: 0.03,
  },
  // Gemini 2.0 Flash
  'gemini-2.0-flash': {
    input: 0.10,
    output: 0.40,
    cached: 0.025,
  },
  'gemini-2.0-flash-exp': {
    input: 0.10,
    output: 0.40,
    cached: 0.025,
  },
  // Gemini 1.5 Pro
  'gemini-1.5-pro': {
    input: 1.25,
    inputLong: 2.50,
    output: 5.00,
    outputLong: 10.00,
    cached: 0.3125,
    cachedLong: 0.625,
  },
  // Gemini 1.5 Flash
  'gemini-1.5-flash': {
    input: 0.075,
    inputLong: 0.15,
    output: 0.30,
    outputLong: 0.60,
    cached: 0.01875,
    cachedLong: 0.0375,
  },
};

// Threshold for "long" pricing (200k tokens)
const LONG_CONTEXT_THRESHOLD = 200_000;

/**
 * Calculate cost for Google AI model usage
 * @param model - Model name (e.g., 'gemini-2.5-pro', 'google/gemini-2.5-pro')
 * @param promptTokens - Number of input/prompt tokens
 * @param completionTokens - Number of output tokens (including thinking tokens)
 * @param cachedTokens - Number of cached content tokens (optional)
 * @returns Cost in USD, or null if model pricing not found
 */
export function calculateGoogleCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
  cachedTokens: number = 0
): number | null {
  // Normalize model name (remove 'google/' prefix if present)
  const normalizedModel = model.replace('google/', '').toLowerCase();
  
  // Find pricing for this model (try exact match first, then prefix match)
  let pricing = GOOGLE_MODEL_PRICING[normalizedModel];
  
  if (!pricing) {
    // Try to find a matching model by prefix
    for (const [key, value] of Object.entries(GOOGLE_MODEL_PRICING)) {
      if (normalizedModel.startsWith(key) || key.startsWith(normalizedModel)) {
        pricing = value;
        break;
      }
    }
  }
  
  if (!pricing) {
    console.warn(`No pricing found for Google model: ${model}`);
    return null;
  }
  
  // Determine if this is a "long" context (> 200k input tokens)
  const isLongContext = promptTokens > LONG_CONTEXT_THRESHOLD;
  
  // Get appropriate rates
  const inputRate = isLongContext && pricing.inputLong ? pricing.inputLong : pricing.input;
  const outputRate = isLongContext && pricing.outputLong ? pricing.outputLong : pricing.output;
  const cachedRate = isLongContext && pricing.cachedLong ? pricing.cachedLong : (pricing.cached || 0);
  
  // Calculate costs (rates are per 1M tokens)
  const inputCost = (promptTokens / 1_000_000) * inputRate;
  const outputCost = (completionTokens / 1_000_000) * outputRate;
  const cachedCost = (cachedTokens / 1_000_000) * cachedRate;
  
  return inputCost + outputCost + cachedCost;
}

/**
 * Check if a model is a Google model
 */
export function isGoogleModelForPricing(model: string): boolean {
  const normalizedModel = model.replace('google/', '').toLowerCase();
  return normalizedModel.includes('gemini');
}

