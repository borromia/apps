import React, { useState, useEffect } from 'react';
import { StorageNode } from '../../types/source';
import { useExplorer } from '../../context/ExplorerContext';
import { useSource } from '../../context/SourceContext';
import { useReader } from '../../context/ReaderContext';
import { Badge } from '../common/Badge';
import { ChevronRight, Folder, FolderOpen } from 'lucide-react';
import styles from './TreeNode.module.css';

interface TreeNodeProps {
  node: StorageNode;
  depth?: number;
}

export const TreeNode: React.FC<TreeNodeProps> = ({ node, depth = 0 }) => {
  const { currentPath, openFolder, expandedPaths, togglePathExpanded } = useExplorer();
  const { activeSource } = useSource();
  const { sortMode, setIsMobileDrawerOpen } = useReader();

  const isExpanded = expandedPaths.has(node.path);
  const isActive = currentPath === node.path;
  const [children, setChildren] = useState<StorageNode[] | null>(null);
  const [isLoadingChildren, setIsLoadingChildren] = useState<boolean>(false);

  useEffect(() => {
    setChildren(null);
  }, [activeSource, node.path]);

  useEffect(() => {
    if (isExpanded && children === null && activeSource) {
      setIsLoadingChildren(true);
      activeSource
        .listDirectory(node.path)
        .then((listing) => {
          let dirs = [...listing.directories];
          if (sortMode === 'count') {
            dirs.sort((a, b) => (b.childCount ?? 0) - (a.childCount ?? 0));
          } else {
            dirs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
          }
          setChildren(dirs);
        })
        .catch((err) => {
          console.warn(`Failed to expand node ${node.path}`, err);
          setChildren([]);
        })
        .finally(() => {
          setIsLoadingChildren(false);
        });
    }
  }, [isExpanded, children, node.path, activeSource, sortMode]);

  const handleRowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExpanded) {
      togglePathExpanded(node.path);
    }
    await openFolder(node.path);
    setIsMobileDrawerOpen(false);
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePathExpanded(node.path);
  };

  return (
    <div className={styles.container}>
      <div
        className={`${styles.nodeRow} ${isActive ? styles.active : ''}`}
        style={{ paddingLeft: `${Math.max(depth * 14 + 6, 6)}px` }}
        onClick={handleRowClick}
      >
        <div className={styles.nodeLeft}>
          <span
            className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}
            onClick={handleChevronClick}
          >
            <ChevronRight size={14} />
          </span>

          <span className={styles.folderIcon}>
            {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
          </span>

          <span className={styles.label} title={node.name}>
            {node.name}
          </span>
        </div>

        {node.childCount !== undefined && node.childCount > 0 && (
          <Badge variant="count">{node.childCount}</Badge>
        )}
      </div>

      {isExpanded && children && children.length > 0 && (
        <div className={styles.children}>
          {children.map((child) => (
            <TreeNode key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

