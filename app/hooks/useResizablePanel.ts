import { useState, useRef, useCallback, useEffect, MouseEvent as ReactMouseEvent } from 'react';

// Default and constraints for the right panel width
const DEFAULT_PANEL_WIDTH = 384; // 24rem = 384px (w-96)
const MIN_PANEL_WIDTH = 280;
const MAX_PANEL_WIDTH = 600;

export function useResizablePanel(initialWidth = DEFAULT_PANEL_WIDTH) {
  const [panelWidth, setPanelWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  // Handle resize drag start
  const handleResizeStart = useCallback(
    (e: ReactMouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStartX.current = e.clientX;
      dragStartWidth.current = panelWidth;
    },
    [panelWidth]
  );

  // Handle resize drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const delta = dragStartX.current - e.clientX;
      const newWidth = Math.min(
        MAX_PANEL_WIDTH,
        Math.max(MIN_PANEL_WIDTH, dragStartWidth.current + delta)
      );
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return {
    panelWidth,
    isDragging,
    handleResizeStart,
  };
}
