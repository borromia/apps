import React from 'react';
import { Button } from '../common/Button';
import { useSource } from '../../context/SourceContext';
import { FolderPlus, ImageOff } from 'lucide-react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  type?: 'no-source' | 'no-media';
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type = 'no-source' }) => {
  const { openSourceSelector } = useSource();

  if (type === 'no-media') {
    return (
      <div className={styles.empty}>
        <div className={styles.iconWrap}>
          <ImageOff size={32} />
        </div>
        <h2 className={styles.title}>No Media Files</h2>
        <p className={styles.desc}>
          This folder does not contain any supported images, videos, or PDFs. Select another folder from the sidebar.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.empty}>
      <div className={styles.iconWrap}>
        <FolderPlus size={32} />
      </div>
      <h2 className={styles.title}>No Storage Connected</h2>
      <p className={styles.desc}>
        Open a local directory or connect to an S3 / Cloud bucket to start exploring your collection.
      </p>
      <Button variant="primary" size="lg" onClick={openSourceSelector}>
        Connect Storage
      </Button>
    </div>
  );
};
