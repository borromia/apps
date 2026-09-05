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

    source
      .getFileBlob(path, fileName)
      .then((blob) => {
        if (!isMounted) return;
        createdUrl = URL.createObjectURL(blob);
        setUrl(createdUrl);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error(`Failed to load blob for ${fileName}:`, err);
        setError(err.message || 'Failed to load media');
        setLoading(false);
      });

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [source, path, fileName, enabled]);

  return { url, loading, error };
}

