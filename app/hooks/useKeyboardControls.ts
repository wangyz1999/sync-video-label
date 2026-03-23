import { useEffect, useCallback } from 'react';

interface KeyboardControlsProps {
  onMoveSecond: (direction: number) => void;
  onMoveFrame: (direction: number) => void;
  onMoveSelectedLabel: (seconds: number) => void;
  onDeleteSelectedLabel: () => void;
  onTogglePlay: () => void;
  onGoToStart: () => void;
  onGoToEnd: () => void;
  hasSelectedLabel: boolean;
  isInputFocused: () => boolean;
}

export function useKeyboardControls({
  onMoveSecond,
  onMoveFrame,
  onMoveSelectedLabel,
  onDeleteSelectedLabel,
  onTogglePlay,
  onGoToStart,
  onGoToEnd,
  hasSelectedLabel,
  isInputFocused,
}: KeyboardControlsProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't handle if typing in an input/textarea
    if (isInputFocused()) return;

    const isCtrl = e.ctrlKey || e.metaKey;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (hasSelectedLabel && !isCtrl) {
          // Move selected label left by 1 second
          onMoveSelectedLabel(-1);
        } else if (isCtrl) {
          // Move video by 1 frame
          onMoveFrame(-1);
        } else {
          // Move video by 1 second
          onMoveSecond(-1);
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (hasSelectedLabel && !isCtrl) {
          // Move selected label right by 1 second
          onMoveSelectedLabel(1);
        } else if (isCtrl) {
          // Move video by 1 frame
          onMoveFrame(1);
        } else {
          // Move video by 1 second
          onMoveSecond(1);
        }
        break;

      case ' ':
        e.preventDefault();
        onTogglePlay();
        break;

      case 'Delete':
      case 'Backspace':
        if (hasSelectedLabel) {
          e.preventDefault();
          onDeleteSelectedLabel();
        }
        break;

      case 'Home':
        e.preventDefault();
        onGoToStart();
        break;

      case 'End':
        e.preventDefault();
        onGoToEnd();
        break;

      case 'Escape':
        // Deselect is handled by the component
        break;
    }
  }, [
    hasSelectedLabel,
    isInputFocused,
    onMoveSecond,
    onMoveFrame,
    onMoveSelectedLabel,
    onDeleteSelectedLabel,
    onTogglePlay,
    onGoToStart,
    onGoToEnd,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

