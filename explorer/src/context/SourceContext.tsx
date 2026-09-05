import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StorageSource, S3Credentials, ZeroStorageCredentials } from '../types/source';
import { sourceRegistry, FileSystemSource, S3StorageSource, ZeroStorageSource } from '../sources';
import {
  getSavedFileSystemHandle,
  getSavedS3Config,
  getSavedZeroStorageConfig,
  getActiveSourceId,
  saveActiveSourceId,
  clearActiveSourceId,
} from '../services/storageDb';

interface SourceContextValue {
  activeSource: StorageSource | null;
  sources: StorageSource[];
  isConnected: boolean;
  isConnecting: boolean;
  rootName: string;
  isSourceSelectorOpen: boolean;
  isS3ConfigOpen: boolean;
  isZeroStorageConfigOpen: boolean;
  openSourceSelector: () => void;
  closeSourceSelector: () => void;
  openS3Config: () => void;
  closeS3Config: () => void;
  openZeroStorageConfig: () => void;
  closeZeroStorageConfig: () => void;
  selectSource: (sourceId: string, forceNew?: boolean) => Promise<boolean>;
  pickNewFileSystemFolder: () => Promise<boolean>;
  configureS3: (creds: S3Credentials) => Promise<boolean>;
  configureZeroStorage: (creds: ZeroStorageCredentials) => Promise<boolean>;
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
  const [isZeroStorageConfigOpen, setIsZeroStorageConfigOpen] = useState<boolean>(false);

  // Auto-restore previously saved source on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const activeSourceId = await getActiveSourceId();

        const restoreZeroStorage = async (): Promise<boolean> => {
          const savedZero = await getSavedZeroStorageConfig();
          if (savedZero) {
            const zeroSource = new ZeroStorageSource(savedZero);
            sourceRegistry.register(zeroSource);
            const ok = await zeroSource.connect();
            if (ok && isMounted) {
              setActiveSource(zeroSource);
              setIsConnected(true);
              return true;
            }
          }
          return false;
        };

        const restoreS3 = async (): Promise<boolean> => {
          const savedS3 = await getSavedS3Config();
          if (savedS3) {
            const s3Source = new S3StorageSource(savedS3);
            sourceRegistry.register(s3Source);
            if (isMounted) {
              setActiveSource(s3Source);
              setIsConnected(true);
              return true;
            }
          }
          return false;
        };

        const restoreFs = async (): Promise<boolean> => {
          const savedFs = await getSavedFileSystemHandle();
          if (savedFs) {
            const fsSource = new FileSystemSource(savedFs);
            sourceRegistry.register(fsSource);
            if (isMounted) {
              setActiveSource(fsSource);
              setIsConnected(true);
              return true;
            }
          }
          return false;
        };

        if (activeSourceId === 'zerostorage') {
          if (await restoreZeroStorage()) return;
        } else if (activeSourceId === 's3-cloud') {
          if (await restoreS3()) return;
        } else if (activeSourceId === 'local-fs') {
          if (await restoreFs()) return;
        }

        // Fallback if no activeSourceId or preferred failed
        if (await restoreZeroStorage()) return;
        if (await restoreS3()) return;
        if (await restoreFs()) return;
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

  const selectSource = useCallback(async (sourceId: string, forceNew = false): Promise<boolean> => {
    const src = sourceRegistry.get(sourceId);
    if (!src) return false;

    if (src.type === 's3' && (!src.isConnected() || forceNew)) {
      setIsS3ConfigOpen(true);
      return false;
    }

    if (src.type === 'zerostorage' && (!src.isConnected() || forceNew)) {
      setIsZeroStorageConfigOpen(true);
      return false;
    }

    try {
      const ok = await src.connect(forceNew);
      if (ok) {
        await saveActiveSourceId(sourceId);
        setActiveSource(Object.assign(Object.create(Object.getPrototypeOf(src)), src));
        setIsConnected(true);
        setIsSourceSelectorOpen(false);
        return true;
      }
    } catch (err) {
      console.error('Error selecting source:', err);
    }
    return false;
  }, []);

  const pickNewFileSystemFolder = useCallback(async (): Promise<boolean> => {
    let fsSource = sourceRegistry.get('local-fs');
    if (!fsSource) {
      fsSource = new FileSystemSource();
      sourceRegistry.register(fsSource);
    }
    const ok = await fsSource.connect(true);
    if (ok) {
      await saveActiveSourceId('local-fs');
      setActiveSource(Object.assign(Object.create(Object.getPrototypeOf(fsSource)), fsSource));
      setIsConnected(true);
      setIsSourceSelectorOpen(false);
      return true;
    }
    return false;
  }, []);

  const configureS3 = useCallback(async (creds: S3Credentials): Promise<boolean> => {
    const s3 = new S3StorageSource(creds);
    await s3.setCredentials(creds);
    sourceRegistry.register(s3);
    const ok = await s3.connect();
    if (ok) {
      await saveActiveSourceId('s3-cloud');
      setActiveSource(s3);
      setIsConnected(true);
      setIsS3ConfigOpen(false);
      setIsSourceSelectorOpen(false);
      return true;
    }
    return false;
  }, []);

  const configureZeroStorage = useCallback(async (creds: ZeroStorageCredentials): Promise<boolean> => {
    const zero = new ZeroStorageSource(creds);
    await zero.setCredentials(creds);
    sourceRegistry.register(zero);
    const ok = await zero.connect();
    if (ok) {
      await saveActiveSourceId('zerostorage');
      setActiveSource(zero);
      setIsConnected(true);
      setIsZeroStorageConfigOpen(false);
      setIsSourceSelectorOpen(false);
      return true;
    }
    return false;
  }, []);

  const disconnectSource = useCallback(async () => {
    if (activeSource?.disconnect) {
      await activeSource.disconnect();
    }
    await clearActiveSourceId();
    setActiveSource(null);
    setIsConnected(false);
    setIsSourceSelectorOpen(false);
  }, [activeSource]);

  const value: SourceContextValue = {
    activeSource,
    sources,
    isConnected,
    isConnecting,
    rootName: activeSource ? activeSource.getRootName() : '',
    isSourceSelectorOpen,
    isS3ConfigOpen,
    isZeroStorageConfigOpen,
    openSourceSelector: () => setIsSourceSelectorOpen(true),
    closeSourceSelector: () => setIsSourceSelectorOpen(false),
    openS3Config: () => setIsS3ConfigOpen(true),
    closeS3Config: () => setIsS3ConfigOpen(false),
    openZeroStorageConfig: () => setIsZeroStorageConfigOpen(true),
    closeZeroStorageConfig: () => setIsZeroStorageConfigOpen(false),
    selectSource,
    pickNewFileSystemFolder,
    configureS3,
    configureZeroStorage,
    disconnectSource,
  };

  return <SourceContext.Provider value={value}>{children}</SourceContext.Provider>;
};

export function useSource() {
  const ctx = useContext(SourceContext);
  if (!ctx) throw new Error('useSource must be used within a SourceProvider');
  return ctx;
}

