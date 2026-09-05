import React from 'react';
import { Search, X } from 'lucide-react';
import styles from './Sidebar.module.css';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search folders...',
}) => {
  return (
    <div className={styles.searchWrap}>
      <Search size={14} className={styles.searchIcon} />
      <input
        type="text"
        className={styles.searchInput}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button className={styles.clearSearch} onClick={onClear} aria-label="Clear search">
          <X size={13} />
        </button>
      )}
    </div>
  );
};

