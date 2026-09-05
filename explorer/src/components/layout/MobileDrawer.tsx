import React from 'react';
import { Sidebar } from '../sidebar/Sidebar';
import { useReader } from '../../context/ReaderContext';
import { useTouchGestures } from '../../hooks/useTouchGestures';
import styles from './MobileDrawer.module.css';

export const MobileDrawer: React.FC = () => {
  const { isMobileDrawerOpen, setIsMobileDrawerOpen } = useReader();

  const drawerRef = useTouchGestures<HTMLDivElement>({
    onSwipeLeft: () => setIsMobileDrawerOpen(false),
  });

  if (!isMobileDrawerOpen) return null;

  return (
    <div className={styles.overlay} onClick={() => setIsMobileDrawerOpen(false)}>
      <div
        ref={drawerRef}
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
      >
        <Sidebar style={{ width: '100%', borderRight: 'none' }} />
      </div>
    </div>
  );
};

