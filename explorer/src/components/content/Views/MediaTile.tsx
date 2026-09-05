import React, { useState, useRef, useEffect } from 'react';
import { MediaItem } from '../../../types/media';
import { useSource } from '../../../context/SourceContext';
import { useReader } from '../../../context/ReaderContext';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { Tooltip } from '../../common/Tooltip';
import { formatFileSize } from '../../../services/mediaDetector';
import { FileText, Film, Loader2 } from 'lucide-react';
import styles from './MediaTile.module.css';

interface MediaTileProps {
  item: MediaItem;
  index: number;
  onClick: () => void;
}

export const MediaTile: React.FC<MediaTileProps> = ({ item, index, onClick }) => {
  const { activeSource } = useSource();
  const { videoSpeed } = useReader();
  const [isInView, setIsInView] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Lazy load media when tile is close to viewport
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
      { rootMargin: '300px' }
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

  // Apply playback speed to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = videoSpeed;
    }
  }, [videoSpeed]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
  };

  const tooltipContent = (
    <div>
      <div style={{ fontWeight: 600, marginBottom: '2px' }}>
        Page {index + 1}: {item.name}
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
        {formatFileSize(item.size)}
        {dimensions && ` • ${dimensions.w} × ${dimensions.h} px`}
        {item.lastModified && ` • ${new Date(item.lastModified).toLocaleDateString()}`}
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      <div ref={containerRef} className={styles.tile} onClick={onClick}>
        <div className={styles.pageIndexBadge}>{index + 1}</div>

        {item.type === 'video' && (
          <div className={styles.videoBadge}>
            <Film size={12} />
          </div>
        )}

        {loading && (
          <div className={styles.loadingSpinner}>
            <Loader2 size={24} className="animate-spin" />
          </div>
        )}

        {url && item.type === 'image' && (
          <img
            src={url}
            alt={item.name}
            className={styles.image}
            loading="lazy"
            onLoad={handleImageLoad}
          />
        )}

        {isLargeVideo && (
          <div className={styles.videoPlaceholder}>
            <Film size={36} className={styles.largeVideoIcon} />
            <span className={styles.videoName}>{item.name}</span>
            <span className={styles.videoSizeBadge}>{formatFileSize(item.size)}</span>
          </div>
        )}

        {url && !isLargeVideo && item.type === 'video' && (
          <video
            ref={videoRef}
            src={url}
            className={styles.video}
            autoPlay
            loop
            muted
            playsInline
          />
        )}

        {item.type === 'pdf' && (
          <div className={styles.pdfPlaceholder}>
            <FileText size={36} className={styles.pdfIcon} />
            <span className={styles.pdfName}>{item.name}</span>
          </div>
        )}
      </div>
    </Tooltip>
  );
};

