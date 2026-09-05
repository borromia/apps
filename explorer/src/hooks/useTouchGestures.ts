import { useEffect, useRef } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
  onSwipeUp?: () => void;
  threshold?: number; // min pixels to trigger swipe
}

export function useTouchGestures<T extends HTMLElement>(config: SwipeConfig) {
  const ref = useRef<T | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const threshold = config.threshold || 50;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current || e.changedTouches.length === 0) return;

      const deltaX = e.changedTouches[0].clientX - touchStart.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStart.current.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (Math.max(absX, absY) > threshold) {
        if (absX > absY) {
          if (deltaX > 0 && config.onSwipeRight) {
            config.onSwipeRight();
          } else if (deltaX < 0 && config.onSwipeLeft) {
            config.onSwipeLeft();
          }
        } else {
          if (deltaY > 0 && config.onSwipeDown) {
            config.onSwipeDown();
          } else if (deltaY < 0 && config.onSwipeUp) {
            config.onSwipeUp();
          }
        }
      }

      touchStart.current = null;
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [config, threshold]);

  return ref;
}

