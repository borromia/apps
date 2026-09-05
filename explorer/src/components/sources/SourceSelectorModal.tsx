import React from 'react';
import { Modal } from '../common/Modal';
import { useSource } from '../../context/SourceContext';
import { Folder, Cloud, ChevronRight } from 'lucide-react';
import styles from './SourceSelectorModal.module.css';

export const SourceSelectorModal: React.FC = () => {
  const {
    isSourceSelectorOpen,
    closeSourceSelector,
    sources,
    activeSource,
    selectSource,
    openS3Config,
  } = useSource();

  const handleSelect = async (sourceId: string) => {
    if (sourceId === 's3-cloud') {
      closeSourceSelector();
      openS3Config();
    } else {
      await selectSource(sourceId);
    }
  };

  return (
    <Modal
      isOpen={isSourceSelectorOpen}
      onClose={closeSourceSelector}
      title="Select Storage Source"
    >
      <div className={styles.list}>
        {sources.map((src) => {
          const isActive = activeSource?.id === src.id;
          const isFs = src.type === 'filesystem';

          return (
            <div
              key={src.id}
              className={styles.item}
              onClick={() => handleSelect(src.id)}
            >
              <div className={styles.itemInfo}>
                <div className={styles.iconWrap}>
                  {isFs ? <Folder size={20} /> : <Cloud size={20} />}
                </div>
                <div>
                  <div className={styles.name}>{src.name}</div>
                  <div className={styles.desc}>
                    {isFs
                      ? 'Local drive folder via File System Access API'
                      : 'AWS S3, MinIO, Cloudflare R2, or compatible object storage'}
                  </div>
                </div>
              </div>
              {isActive ? (
                <span className={styles.activeBadge}>Connected</span>
              ) : (
                <ChevronRight size={18} color="var(--text-dim)" />
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

