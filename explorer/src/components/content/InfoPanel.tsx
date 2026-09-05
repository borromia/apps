import React from 'react';
import { useExplorer } from '../../context/ExplorerContext';
import { useSource } from '../../context/SourceContext';
import { useOcrTagging } from '../../hooks/useOcrTagging';
import { TagBadgeList } from './TagBadgeList';
import { Button } from '../common/Button';
import { formatFileSize } from '../../services/mediaDetector';
import { Sparkles, Trash2, Folder, RefreshCw } from 'lucide-react';
import styles from './InfoPanel.module.css';

export const InfoPanel: React.FC = () => {
  const {
    currentListing,
    mediaItems,
    currentTags,
    setTags,
    currentPath,
    trashCurrentFolder,
    refreshCurrent,
  } = useExplorer();
  const { activeSource } = useSource();

  const { progress, runOcr } = useOcrTagging(
    activeSource,
    currentPath,
    mediaItems,
    setTags
  );

  if (!currentListing) return null;

  const isRoot = !currentPath;
  const folderName = isRoot ? activeSource?.getRootName() || 'Root' : currentListing.name;
  const parentName = currentListing.parentPath || (isRoot ? '' : activeSource?.getRootName());
  const totalMedia = mediaItems.length;
  const formattedSize = formatFileSize(currentListing.totalSize);

  return (
    <div className={styles.panel}>
      <div className={styles.topRow}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{folderName}</h1>
          {parentName && (
            <div className={styles.subtitle}>
              in <Folder size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
              {parentName}
            </div>
          )}
          <div className={styles.metaRow}>
            <span>{totalMedia} {totalMedia === 1 ? 'media item' : 'media items'}</span>
            <span>•</span>
            <span>{formattedSize}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            size="sm"
            variant="ghost"
            icon={<RefreshCw size={14} />}
            onClick={refreshCurrent}
            title="Refresh directory"
          />

          {totalMedia > 0 && (
            <Button
              size="sm"
              variant="default"
              icon={<Sparkles size={14} />}
              onClick={runOcr}
              disabled={progress.status === 'running'}
            >
              {progress.status === 'running' ? 'Extracting...' : 'Extract & Tag'}
            </Button>
          )}

          {!isRoot && activeSource?.isWritable && (
            <Button
              size="sm"
              variant="danger"
              icon={<Trash2 size={14} />}
              onClick={trashCurrentFolder}
              title="Move folder to trash"
            >
              Trash Folder
            </Button>
          )}
        </div>
      </div>

      <TagBadgeList tags={currentTags} />

      {progress.status === 'running' && (
        <div className={styles.ocrProgress}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Reading page {progress.currentPage} of {progress.totalPages}...</span>
            <span>{Math.round((progress.currentPage / progress.totalPages) * 100)}%</span>
          </div>
          <div className={styles.progressBarBg}>
            <div
              className={styles.progressBarFill}
              style={{
                width: `${(progress.currentPage / progress.totalPages) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
