import React from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from '../sidebar/Sidebar';
import { ResizableSplitter } from './ResizableSplitter';
import { InfoPanel } from '../content/InfoPanel';
import { TileGridView } from '../content/Views/TileGridView';
import { ComicStripView } from '../content/Views/ComicStripView';
import { EmptyState } from '../content/EmptyState';
import { MobileDrawer } from './MobileDrawer';
import { MobileBottomNav } from './MobileBottomNav';
import { LightboxModal } from '../lightbox/LightboxModal';
import { SourceSelectorModal } from '../sources/SourceSelectorModal';
import { S3ConfigModal } from '../sources/S3ConfigModal';

import { useExplorer } from '../../context/ExplorerContext';
import { useSource } from '../../context/SourceContext';
import { useReader } from '../../context/ReaderContext';
import { useLightbox } from '../../context/LightboxContext';
import { useResponsive } from '../../hooks/useMediaQuery';
import { useResizable } from '../../hooks/useResizable';
import { useKeyboardNav } from '../../hooks/useKeyboardNav';
import { Loader2 } from 'lucide-react';

import styles from './Layout.module.css';

export const Layout: React.FC = () => {
  const {
    mediaItems,
    isLoading,
    currentListing,
    navigateSibling,
    trashCurrentFolder,
  } = useExplorer();

  const { isConnected } = useSource();
  const { viewMode, setViewMode } = useReader();
  const { isMobile } = useResponsive();
  const { width: sidebarWidth, isResizing, startResizing } = useResizable({
    initialWidth: 270,
    minWidth: 160,
    maxWidth: 500,
  });

  const {
    isOpen: isLightboxOpen,
    next: nextLightboxItem,
    prev: prevLightboxItem,
    close: closeLightbox,
    trashCurrent: trashLightboxItem,
  } = useLightbox();

  // Keyboard navigation & shortcuts
  useKeyboardNav({
    isLightboxOpen,
    onPrevItem: prevLightboxItem,
    onNextItem: nextLightboxItem,
    onCloseLightbox: closeLightbox,
    onTrashCurrent: isLightboxOpen ? trashLightboxItem : trashCurrentFolder,
    onPrevFolder: () => navigateSibling(-1),
    onNextFolder: () => navigateSibling(1),
    onToggleViewMode: () => setViewMode(viewMode === 'tiles' ? 'comic' : 'tiles'),
    onToggleFullscreen: () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    },
  });

  return (
    <div className={styles.appContainer}>
      <TopBar />

      <div className={styles.bodyContainer}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <>
            <Sidebar style={{ width: `${sidebarWidth}px` }} />
            <ResizableSplitter onMouseDown={startResizing} isResizing={isResizing} />
          </>
        )}

        {/* Main Content Area */}
        <main className={styles.mainContent}>
          {isLoading && (
            <div className={styles.loadingOverlay}>
              <Loader2 size={36} className="animate-spin" />
            </div>
          )}

          {!isConnected ? (
            <EmptyState type="no-source" />
          ) : !currentListing ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
              Select a folder from the explorer sidebar.
            </div>
          ) : (
            <div className={styles.viewContainer}>
              <InfoPanel />

              {mediaItems.length === 0 ? (
                <EmptyState type="no-media" />
              ) : viewMode === 'tiles' ? (
                <TileGridView items={mediaItems} />
              ) : (
                <ComicStripView items={mediaItems} />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Drawer & Navigation */}
      {isMobile && (
        <>
          <MobileDrawer />
          {isConnected && currentListing && <MobileBottomNav />}
        </>
      )}

      {/* Modals & Fullscreen Lightbox */}
      <LightboxModal />
      <SourceSelectorModal />
      <S3ConfigModal />
    </div>
  );
};
