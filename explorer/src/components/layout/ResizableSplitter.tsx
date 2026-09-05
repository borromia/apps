import React from 'react';
import styles from './ResizableSplitter.module.css';

interface ResizableSplitterProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isResizing: boolean;
}

export const ResizableSplitter: React.FC<ResizableSplitterProps> = ({
  onMouseDown,
  isResizing,
}) => {
  return (
    <div
      className={`${styles.splitter} ${isResizing ? styles.splitterActive : ''}`}
      onMouseDown={onMouseDown}
    />
  );
};
