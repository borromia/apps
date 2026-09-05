import React, { useRef, useState, useEffect } from 'react';
import { MediaItem } from '../../../types/media';
import { useSource } from '../../../context/SourceContext';
import { useReader } from '../../../context/ReaderContext';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { Loader2 } from 'lucide-react';
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

  const { url, loading } = useMediaUrl(activeSource, item.path, item.name, isInView);

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

        {url && item.type === 'image' && (
          <img src={url} alt={item.name} className={styles.image} loading="lazy" />
        )}

        {url && item.type === 'video' && (
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

