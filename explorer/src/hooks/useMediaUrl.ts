import { useState, useEffect } from 'react';
import { StorageSource } from '../types/source';

export function useMediaUrl(
  source: StorageSource | null,
  path: string,
  fileName: string,
  enabled = true
): { url: string | null; loading: boolean; error: string | null } {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!source || !fileName || !enabled) {
      setUrl(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let createdUrl: string | null = null;

    setLoading(true);
    setError(null);

    const loadMedia = async () => {
      try {
        if (source.getFileUrl) {
          const directUrl = await source.getFileUrl(path, fileName);
          if (!isMounted) return;
          setUrl(directUrl);
          setLoading(false);
          return;
        }

        const blob = await source.getFileBlob(path, fileName);
        if (!isMounted) return;
        createdUrl = URL.createObjectURL(blob);
        setUrl(createdUrl);
        setLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        console.error(`Failed to load media for ${fileName}:`, err);
        setError(err.message || 'Failed to load media');
        setLoading(false);
      }
    };

    loadMedia();

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [source, path, fileName, enabled]);

  return { url, loading, error };
}

