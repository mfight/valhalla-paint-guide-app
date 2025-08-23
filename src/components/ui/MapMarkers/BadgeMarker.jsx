// components/ui/MapMarkers/BadgeMarker.jsx
import React, { memo } from 'react';
import styles from './MapMarkers.module.scss';

const BadgeMarker = memo(
  ({
    count, // Number to display
    text, // Text to display (alternative to count)
    badgeColor, // CSS color for background (overrides red default)
    borderColor, // CSS color for border (overrides global --marker-light-color)
    textColor, // CSS color for text (overrides global --marker-light-color)
    size = 'md', // 'sm', 'md', 'lg', 'xl'
    className = '',
    style = {},
    ...props
  }) => {
    const sizeClass = {
      sm: styles.badgeSizeSm,
      md: styles.badgeSizeMd,
      lg: styles.badgeSizeLg,
      xl: styles.badgeSizeXl,
    }[size];

    const badgeClasses = [styles.badgeMarker, sizeClass, className]
      .filter(Boolean)
      .join(' ');

    // Display count, text, or fallback
    const displayContent = count !== undefined ? count : text || '';

    // Build custom styles
    const customStyles = {
      ...style,
    };

    if (badgeColor) {
      customStyles['--marker-badge-color'] = badgeColor;
    }
    if (borderColor) {
      customStyles['--marker-border-color'] = borderColor;
    }
    if (textColor) {
      customStyles['--marker-text-color'] = textColor;
    }

    return (
      <div className={badgeClasses} style={customStyles} {...props}>
        {displayContent}
      </div>
    );
  }
);

BadgeMarker.displayName = 'BadgeMarker';

export default BadgeMarker;
