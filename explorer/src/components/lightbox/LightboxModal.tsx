import React, { useState, useEffect, useRef } from 'react';
import { useLightbox } from '../../context/LightboxContext';
import { useSource } from '../../context/SourceContext';
import { useReader } from '../../context/ReaderContext';
import { useMediaUrl } from '../../hooks/useMediaUrl';
import { useTouchGestures } from '../../hooks/useTouchGestures';
import { formatFileSize } from '../../services/mediaDetector';
import { MediaItem } from '../../types/media';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Loader2,
  Film,
  Play,
} from 'lucide-react';
import styles from './Lightbox.module.css';

const MAX_VIDEO_AUTO_LOAD_SIZE = 20 * 1024 * 1024; // 20 MB

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
  const [forceLoadLargeVideo, setForceLoadLargeVideo] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Turn animation state
  const [turnDirection, setTurnDirection] = useState<'next' | 'prev' | null>(null);
  const [outgoingItem, setOutgoingItem] = useState<MediaItem | null>(null);
  const [outgoingUrl, setOutgoingUrl] = useState<string | null>(null);
  const prevIndexRef = useRef<number>(currentIndex);
  const turnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLargeVideo = Boolean(
    currentItem && currentItem.type === 'video' && (currentItem.size || 0) > MAX_VIDEO_AUTO_LOAD_SIZE
  );

  const shouldLoadMedia = isOpen && Boolean(currentItem) && (!isLargeVideo || forceLoadLargeVideo);

  const { url, loading } = useMediaUrl(
    activeSource,
    currentItem?.path || '',
    currentItem?.name || '',
    shouldLoadMedia
  );

  // Prefetch next and previous media for instant Apple Books paper turn transitions
  const nextItem = items[currentIndex + 1] || null;
  const prevItem = items[currentIndex - 1] || null;
  useMediaUrl(activeSource, nextItem?.path || '', nextItem?.name || '', isOpen && Boolean(nextItem));
  useMediaUrl(activeSource, prevItem?.path || '', prevItem?.name || '', isOpen && Boolean(prevItem));

  // Detect index changes and trigger 3D paper curl
  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      const dir = currentIndex > prevIndexRef.current ? 'next' : 'prev';
      const outItem = items[prevIndexRef.current] || null;

      if (turnTimerRef.current) {
        clearTimeout(turnTimerRef.current);
      }

      setOutgoingItem(outItem);
      setOutgoingUrl(url);
      setTurnDirection(dir);

      turnTimerRef.current = setTimeout(() => {
        setTurnDirection(null);
        setOutgoingItem(null);
        setOutgoingUrl(null);
      }, 520);

      prevIndexRef.current = currentIndex;
    }
  }, [currentIndex, items, url]);

  useEffect(() => {
    return () => {
      if (turnTimerRef.current) {
        clearTimeout(turnTimerRef.current);
      }
    };
  }, []);

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
    setForceLoadLargeVideo(false);
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

  const renderMediaContent = (
    item: MediaItem,
    mediaUrl: string | null,
    isLoading: boolean,
    isOutgoing = false
  ) => {
    const itemIsLargeVideo = item.type === 'video' && item.size > MAX_VIDEO_AUTO_LOAD_SIZE;

    return (
      <>
        {isLoading && !isOutgoing && (
          <div style={{ color: 'var(--text-dim)', position: 'absolute' }}>
            <Loader2 size={40} className="animate-spin" />
          </div>
        )}

        {mediaUrl && item.type === 'image' && (
          <img
            src={mediaUrl}
            alt={item.name}
            className={styles.mediaImage}
            onLoad={!isOutgoing ? handleImageLoad : undefined}
          />
        )}

        {itemIsLargeVideo && !forceLoadLargeVideo && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              padding: '48px 32px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              maxWidth: '440px',
              textAlign: 'center',
            }}
          >
            <Film size={64} style={{ color: '#38bdf8', opacity: 0.9 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-all' }}>
                {item.name}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {formatFileSize(item.size)} • Large Video (&gt; 20MB)
              </span>
            </div>
            {!isOutgoing && (
              <button
                onClick={() => setForceLoadLargeVideo(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'var(--accent-primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginTop: '8px',
                  boxShadow: '0 4px 12px rgba(56, 189, 248, 0.25)',
                }}
              >
                <Play size={16} fill="#ffffff" />
                Load &amp; Play Video
              </button>
            )}
          </div>
        )}

        {mediaUrl && item.type === 'video' && (!itemIsLargeVideo || forceLoadLargeVideo) && (
          <video
            ref={!isOutgoing ? videoRef : undefined}
            src={mediaUrl}
            className={styles.mediaVideo}
            autoPlay
            loop
            muted
            controls={!isOutgoing}
            playsInline
          />
        )}

        {mediaUrl && item.type === 'pdf' && (
          <iframe src={mediaUrl} title={item.name} className={styles.mediaPdf} />
        )}
      </>
    );
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

        <div className={styles.bookStage}>
          {/* Active / Incoming Page */}
          <div className={styles.pageLeaf}>
            {turnDirection === 'next' && <div className={styles.underneathShadow} />}
            {renderMediaContent(currentItem, url, loading, false)}
          </div>

          {/* Turning Page (Apple Books 3D Curl) on NEXT */}
          {turnDirection === 'next' && outgoingItem && (
            <div className={styles.turningLeafNext}>
              <div className={styles.curlSheenNext} />
              <div className={styles.paperBackside} />
              {renderMediaContent(outgoingItem, outgoingUrl, false, true)}
            </div>
          )}

          {/* Turning Page (Apple Books 3D Curl) on PREV */}
          {turnDirection === 'prev' && outgoingItem && (
            <div className={styles.turningLeafPrev}>
              <div className={styles.curlSheenPrev} />
              <div className={styles.paperBackside} />
              {renderMediaContent(currentItem, url, false, false)}
            </div>
          )}
        </div>

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
