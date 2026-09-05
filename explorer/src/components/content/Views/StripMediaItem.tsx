import React, { useRef, useState, useEffect } from 'react';
import { MediaItem } from '../../../types/media';
import { useSource } from '../../../context/SourceContext';
import { useReader } from '../../../context/ReaderContext';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { Loader2, Film } from 'lucide-react';
import { formatFileSize } from '../../../services/mediaDetector';
import styles from './StripMediaItem.module.css';

interface StripMediaItemProps {
  item: MediaItem;
  index: number;
  total: number;
}

export const StripMediaItem: React.FC<StripMediaItemProps> = ({ item, index, total }) => {
  const { activeSource } = useSource();
  const { videoSpeed } = useReader();
  const [isInView, setIsInView] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
          }
        });
      },
      { rootMargin: '600px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const MAX_VIDEO_AUTO_LOAD_SIZE = 20 * 1024 * 1024; // 20 MB
  const isLargeVideo = item.type === 'video' && item.size > MAX_VIDEO_AUTO_LOAD_SIZE;

  const { url, loading } = useMediaUrl(
    activeSource,
    item.path,
    item.name,
    isInView && !isLargeVideo
  );

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = videoSpeed;
    }
  }, [videoSpeed]);

  return (
    <div ref={containerRef} className={styles.stripItemContainer}>
      <div className={styles.divider}>
        <div className={styles.dividerLine} />
        <span>Page {index + 1} of {total}</span>
        <div className={styles.dividerLine} />
      </div>

      <div className={styles.mediaWrapper}>
        {loading && (
          <div style={{ padding: '60px', color: 'var(--text-dim)' }}>
            <Loader2 size={32} className="animate-spin" />
          </div>
        )}

        {isLargeVideo && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '48px 24px',
              background: 'var(--surface-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              maxWidth: '400px',
              margin: '0 auto',
              color: 'var(--text-muted)',
            }}
          >
            <Film size={48} style={{ color: '#38bdf8' }} />
            <span
              style={{
                fontWeight: 600,
                color: 'var(--text-main)',
                fontSize: '13px',
                textAlign: 'center',
                wordBreak: 'break-all',
              }}
            >
              {item.name}
            </span>
            <span
              style={{
                fontSize: '11px',
                background: 'var(--surface-overlay)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
              }}
            >
              {formatFileSize(item.size)} (Video &gt; 20MB)
            </span>
          </div>
        )}

        {url && item.type === 'image' && (
          <img src={url} alt={item.name} className={styles.image} loading="lazy" />
        )}

        {url && !isLargeVideo && item.type === 'video' && (
          <video
            ref={videoRef}
            src={url}
            className={styles.video}
            autoPlay
            loop
            muted
            controls
            playsInline
          />
        )}

        {url && item.type === 'pdf' && (
          <iframe src={url} title={item.name} className={styles.pdfFrame} />
        )}
      </div>
    </div>
  );
};

