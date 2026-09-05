import React from 'react';
import { SearchBar } from './SearchBar';
import { TreeView } from './TreeView';
import { SearchResults } from './SearchResults';
import { useExplorer } from '../../context/ExplorerContext';
import { useReader } from '../../context/ReaderContext';
import { ArrowDownAZ, ArrowDown01, FolderTree } from 'lucide-react';
import styles from './Sidebar.module.css';

export const Sidebar: React.FC<{ style?: React.CSSProperties; className?: string }> = ({
  style,
  className = '',
}) => {
  const { searchQuery, setSearchQuery } = useExplorer();
  const { sortMode, setSortMode } = useReader();

  const toggleSort = () => {
    setSortMode(sortMode === 'name' ? 'count' : 'name');
  };

  return (
    <aside className={`${styles.sidebar} ${className}`} style={style}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.title}>
            <FolderTree size={14} /> Explorer
          </span>
          <button className={styles.sortBtn} onClick={toggleSort} title="Toggle sort order">
            {sortMode === 'name' ? (
              <>
                <ArrowDownAZ size={13} /> Name
              </>
            ) : (
              <>
                <ArrowDown01 size={13} /> Count
              </>
            )}
          </button>
        </div>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
      </div>

      <div className={styles.content}>
        {searchQuery.trim() ? <SearchResults /> : <TreeView />}
      </div>
    </aside>
  );
};

