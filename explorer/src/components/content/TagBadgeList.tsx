import React from 'react';
import { Badge } from '../common/Badge';
import { Tag } from 'lucide-react';
import styles from './InfoPanel.module.css';

interface TagBadgeListProps {
  tags: string[];
}

export const TagBadgeList: React.FC<TagBadgeListProps> = ({ tags }) => {
  if (!tags || tags.length === 0) {
    return (
      <div className={styles.tagsRow} style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
        <Tag size={12} /> No tags yet. Extract with OCR below.
      </div>
    );
  }

  return (
    <div className={styles.tagsRow}>
      {tags.map((t) => (
        <Badge key={t} variant="accent">
          #{t}
        </Badge>
      ))}
    </div>
  );
};

