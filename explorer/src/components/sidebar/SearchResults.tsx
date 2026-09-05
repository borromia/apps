import React from 'react';
import { useExplorer } from '../../context/ExplorerContext';
import { useReader } from '../../context/ReaderContext';
import { Folder } from 'lucide-react';
import styles from './TreeNode.module.css';

export const SearchResults: React.FC = () => {
  const { searchResults, currentPath, openFolder } = useExplorer();
  const { setIsMobileDrawerOpen } = useReader();

  if (searchResults.length === 0) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' }}>
        No matching folders found.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {searchResults.map((res) => {
        const isActive = currentPath === res.path;
        return (
          <div
            key={res.path}
            className={`${styles.nodeRow} ${isActive ? styles.active : ''}`}
            onClick={async () => {
              await openFolder(res.path);
              setIsMobileDrawerOpen(false);
            }}
          >
            <div className={styles.nodeLeft}>
              <span className={styles.folderIcon}>
                <Folder size={16} />
              </span>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <div className={styles.label}>{res.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{res.parentPath}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

