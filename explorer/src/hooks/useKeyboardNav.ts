import { useEffect } from 'react';

interface KeyboardNavConfig {
  isLightboxOpen: boolean;
  onPrevItem?: () => void;
  onNextItem?: () => void;
  onCloseLightbox?: () => void;
  onPrevFolder?: () => void;
  onNextFolder?: () => void;
  onTrashCurrent?: () => void;
  onToggleViewMode?: () => void;
  onToggleFullscreen?: () => void;
}

export function useKeyboardNav(config: KeyboardNavConfig) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (config.isLightboxOpen) {
        // Lightbox open shortcuts
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          config.onPrevItem?.();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          config.onNextItem?.();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          config.onCloseLightbox?.();
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          config.onTrashCurrent?.();
        }
      } else {
        // Main view shortcuts
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          config.onPrevFolder?.();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          config.onNextFolder?.();
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          config.onTrashCurrent?.();
        } else if (e.key.toLowerCase() === 't' || e.key.toLowerCase() === 'c') {
          e.preventDefault();
          config.onToggleViewMode?.();
        } else if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          config.onToggleFullscreen?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config]);
}

