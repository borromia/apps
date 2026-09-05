import React from 'react';
import { useExplorer } from '../../context/ExplorerContext';
import { useReader } from '../../context/ReaderContext';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Scroll,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import styles from './MobileBottomNav.module.css';

export const MobileBottomNav: React.FC = () => {
  const { navigateSibling } = useExplorer();
  const { viewMode, setViewMode, zoom, setZoom } = useReader();

  return (
    <nav className={styles.bottomNav}>
      <button
        className={styles.navItem}
        onClick={() => navigateSibling(-1)}
        title="Previous folder"
      >
        <ChevronLeft size={18} />
        <span>Prev</span>
      </button>

      <button
        className={`${styles.navItem} ${viewMode === 'tiles' ? styles.navItemActive : ''}`}
        onClick={() => setViewMode(viewMode === 'tiles' ? 'comic' : 'tiles')}
        title="Toggle view"
      >
        {viewMode === 'tiles' ? <LayoutGrid size={18} /> : <Scroll size={18} />}
        <span>{viewMode === 'tiles' ? 'Tiles' : 'Strip'}</span>
      </button>

      <div className={styles.zoomGroup}>
        <button
          className={styles.zoomBtn}
          onClick={() => setZoom(zoom - 0.2)}
          title="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
        <span style={{ fontSize: '11px', minWidth: '32px', textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          className={styles.zoomBtn}
          onClick={() => setZoom(zoom + 0.2)}
          title="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
      </div>

      <button
        className={styles.navItem}
        onClick={() => navigateSibling(1)}
        title="Next folder"
      >
        <ChevronRight size={18} />
        <span>Next</span>
      </button>
    </nav>
  );
};

