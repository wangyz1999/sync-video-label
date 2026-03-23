'use client';

import { useEffect, useRef } from 'react';
import { EVENT_TYPES } from '../types';

interface InstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstructionModal({ isOpen, onClose }: InstructionModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-amber-400">Instructions</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 text-slate-300">
          {/* Project Format */}
          <section>
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Project File Format</h3>
            <p className="text-sm mb-2">Import a JSON file with the following structure:</p>
            <pre className="text-xs bg-slate-800 p-3 rounded-lg overflow-x-auto">
              {`{
  "name": "Project Name",
  "instances": [
    {
      "id": "unique-id",
      "name": "Instance Name",
      "videos": ["path/to/video1.mp4", "path/to/video2.mp4"]
    }
  ]
}`}
            </pre>
            <p className="text-xs text-slate-500 mt-2">
              Videos are loaded from <code className="bg-slate-800 px-1 rounded">data/videos/</code>{' '}
              directory.
            </p>
          </section>

          {/* Multi-Video */}
          <section>
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Multi-Video Labeling</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>
                  Each instance can have <strong>up to 6 videos</strong> displayed side-by-side
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>
                  All videos play <strong>synchronously</strong> with a shared timeline
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>
                  Use <strong>layout buttons</strong> to change video grid arrangement
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>
                  Click a video to make it <strong>active</strong> (highlighted, with audio)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>
                  Use <strong>Label tabs</strong> above timeline to switch which video&apos;s labels
                  are shown
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>
                  Labels are created for the <strong>currently active video tab</strong>
                </span>
              </li>
            </ul>
          </section>

          {/* Event Types */}
          <section>
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Event Label Types</h3>
            <div className="grid gap-2">
              {EVENT_TYPES.map((evt) => (
                <div
                  key={evt.code}
                  className="flex items-start gap-3 p-2 rounded-lg bg-slate-800/50"
                >
                  <span
                    className="px-2 py-1 rounded text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: evt.color }}
                  >
                    {evt.code}
                  </span>
                  <div>
                    <span className="font-medium text-slate-200">{evt.fullName}</span>
                    <p className="text-sm text-slate-400">{evt.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* How to Label */}
          <section>
            <h3 className="text-lg font-semibold text-slate-100 mb-3">How to Label</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Import a project JSON file using &quot;Import Project&quot; button</li>
              <li>Click on a video to select it for labeling</li>
              <li>Select an event type from the colored buttons below the timeline</li>
              <li>Click and drag on the timeline to create a label segment</li>
              <li>Enter a caption for the label (required for export)</li>
              <li>Set the number of occurrences if applicable</li>
              <li>Export the annotation when complete, then move to next instance</li>
            </ol>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between p-2 rounded bg-slate-800/50">
                <span className="text-slate-400">Play / Pause</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 text-slate-200">Space</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-800/50">
                <span className="text-slate-400">Move 1 second</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 text-slate-200">← →</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-800/50">
                <span className="text-slate-400">Move 1 frame</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 text-slate-200">Ctrl + ← →</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-800/50">
                <span className="text-slate-400">Delete label</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 text-slate-200">Delete</kbd>
              </div>
            </div>
          </section>

          {/* Timeline Interactions */}
          <section>
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Timeline Interactions</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>
                  <strong>Drag the yellow playhead</strong> to seek through all videos
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>
                  <strong>Drag on empty timeline area</strong> to create a new label
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>
                  <strong>Drag a label</strong> to move it along the timeline
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>
                  <strong>Drag label edges</strong> to resize the time range
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>
                  <strong>Double-click a label</strong> to edit caption inline
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>
                  <strong>Right-click a label</strong> for more options (play, edit, duplicate,
                  delete)
                </span>
              </li>
            </ul>
          </section>

          {/* Auto-save */}
          <section>
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Auto-save</h3>
            <p className="text-sm">
              Your progress is automatically saved every 30 seconds and when you make changes. If
              you reload the page, you&apos;ll be prompted to restore your auto-saved progress.
              Auto-saves are stored separately from exported annotations.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
