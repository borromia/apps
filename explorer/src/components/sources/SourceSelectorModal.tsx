import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useSource } from '../../context/SourceContext';
import { Folder, FolderOpen, Cloud, Database, ChevronRight, LogOut } from 'lucide-react';
import styles from './SourceSelectorModal.module.css';

export const SourceSelectorModal: React.FC = () => {
  const {
    isSourceSelectorOpen,
    closeSourceSelector,
    sources,
    activeSource,
    pickNewFileSystemFolder,
    openS3Config,
    openZeroStorageConfig,
    disconnectSource,
  } = useSource();

  const handleSelect = async (sourceId: string) => {
    if (sourceId === 's3-cloud') {
      closeSourceSelector();
      openS3Config();
    } else if (sourceId === 'zerostorage') {
      closeSourceSelector();
      openZeroStorageConfig();
    } else {
      // Force directory picker so user can pick any folder
      await pickNewFileSystemFolder();
    }
  };

  return (
    <Modal
      isOpen={isSourceSelectorOpen}
      onClose={closeSourceSelector}
      title="Storage Source"
    >
      <div className={styles.list}>
        {sources.map((src) => {
          const isActive = activeSource?.id === src.id;
          const isFs = src.type === 'filesystem';
          const isZero = src.type === 'zerostorage';

          return (
            <div key={src.id} className={`${styles.item} ${isActive ? styles.itemActive : ''}`}>
              <div
                className={styles.mainClickable}
                onClick={() => handleSelect(src.id)}
              >
                <div className={styles.itemInfo}>
                  <div className={styles.iconWrap}>
                    {isFs ? <Folder size={20} /> : isZero ? <Database size={20} /> : <Cloud size={20} />}
                  </div>
                  <div>
                    <div className={styles.name}>{src.name}</div>
                    <div className={styles.desc}>
                      {isFs
                        ? isActive
                          ? `Active: ${activeSource.getRootName()}`
                          : 'Local drive folder via File System Access API'
                        : isZero
                          ? 'ZeroStorage (zerostorage.net) cloud storage & CDN'
                          : 'AWS S3, MinIO, Cloudflare R2 object storage'}
                    </div>
                  </div>
                </div>

                <div className={styles.actionRight}>
                  {isActive ? (
                    <span className={styles.activeBadge}>Active</span>
                  ) : (
                    <ChevronRight size={18} color="var(--text-dim)" />
                  )}
                </div>
              </div>

              {isActive && (
                <div className={styles.activeActions}>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<FolderOpen size={14} />}
                    onClick={() => handleSelect(src.id)}
                  >
                    {isFs ? 'Choose Different Folder' : isZero ? 'Configure ZeroStorage' : 'Configure S3'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<LogOut size={14} />}
                    onClick={disconnectSource}
                  >
                    Disconnect
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

