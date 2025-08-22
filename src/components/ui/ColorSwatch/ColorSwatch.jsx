// components/ui/ColorSwatch/ColorSwatch.jsx
import React, { memo, useState, useCallback } from 'react';
import styles from './ColorSwatch.module.scss';

const ColorSwatch = memo(({ 
  paintInfo,                    // { code, name, color }
  label,                        // Display label for tooltip
  size = "medium",              // 'small', 'medium', 'large', 'xlarge'
  shape = "rounded",            // 'square', 'rounded', 'circle'
  showTooltip = true,           // Show hover tooltip
  tooltipPosition = "top",      // 'top', 'bottom', 'left', 'right'
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
  const [internalHovered, setInternalHovered] = useState(false);
  
  // Use external hover state if provided, otherwise use internal
  const isTooltipVisible = showTooltip && (isHovered || internalHovered);
  
  const handleMouseEnter = useCallback(() => {
	if (disabled) return;
	
	if (onHover) {
	  onHover();
	} else {
	  setInternalHovered(true);
	}
  }, [onHover, disabled]);
  
  const handleMouseLeave = useCallback(() => {
	if (disabled) return;
	
	if (onLeave) {
	  onLeave();
	} else {
	  setInternalHovered(false);
	}
  }, [onLeave, disabled]);
  
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
  
  const tooltipPositionClass = {
	top: styles.tooltipTop,
	bottom: styles.tooltipBottom,
	left: styles.tooltipLeft,
	right: styles.tooltipRight
  }[tooltipPosition];
  
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
  
  return (
	<div className={styles.container}>
	  <div
		className={swatchClasses}
		style={{ backgroundColor: paintInfo.color }}
		onMouseEnter={handleMouseEnter}
		onMouseLeave={handleMouseLeave}
		onClick={handleClick}
		onKeyDown={handleKeyDown}
		tabIndex={onClick && !disabled ? 0 : -1}
		role={onClick ? "button" : "img"}
		aria-label={ariaLabel || `${paintInfo.name} color swatch`}
		aria-disabled={disabled}
		{...props}
	  >
		{showTooltip && isTooltipVisible && (
		  <div className={`${styles.tooltip} ${tooltipPositionClass} ${styles.tooltipVisible}`}>
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
			  
			  <div className={styles.tooltipTail} />
			</div>
		  </div>
		)}
	  </div>
	</div>
  );
});

ColorSwatch.displayName = 'ColorSwatch';

export default ColorSwatch;