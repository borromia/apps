import React from 'react';
import { Button } from '../common/Button';
import { Slider } from '../common/Slider';
import { useSource } from '../../context/SourceContext';
import { useReader } from '../../context/ReaderContext';
import { useResponsive } from '../../hooks/useMediaQuery';
import {
  FolderOpen,
  LayoutGrid,
  Scroll,
  Maximize2,
  Menu,
  Sparkles,
  Zap,
} from 'lucide-react';
import styles from './TopBar.module.css';

export const TopBar: React.FC = () => {
  const { activeSource, isConnected, openSourceSelector } = useSource();
  const {
    viewMode,
    setViewMode,
    zoom,
    setZoom,
    videoSpeed,
    setVideoSpeed,
    toggleMobileDrawer,
  } = useReader();
  const { isMobile } = useResponsive();

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.leftGroup}>
        {isMobile && (
          <button
            onClick={toggleMobileDrawer}
            style={{ padding: '6px', color: 'var(--text)' }}
            aria-label="Toggle explorer drawer"
          >
            <Menu size={20} />
          </button>
        )}

        <div className={styles.brand}>
          <Sparkles size={18} color="var(--accent)" />
          <span>Explorer</span>
        </div>

        <Button
          size="sm"
          variant="primary"
          icon={<FolderOpen size={14} />}
          onClick={openSourceSelector}
        >
          {isConnected ? 'Change Storage' : 'Open Storage'}
        </Button>

        {isConnected && activeSource && (
          <div
            className={styles.sourcePill}
            title={`${activeSource.getRootName()} (Click to change storage)`}
            onClick={openSourceSelector}
          >
            {activeSource.getRootName()}
          </div>
        )}
      </div>

      <div className={styles.rightGroup}>
        <div className={styles.desktopOnly}>
          <Slider
            label="Zoom"
            min={0.5}
            max={3.0}
            step={0.1}
            value={zoom}
            valueDisplay={`${Math.round(zoom * 100)}%`}
            onChange={setZoom}
          />

          <Slider
            label="Speed"
            min={0.5}
            max={5.0}
            step={0.25}
            value={videoSpeed}
            valueDisplay={`${videoSpeed}×`}
            onChange={setVideoSpeed}
          />

          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'tiles' ? styles.toggleActive : ''}`}
              onClick={() => setViewMode('tiles')}
              title="Tile Grid View"
            >
              <LayoutGrid size={14} /> Tiles
            </button>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'comic' ? styles.toggleActive : ''}`}
              onClick={() => setViewMode('comic')}
              title="Comic Strip View"
            >
              <Scroll size={14} /> Strip
            </button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            iconOnly
            icon={<Maximize2 size={16} />}
            onClick={handleFullscreen}
            title="Toggle Fullscreen (F)"
          />
        </div>
      </div>
    </header>
  );
};

