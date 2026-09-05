import React from 'react';
import { MediaItem } from '../../../types/media';
import { StripMediaItem } from './StripMediaItem';

interface ComicStripViewProps {
  items: MediaItem[];
}

export const ComicStripView: React.FC<ComicStripViewProps> = ({ items }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 20px 80px',
        overflowY: 'auto',
        flex: 1,
        width: '100%',
      }}
    >
      {items.map((item, idx) => (
        <StripMediaItem
          key={item.fullPath}
          item={item}
          index={idx}
          total={items.length}
        />
      ))}
    </div>
  );
};

