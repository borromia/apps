import React from 'react';
import { TreeNode } from './TreeNode';
import { useExplorer } from '../../context/ExplorerContext';
import { useSource } from '../../context/SourceContext';
import { useReader } from '../../context/ReaderContext';
import { Folder } from 'lucide-react';
import styles from './TreeNode.module.css';

export const TreeView: React.FC = () => {
  const { currentListing, openFolder } = useExplorer();
  const { activeSource, isConnected } = useSource();
  const { sortMode } = useReader();

  if (!isConnected || !activeSource) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' }}>
        No folder opened. Click "Open Storage" above.
      </div>
    );
  }

  // Root directories
  const rootNode = {
    name: activeSource.getRootName(),
    path: '',
    isDirectory: true,
    childCount: currentListing?.path === '' ? currentListing.files.length : undefined,
  };

  return (
    <div>
      <TreeNode node={rootNode} depth={0} />
    </div>
  );
};

