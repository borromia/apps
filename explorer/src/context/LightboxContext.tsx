import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { MediaItem } from '../types/media';
import { useExplorer } from './ExplorerContext';

interface LightboxContextValue {
  isOpen: boolean;
  currentIndex: number;
  items: MediaItem[];
  currentItem: MediaItem | null;
  openAt: (index: number, items: MediaItem[]) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  trashCurrent: () => Promise<boolean>;
}

const LightboxContext = createContext<LightboxContextValue | null>(null);

export const LightboxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { trashSingleFile } = useExplorer();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [items, setItems] = useState<MediaItem[]>([]);

  const openAt = useCallback((index: number, newItems: MediaItem[]) => {
    setItems(newItems);
    setCurrentIndex(Math.min(Math.max(index, 0), Math.max(newItems.length - 1, 0)));
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const next = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, items.length - 1));
  }, [items.length]);

  const prev = useCallback(() => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const hasNext = currentIndex < items.length - 1;
  const hasPrev = currentIndex > 0;
  const currentItem = useMemo(() => items[currentIndex] || null, [items, currentIndex]);

  const trashCurrent = useCallback(async (): Promise<boolean> => {
    if (!currentItem) return false;

    const fileName = currentItem.name;
    const ok = await trashSingleFile(fileName);
    if (ok) {
      // Remove from current items array
      const remaining = items.filter((_, idx) => idx !== currentIndex);
      setItems(remaining);

      if (remaining.length === 0) {
        close();
      } else if (currentIndex >= remaining.length) {
        setCurrentIndex(remaining.length - 1);
      }
      return true;
    }
    return false;
  }, [currentItem, currentIndex, items, trashSingleFile, close]);

  const value: LightboxContextValue = {
    isOpen,
    currentIndex,
    items,
    currentItem,
    openAt,
    close,
    next,
    prev,
    hasNext,
    hasPrev,
    trashCurrent,
  };

  return <LightboxContext.Provider value={value}>{children}</LightboxContext.Provider>;
};

export function useLightbox() {
  const ctx = useContext(LightboxContext);
  if (!ctx) throw new Error('useLightbox must be used within a LightboxProvider');
  return ctx;
}

