'use client';

import { useState, useRef, useLayoutEffect } from 'react';

export type CaptionAlignment = 'left' | 'center' | 'right';

export interface LLMSettings {
  model:
    | 'google/gemini-3-pro-preview'
    | 'google/gemini-3-flash-preview'
    | 'google/gemini-2.5-flash'
    | 'google/gemini-2.5-pro'
    | 'z-ai/glm-4.6v'
    | 'amazon/nova-2-lite-v1'
    | 'nvidia/nemotron-nano-12b-v2-vl:free'
    | 'nvidia/nemotron-nano-12b-v2-vl';
  temperature: number;
  showCaptions: boolean; // Show/hide video captions
  captionFontSize: number; // Font size for video captions in pixels
  captionAlignment: CaptionAlignment; // Caption horizontal alignment
  provider: 'openrouter' | 'google-ai-studio'; // API provider to use
}

export const DEFAULT_LLM_SETTINGS: LLMSettings = {
  model: 'google/gemini-3-pro-preview',
  temperature: 1.0,
  showCaptions: true,
  captionFontSize: 14,
  captionAlignment: 'center',
  provider: 'google-ai-studio',
};

const MODEL_OPTIONS = [
  { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro', description: 'More capable' },
  {
    value: 'google/gemini-3-flash-preview',
    label: 'Gemini 3 Flash',
    description: 'Fast, cost-effective',
  },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Latest, fast' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Latest, fast' },
  { value: 'z-ai/glm-4.6v', label: 'GLM 4.6V', description: 'Chinese multimodal' },
  { value: 'amazon/nova-2-lite-v1', label: 'Nova 2 Lite', description: 'AWS vision model' },
  {
    value: 'nvidia/nemotron-nano-12b-v2-vl:free',
    label: 'Nemotron Nano (Free)',
    description: 'Free tier',
  },
  { value: 'nvidia/nemotron-nano-12b-v2-vl', label: 'Nemotron Nano', description: 'NVIDIA vision' },
] as const;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LLMSettings;
  onSaveSettings: (settings: LLMSettings) => void;
}

export function SettingsModal({ isOpen, onClose, settings, onSaveSettings }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<LLMSettings>(settings);
  const prevIsOpenRef = useRef(isOpen);

  // Sync with external settings when modal opens - use layout effect for synchronous update
  useLayoutEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalSettings(settings);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, settings]);

  // Filter models based on provider
  const availableModels =
    localSettings.provider === 'google-ai-studio'
      ? MODEL_OPTIONS.filter((option) => option.value.startsWith('google/'))
      : MODEL_OPTIONS;

  // If provider is Google Direct and current model is not a Google model, switch to default Google model
  const handleProviderChange = (provider: LLMSettings['provider']) => {
    if (provider === 'google-ai-studio' && !localSettings.model.startsWith('google/')) {
      setLocalSettings((prev) => ({ ...prev, provider, model: 'google/gemini-3-pro-preview' }));
    } else {
      setLocalSettings((prev) => ({ ...prev, provider }));
    }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_LLM_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-slate-100">AI Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <svg
              className="w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4 space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Provider</label>
            <select
              value={localSettings.provider}
              onChange={(e) => handleProviderChange(e.target.value as LLMSettings['provider'])}
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              disabled={!localSettings.model.startsWith('google/')}
            >
              <option value="openrouter">OpenRouter</option>
              <option value="google-ai-studio">Google AI Studio (Direct)</option>
            </select>
            {!localSettings.model.startsWith('google/') && (
              <p className="text-[10px] text-slate-500 mt-1">
                Provider selection only available for Google models
              </p>
            )}
          </div>

          {/* Model Selection - Dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Model</label>
            <select
              value={localSettings.model}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  model: e.target.value as LLMSettings['model'],
                })
              }
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              {availableModels.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} — {option.description}
                </option>
              ))}
            </select>
            {localSettings.provider === 'google-ai-studio' && (
              <p className="text-[10px] text-slate-500 mt-1">
                Only Google models available with Google AI Studio (Direct)
              </p>
            )}
          </div>

          {/* Temperature */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">Temperature</label>
              <span className="text-xs text-violet-400 font-mono">
                {localSettings.temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={localSettings.temperature}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })
              }
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700" />

          {/* Show Captions Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">Show Captions</label>
            <button
              onClick={() =>
                setLocalSettings({ ...localSettings, showCaptions: !localSettings.showCaptions })
              }
              className={`relative w-10 h-5 rounded-full transition-colors ${
                localSettings.showCaptions ? 'bg-amber-500' : 'bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  localSettings.showCaptions ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Caption Font Size */}
          <div className={localSettings.showCaptions ? '' : 'opacity-50 pointer-events-none'}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">Caption Size</label>
              <span className="text-xs text-amber-400 font-mono">
                {localSettings.captionFontSize}px
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="28"
              step="1"
              value={localSettings.captionFontSize}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, captionFontSize: parseInt(e.target.value) })
              }
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Caption Alignment */}
          <div className={localSettings.showCaptions ? '' : 'opacity-50 pointer-events-none'}>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Caption Alignment
            </label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => setLocalSettings({ ...localSettings, captionAlignment: align })}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    localSettings.captionAlignment === align
                      ? 'bg-amber-500 text-slate-900'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  {align === 'left' && (
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M3 6h18M3 12h12M3 18h18" />
                    </svg>
                  )}
                  {align === 'center' && (
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M3 6h18M6 12h12M3 18h18" />
                    </svg>
                  )}
                  {align === 'right' && (
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M3 6h18M9 12h12M3 18h18" />
                    </svg>
                  )}
                  {align.charAt(0).toUpperCase() + align.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Caption Preview */}
          <div className={localSettings.showCaptions ? '' : 'opacity-50 pointer-events-none'}>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Preview</label>
            <div className="p-2 bg-slate-800 rounded-lg">
              <div
                className={`flex ${
                  localSettings.captionAlignment === 'left'
                    ? 'justify-start'
                    : localSettings.captionAlignment === 'right'
                      ? 'justify-end'
                      : 'justify-center'
                }`}
              >
                <div
                  className="px-2 py-0.5 rounded bg-blue-500/80 text-white inline-block"
                  style={{ fontSize: localSettings.captionFontSize }}
                >
                  Sample caption
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-300 transition-colors"
          >
            Reset
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-500 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
