import { useState, useCallback, useEffect, useRef } from 'react';

interface ResizableOptions {
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export function useResizable({
  initialWidth = 260,
  minWidth = 140,
  maxWidth = 600,
}: ResizableOptions = {}) {
  const [width, setWidth] = useState<number>(initialWidth);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(initialWidth);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  }, [width]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.min(Math.max(startWidthRef.current + delta, minWidth), maxWidth);
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth]);

  return { width, isResizing, startResizing, setWidth };
}

