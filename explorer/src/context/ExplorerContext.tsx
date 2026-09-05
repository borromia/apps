import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { DirectoryListing, FolderSearchResult } from '../types/source';
import { MediaItem } from '../types/media';
import { useSource } from './SourceContext';
import { useReader } from './ReaderContext';
import { detectMediaType, getMimeType } from '../services/mediaDetector';
import { getFolderTags, saveLastPath, getLastPath } from '../services/storageDb';
import { debounce } from 'lodash-es';

interface ExplorerContextValue {
  currentPath: string;
  currentListing: DirectoryListing | null;
  mediaItems: MediaItem[];
  currentTags: string[];
  setTags: (tags: string[]) => void;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: FolderSearchResult[];
  expandedPaths: Set<string>;
  togglePathExpanded: (path: string) => void;
  openFolder: (path: string) => Promise<void>;
  navigateSibling: (direction: 1 | -1) => Promise<void>;
  trashCurrentFolder: () => Promise<boolean>;
  trashSingleFile: (fileName: string) => Promise<boolean>;
  refreshCurrent: () => Promise<void>;
}

const ExplorerContext = createContext<ExplorerContextValue | null>(null);

export const ExplorerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeSource, isConnected } = useSource();
  const { sortMode } = useReader();

  const [currentPath, setCurrentPath] = useState<string>('');
  const [currentListing, setCurrentListing] = useState<DirectoryListing | null>(null);
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FolderSearchResult[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['']));

  // Convert files from listing into MediaItems
  const mediaItems: MediaItem[] = useMemo(() => {
    if (!currentListing) return [];
    return currentListing.files.map(f => ({
      name: f.name,
      path: currentListing.path,
      fullPath: currentListing.path ? `${currentListing.path}/${f.name}` : f.name,
      size: f.size || 0,
      lastModified: f.lastModified,
      type: detectMediaType(f.name),
      mimeType: getMimeType(f.name),
      handle: f.handle as FileSystemFileHandle,
    }));
  }, [currentListing]);

  // Load a directory
  const loadPath = useCallback(async (path: string) => {
    if (!activeSource || !activeSource.isConnected()) return;

    setIsLoading(true);
    setError(null);

    try {
      const listing = await activeSource.listDirectory(path);
      setCurrentListing(listing);
      setCurrentPath(listing.path);
      await saveLastPath(listing.path);

      // Load tags
      const tags = await getFolderTags(listing.path);
      setCurrentTags(tags || []);

      // Auto-expand path parents in tree
      setExpandedPaths(prev => {
        const next = new Set(prev);
        const segs = listing.path.split('/').filter(Boolean);
        let accumulated = '';
        next.add(''); // root always expanded
        for (const seg of segs) {
          accumulated = accumulated ? `${accumulated}/${seg}` : seg;
          next.add(accumulated);
        }
        return next;
      });

      // Update URL param
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (listing.path) {
          url.searchParams.set('folder', listing.path);
        } else {
          url.searchParams.delete('folder');
        }
        window.history.replaceState({}, '', url.toString());
      }
    } catch (err: any) {
      console.error('Failed to load directory:', err);
      setError(err.message || 'Failed to read directory contents');
      // If a subpath fails (e.g. from previous source session), fallback to root directory
      if (path !== '') {
        try {
          const rootListing = await activeSource.listDirectory('');
          setCurrentListing(rootListing);
          setCurrentPath('');
          setExpandedPaths(new Set(['']));
          await saveLastPath('');
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('folder');
            window.history.replaceState({}, '', url.toString());
          }
          setError(null);
        } catch (fallbackErr) {
          console.error('Root fallback failed:', fallbackErr);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeSource]);

  // Auto load root or last path on source connection
  useEffect(() => {
    if (isConnected && activeSource) {
      setExpandedPaths(new Set(['']));
      const urlParams = new URLSearchParams(window.location.search);
      const urlFolder = urlParams.get('folder');

      if (urlFolder) {
        loadPath(urlFolder);
      } else {
        getLastPath().then(last => {
          loadPath(last || '');
        });
      }
    } else {
      setCurrentListing(null);
      setCurrentPath('');
      setCurrentTags([]);
      setExpandedPaths(new Set(['']));
    }
  }, [isConnected, activeSource, loadPath]);

  // Debounced directory search
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string, source) => {
        if (!source || !query.trim()) {
          setSearchResults([]);
          return;
        }
        try {
          const res = await source.searchDirectories(query);
          setSearchResults(res);
        } catch (err) {
          console.warn('Search failed:', err);
        }
      }, 200),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery, activeSource);
  }, [searchQuery, activeSource, debouncedSearch]);

  const togglePathExpanded = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const openFolder = useCallback(async (path: string) => {
    await loadPath(path);
  }, [loadPath]);

  const refreshCurrent = useCallback(async () => {
    await loadPath(currentPath);
  }, [loadPath, currentPath]);

  // Sibling navigation
  const navigateSibling = useCallback(async (direction: 1 | -1) => {
    if (!activeSource || !currentListing) return;

    try {
      const parentPath = currentListing.parentPath || '';
      const siblings = activeSource.getSortedSiblings
        ? await activeSource.getSortedSiblings(parentPath, sortMode === 'count')
        : (await activeSource.listDirectory(parentPath)).directories.map(d => d.path);

      if (siblings.length <= 1) return;

      const currentIndex = siblings.indexOf(currentListing.path);
      if (currentIndex === -1) return;

      const targetIndex = currentIndex + direction;
      if (targetIndex >= 0 && targetIndex < siblings.length) {
        await loadPath(siblings[targetIndex]);
      }
    } catch (err) {
      console.warn('Sibling navigation failed:', err);
    }
  }, [activeSource, currentListing, sortMode, loadPath]);

  // Move entire folder to trash
  const trashCurrentFolder = useCallback(async (): Promise<boolean> => {
    if (!activeSource || !activeSource.moveToTrash || !currentListing || !currentPath) {
      return false;
    }

    const confirmed = window.confirm(`Are you sure you want to move "${currentListing.name}" to Trash?`);
    if (!confirmed) return false;

    try {
      // Find sibling before trashing so we can navigate to it
      const parentPath = currentListing.parentPath || '';
      const siblings = activeSource.getSortedSiblings
        ? await activeSource.getSortedSiblings(parentPath, sortMode === 'count')
        : (await activeSource.listDirectory(parentPath)).directories.map(d => d.path);

      const currentIndex = siblings.indexOf(currentListing.path);
      let nextPathToOpen: string | null = null;
      if (siblings.length > 1) {
        if (currentIndex < siblings.length - 1) {
          nextPathToOpen = siblings[currentIndex + 1];
        } else if (currentIndex > 0) {
          nextPathToOpen = siblings[currentIndex - 1];
        }
      }

      const success = await activeSource.moveToTrash(currentPath);
      if (success) {
        if (nextPathToOpen) {
          await loadPath(nextPathToOpen);
        } else {
          await loadPath(parentPath);
        }
        return true;
      }
    } catch (err) {
      console.error('Failed to trash folder:', err);
      alert('Failed to move folder to trash. Ensure write permissions are granted.');
    }
    return false;
  }, [activeSource, currentListing, currentPath, sortMode, loadPath]);

  // Move single file to trash
  const trashSingleFile = useCallback(async (fileName: string): Promise<boolean> => {
    if (!activeSource || !activeSource.moveToTrash || !currentPath) return false;

    try {
      const success = await activeSource.moveToTrash(currentPath, fileName);
      if (success) {
        // Update local listing state surgically without full page reset
        setCurrentListing(prev => {
          if (!prev) return null;
          const updatedFiles = prev.files.filter(f => f.name !== fileName);
          const removedFile = prev.files.find(f => f.name === fileName);
          const newTotalSize = prev.totalSize - (removedFile?.size || 0);
          return {
            ...prev,
            files: updatedFiles,
            totalSize: Math.max(newTotalSize, 0),
          };
        });
        return true;
      }
    } catch (err) {
      console.error('Failed to trash file:', err);
    }
    return false;
  }, [activeSource, currentPath]);

  const value: ExplorerContextValue = {
    currentPath,
    currentListing,
    mediaItems,
    currentTags,
    setTags: setCurrentTags,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    searchResults,
    expandedPaths,
    togglePathExpanded,
    openFolder,
    navigateSibling,
    trashCurrentFolder,
    trashSingleFile,
    refreshCurrent,
  };

  return <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>;
};

export function useExplorer() {
  const ctx = useContext(ExplorerContext);
  if (!ctx) throw new Error('useExplorer must be used within an ExplorerProvider');
  return ctx;
}

