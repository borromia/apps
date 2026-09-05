import React from 'react';
import styles from './Slider.module.css';

interface SliderProps {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  valueDisplay?: string | number;
  icon?: React.ReactNode;
  onChange: (value: number) => void;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  valueDisplay,
  icon,
  onChange,
  className = '',
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.sliderWrapper}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={styles.rangeInput}
        />
      </div>
      {valueDisplay !== undefined && (
        <span className={styles.label}>{valueDisplay}</span>
      )}
    </div>
  );
};
