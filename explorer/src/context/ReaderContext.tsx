import React, { createContext, useContext, useState, useEffect } from 'react';
import { ViewMode, SortMode } from '../types/reader';

interface ReaderContextValue {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  zoom: number; // 0.5 to 3.0 (step 0.1)
  setZoom: (zoom: number) => void;
  videoSpeed: number; // 0.5 to 5.0 (step 0.25)
  setVideoSpeed: (speed: number) => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
  toggleMobileDrawer: () => void;
}

const ReaderContext = createContext<ReaderContextValue | null>(null);

const STORAGE_KEYS = {
  VIEW_MODE: 'explorer_view_mode',
  SORT_MODE: 'explorer_sort_mode',
  ZOOM: 'explorer_zoom',
  VIDEO_SPEED: 'explorer_speed',
};

export const ReaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    return (localStorage.getItem(STORAGE_KEYS.VIEW_MODE) as ViewMode) || 'tiles';
  });

  const [sortMode, setSortModeState] = useState<SortMode>(() => {
    return (localStorage.getItem(STORAGE_KEYS.SORT_MODE) as SortMode) || 'name';
  });

  const [zoom, setZoomState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ZOOM);
    return saved ? parseFloat(saved) : 1.0;
  });

  const [videoSpeed, setVideoSpeedState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VIDEO_SPEED);
    return saved ? parseFloat(saved) : 1.0;
  });

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
  };

  const setSortMode = (mode: SortMode) => {
    setSortModeState(mode);
    localStorage.setItem(STORAGE_KEYS.SORT_MODE, mode);
  };

  const setZoom = (z: number) => {
    const clamped = Math.min(Math.max(z, 0.5), 3.0);
    setZoomState(clamped);
    localStorage.setItem(STORAGE_KEYS.ZOOM, clamped.toString());
  };

  const setVideoSpeed = (s: number) => {
    const clamped = Math.min(Math.max(s, 0.25), 5.0);
    setVideoSpeedState(clamped);
    localStorage.setItem(STORAGE_KEYS.VIDEO_SPEED, clamped.toString());
  };

  // Sync zoom CSS variable to document root
  useEffect(() => {
    document.documentElement.style.setProperty('--zoom', zoom.toString());
  }, [zoom]);

  const value: ReaderContextValue = {
    viewMode,
    setViewMode,
    sortMode,
    setSortMode,
    zoom,
    setZoom,
    videoSpeed,
    setVideoSpeed,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    toggleMobileDrawer: () => setIsMobileDrawerOpen(prev => !prev),
  };

  return <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>;
};

export function useReader() {
  const ctx = useContext(ReaderContext);
  if (!ctx) throw new Error('useReader must be used within a ReaderProvider');
  return ctx;
}

