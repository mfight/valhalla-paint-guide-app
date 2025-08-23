// components/ui/SegmentedControl/SegmentedControl.jsx
import React, { memo } from 'react';
import styles from './SegmentedControl.module.scss';

const SegmentedControl = memo(
  ({
    options, // Array of {value, label, color?}
    selectedValue,
    onSelect,
    className = '', // Allow custom styling override
    ariaLabel = 'Segmented control', // Accessible label for the group
  }) => {
    return (
      <div
        className={`${styles.container} ${className}`}
        role="radiogroup"
        aria-label={ariaLabel}
      >
        {options.map(({ value, label, color }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selectedValue === value}
            onClick={() => onSelect(value)}
            className={`${styles.button} ${
              selectedValue === value
                ? styles.buttonActive
                : styles.buttonInactive
            }`}
          >
            {color && (
              <div
                className={styles.colorDot}
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
            )}
            <span>{label}</span>
          </button>
        ))}
      </div>
    );
  }
);

SegmentedControl.displayName = 'SegmentedControl';

export default SegmentedControl;
