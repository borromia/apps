import React from 'react';
import { MediaItem } from '../../../types/media';
import { MediaTile } from './MediaTile';
import { useLightbox } from '../../../context/LightboxContext';

interface TileGridViewProps {
  items: MediaItem[];
}

export const TileGridView: React.FC<TileGridViewProps> = ({ items }) => {
  const { openAt } = useLightbox();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(calc(var(--zoom) * 160px), 1fr))',
        gap: '16px',
        padding: '20px',
        overflowY: 'auto',
        flex: 1,
      }}
    >
      {items.map((item, idx) => (
        <MediaTile
          key={item.fullPath}
          item={item}
          index={idx}
          onClick={() => openAt(idx, items)}
        />
      ))}
    </div>
  );
};

