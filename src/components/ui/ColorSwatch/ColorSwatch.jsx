// components/ui/ColorSwatch/ColorSwatch.jsx - Updated to use Tooltip component
import React, { memo, useCallback } from 'react';
import Tooltip from '../Tooltip';
import styles from './ColorSwatch.module.scss';

const ColorSwatch = memo(({ 
  paintInfo,                    // { code, name, color }
  label,                        // Display label for tooltip
  size = "medium",              // 'small', 'medium', 'large', 'xlarge'
  shape = "rounded",            // 'square', 'rounded', 'circle'
  showTooltip = true,           // Show hover tooltip
  tooltipPosition = "top",      // 'top', 'bottom', 'left', 'right', 'auto'
  brand = "Sherwin-Williams",   // Paint brand name
  onClick,                      // Click handler
  onHover,                      // Hover handler (external state)
  onLeave,                      // Leave handler (external state)
  isHovered = false,            // External hover state
  className = "",
  disabled = false,
  ariaLabel,
  ...props
}) => {
  const handleClick = useCallback(() => {
	if (disabled || !onClick) return;
	onClick(paintInfo);
  }, [onClick, paintInfo, disabled]);
  
  const handleKeyDown = useCallback((e) => {
	if (disabled) return;
	
	if (e.key === 'Enter' || e.key === ' ') {
	  e.preventDefault();
	  handleClick();
	}
  }, [handleClick, disabled]);
  
  // Build class names
  const sizeClass = {
	small: styles.sizeSmall,
	medium: styles.sizeMedium,
	large: styles.sizeLarge,
	xlarge: styles.sizeXLarge
  }[size];
  
  const shapeClass = {
	square: styles.shapeSquare,
	rounded: styles.shapeRounded,
	circle: styles.shapeCircle
  }[shape];
  
  const swatchClasses = [
	styles.swatch,
	sizeClass,
	shapeClass,
	onClick && !disabled ? styles.swatchClickable : '',
	className
  ].filter(Boolean).join(' ');
  
  if (!paintInfo) {
	return null;
  }

  // Tooltip content
  const tooltipContent = (
	<div className={styles.tooltipContent}>
	  {label && (
		<div className={styles.tooltipLabel}>
		  <span className={styles.labelText}>{label}</span>
		</div>
	  )}
	  
	  <div 
		className={styles.tooltipSwatch}
		style={{ backgroundColor: paintInfo.color }}
		aria-hidden="true"
	  />
	  
	  {brand && (
		<div className={styles.tooltipBrand}>
		  <span className={styles.brandText}>{brand}</span>
		</div>
	  )}
	  
	  <div className={styles.tooltipInfo}>
		<div className={styles.paintCode}>{paintInfo.code}</div>
		<div className={styles.paintName}>{paintInfo.name}</div>
	  </div>
	</div>
  );

  const swatchElement = (
	<div
	  className={swatchClasses}
	  style={{ backgroundColor: paintInfo.color }}
	  onClick={handleClick}
	  onKeyDown={handleKeyDown}
	  onMouseEnter={onHover}
	  onMouseLeave={onLeave}
	  tabIndex={onClick && !disabled ? 0 : -1}
	  role={onClick ? "button" : "img"}
	  aria-label={ariaLabel || `${paintInfo.name} color swatch`}
	  aria-disabled={disabled}
	  {...props}
	/>
  );

  // If tooltip is disabled or no paint info, return just the swatch
  if (!showTooltip || !paintInfo) {
	return swatchElement;
  }

  return (
	<Tooltip
	  content={tooltipContent}
	  position={tooltipPosition}
	  visible={isHovered || undefined}
	  trigger={onHover ? "manual" : "hover"}
	  disabled={disabled}
	>
	  {swatchElement}
	</Tooltip>
  );
});

ColorSwatch.displayName = 'ColorSwatch';

export default ColorSwatch;