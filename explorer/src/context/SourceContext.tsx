import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StorageSource, S3Credentials } from '../types/source';
import { sourceRegistry, FileSystemSource, S3StorageSource } from '../sources';
import { getSavedFileSystemHandle, getSavedS3Config } from '../services/storageDb';

interface SourceContextValue {
  activeSource: StorageSource | null;
  sources: StorageSource[];
  isConnected: boolean;
  isConnecting: boolean;
  rootName: string;
  isSourceSelectorOpen: boolean;
  isS3ConfigOpen: boolean;
  openSourceSelector: () => void;
  closeSourceSelector: () => void;
  openS3Config: () => void;
  closeS3Config: () => void;
  selectSource: (sourceId: string) => Promise<boolean>;
  configureS3: (creds: S3Credentials) => Promise<boolean>;
  disconnectSource: () => Promise<void>;
}

const SourceContext = createContext<SourceContextValue | null>(null);

export const SourceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sources] = useState<StorageSource[]>(() => sourceRegistry.getAll());
  const [activeSource, setActiveSource] = useState<StorageSource | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(true);
  const [isSourceSelectorOpen, setIsSourceSelectorOpen] = useState<boolean>(false);
  const [isS3ConfigOpen, setIsS3ConfigOpen] = useState<boolean>(false);

  // Auto-restore previously saved source on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const savedFs = await getSavedFileSystemHandle();
        if (savedFs) {
          const fsSource = new FileSystemSource(savedFs);
          sourceRegistry.register(fsSource);
          if (isMounted) {
            setActiveSource(fsSource);
            setIsConnected(true);
            setIsConnecting(false);
            return;
          }
        }

        const savedS3 = await getSavedS3Config();
        if (savedS3) {
          const s3Source = new S3StorageSource(savedS3);
          sourceRegistry.register(s3Source);
          if (isMounted) {
            setActiveSource(s3Source);
            setIsConnected(true);
            setIsConnecting(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Auto restore source failed:', err);
      } finally {
        if (isMounted) setIsConnecting(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectSource = useCallback(async (sourceId: string): Promise<boolean> => {
    const src = sourceRegistry.get(sourceId);
    if (!src) return false;

    if (src.type === 's3' && !src.isConnected()) {
      setIsS3ConfigOpen(true);
      return false;
    }

    try {
      const ok = await src.connect();
      if (ok) {
        setActiveSource(src);
        setIsConnected(true);
        setIsSourceSelectorOpen(false);
        return true;
      }
    } catch (err) {
      console.error('Error selecting source:', err);
    }
    return false;
  }, []);

  const configureS3 = useCallback(async (creds: S3Credentials): Promise<boolean> => {
    const s3 = new S3StorageSource(creds);
    await s3.setCredentials(creds);
    sourceRegistry.register(s3);
    const ok = await s3.connect();
    if (ok) {
      setActiveSource(s3);
      setIsConnected(true);
      setIsS3ConfigOpen(false);
      setIsSourceSelectorOpen(false);
      return true;
    }
    return false;
  }, []);

  const disconnectSource = useCallback(async () => {
    if (activeSource?.disconnect) {
      await activeSource.disconnect();
    }
    setActiveSource(null);
    setIsConnected(false);
  }, [activeSource]);

  const value: SourceContextValue = {
    activeSource,
    sources,
    isConnected,
    isConnecting,
    rootName: activeSource ? activeSource.getRootName() : '',
    isSourceSelectorOpen,
    isS3ConfigOpen,
    openSourceSelector: () => setIsSourceSelectorOpen(true),
    closeSourceSelector: () => setIsSourceSelectorOpen(false),
    openS3Config: () => setIsS3ConfigOpen(true),
    closeS3Config: () => setIsS3ConfigOpen(false),
    selectSource,
    configureS3,
    disconnectSource,
  };

  return <SourceContext.Provider value={value}>{children}</SourceContext.Provider>;
};

export function useSource() {
  const ctx = useContext(SourceContext);
  if (!ctx) throw new Error('useSource must be used within a SourceProvider');
  return ctx;
}

