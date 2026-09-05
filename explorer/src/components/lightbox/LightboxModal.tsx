import React, { useState, useEffect, useRef } from 'react';
import { useLightbox } from '../../context/LightboxContext';
import { useSource } from '../../context/SourceContext';
import { useReader } from '../../context/ReaderContext';
import { useMediaUrl } from '../../hooks/useMediaUrl';
import { useTouchGestures } from '../../hooks/useTouchGestures';
import { formatFileSize } from '../../services/mediaDetector';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Loader2,
} from 'lucide-react';
import styles from './Lightbox.module.css';

export const LightboxModal: React.FC = () => {
  const {
    isOpen,
    currentIndex,
    items,
    currentItem,
    close,
    next,
    prev,
    hasNext,
    hasPrev,
    trashCurrent,
  } = useLightbox();

  const { activeSource } = useSource();
  const { videoSpeed } = useReader();
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { url, loading } = useMediaUrl(
    activeSource,
    currentItem?.path || '',
    currentItem?.name || '',
    isOpen && Boolean(currentItem)
  );

  // Touch swipe support on mobile
  const stageRef = useTouchGestures<HTMLDivElement>({
    onSwipeLeft: () => {
      if (hasNext) next();
    },
    onSwipeRight: () => {
      if (hasPrev) prev();
    },
    onSwipeDown: () => {
      close();
    },
  });

  useEffect(() => {
    setDimensions(null);
  }, [currentIndex]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = videoSpeed;
    }
  }, [videoSpeed, url]);

  if (!isOpen || !currentItem) return null;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
  };

  const handleTrash = async () => {
    const confirmed = window.confirm(`Move "${currentItem.name}" to trash?`);
    if (confirmed) {
      await trashCurrent();
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.topbar}>
        <div className={styles.meta}>
          <span className={styles.pageBadge}>
            {currentIndex + 1} / {items.length}
          </span>
          <span className={styles.filename} title={currentItem.name}>
            {currentItem.name}
          </span>
          <span className={styles.subMeta}>
            {formatFileSize(currentItem.size)}
            {dimensions && ` • ${dimensions.w} × ${dimensions.h} px`}
          </span>
        </div>

        <div className={styles.actions}>
          {activeSource?.isWritable && (
            <button
              onClick={handleTrash}
              title="Move file to trash (Backspace)"
              style={{
                color: '#f87171',
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Trash2 size={18} />
            </button>
          )}

          <button
            onClick={close}
            title="Close viewer (Esc)"
            style={{
              color: 'var(--text-muted)',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div ref={stageRef} className={styles.mainStage}>
        {hasPrev && (
          <button
            className={`${styles.navBtn} ${styles.prevBtn}`}
            onClick={prev}
            aria-label="Previous item"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {loading && (
          <div style={{ color: 'var(--text-dim)' }}>
            <Loader2 size={40} className="animate-spin" />
          </div>
        )}

        {url && currentItem.type === 'image' && (
          <img
            src={url}
            alt={currentItem.name}
            className={styles.mediaImage}
            onLoad={handleImageLoad}
          />
        )}

        {url && currentItem.type === 'video' && (
          <video
            ref={videoRef}
            src={url}
            className={styles.mediaVideo}
            autoPlay
            loop
            muted
            controls
            playsInline
          />
        )}

        {url && currentItem.type === 'pdf' && (
          <iframe src={url} title={currentItem.name} className={styles.mediaPdf} />
        )}

        {hasNext && (
          <button
            className={`${styles.navBtn} ${styles.nextBtn}`}
            onClick={next}
            aria-label="Next item"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

