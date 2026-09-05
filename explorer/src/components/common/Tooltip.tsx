import React from 'react';
import styles from './Tooltip.module.css';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, className = '' }) => {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      {children}
      <div className={styles.tooltip}>{content}</div>
    </div>
  );
};
