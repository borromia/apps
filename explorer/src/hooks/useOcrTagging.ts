import { useState, useCallback } from 'react';
import { OcrProgress } from '../types/ocr';
import { MediaItem } from '../types/media';
import { StorageSource } from '../types/source';
import { runOcrOnBlobs } from '../services/ocrClassifier';
import { saveFolderTags } from '../services/storageDb';

export function useOcrTagging(
  source: StorageSource | null,
  currentPath: string,
  mediaItems: MediaItem[],
  onTagsUpdated: (tags: string[]) => void
) {
  const [progress, setProgress] = useState<OcrProgress>({
    status: 'idle',
    currentPage: 0,
    totalPages: 0,
  });

  const runOcr = useCallback(async () => {
    if (!source || mediaItems.length === 0) return;

    // Filter image items only
    const imageItems = mediaItems.filter(m => m.type === 'image');
    if (imageItems.length === 0) {
      alert('No image files found in this folder for OCR extraction.');
      return;
    }

    setProgress({
      status: 'running',
      currentPage: 0,
      totalPages: imageItems.length,
    });

    try {
      // Fetch blobs sequentially or in small batches
      const blobs: { name: string; blob: Blob }[] = [];
      for (const item of imageItems) {
        try {
          const blob = await source.getFileBlob(item.path, item.name);
          blobs.push({ name: item.name, blob });
        } catch (err) {
          console.warn(`Could not get blob for ${item.name}`, err);
        }
      }

      const { tags } = await runOcrOnBlobs(blobs, (curr, total, name) => {
        setProgress({
          status: 'running',
          currentPage: curr,
          totalPages: total,
          currentFilename: name,
        });
      });

      if (tags.length > 0) {
        await saveFolderTags(currentPath, tags);
        onTagsUpdated(tags);
      }

      setProgress({
        status: 'completed',
        currentPage: imageItems.length,
        totalPages: imageItems.length,
      });

      setTimeout(() => {
        setProgress(prev => (prev.status === 'completed' ? { ...prev, status: 'idle' } : prev));
      }, 4000);
    } catch (err: any) {
      console.error('OCR Extraction failed:', err);
      setProgress({
        status: 'error',
        currentPage: 0,
        totalPages: imageItems.length,
        errorMessage: err.message || 'OCR failed',
      });
    }
  }, [source, currentPath, mediaItems, onTagsUpdated]);

  return { progress, runOcr };
}

