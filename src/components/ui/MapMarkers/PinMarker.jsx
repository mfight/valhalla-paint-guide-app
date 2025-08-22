// components/ui/MapMarkers/PinMarker.jsx
import React, { memo } from 'react';
import styles from './MapMarkers.module.scss';

const PinMarker = memo(({ 
  badgeColor,                // CSS color for pin background (overrides red default)
  borderColor,               // CSS color for border (overrides global --marker-light-color)
  textColor,                 // CSS color for dot (overrides global --marker-light-color)
  size = "md",              // 'sm', 'md', 'lg', 'xl'
  className = "",
  style = {},
  ...props
}) => {
  const sizeClass = {
	sm: styles.pinSizeSm,
	md: styles.pinSizeMd,
	lg: styles.pinSizeLg,
	xl: styles.pinSizeXl
  }[size];
  
  const pinClasses = [
	styles.pinMarker,
	sizeClass,
	className
  ].filter(Boolean).join(' ');
  
  // Build custom styles
  const customStyles = {
	...style
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
	<div 
	  className={pinClasses}
	  style={customStyles}
	  {...props}
	>
	  <div className={styles.pinShape} />
	  <div className={styles.pinDot} />
	</div>
  );
});

PinMarker.displayName = 'PinMarker';

export default PinMarker;