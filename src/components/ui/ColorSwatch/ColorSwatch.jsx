// components/ui/ColorSwatch/ColorSwatch.jsx - Future-proofed version
import React, { memo, useCallback, useMemo } from 'react';
import Tooltip from '../Tooltip';
import styles from './ColorSwatch.module.scss';

const ColorSwatch = memo(
  ({
    paintInfo, // Paint data object
    label, // Display label for tooltip
    size = 'medium', // 'small', 'medium', 'large', 'xlarge'
    shape = 'rounded', // 'square', 'rounded', 'circle'
    showTooltip = true, // Show hover tooltip
    tooltipPosition = 'top', // 'top', 'bottom', 'left', 'right', 'auto'
    brand = 'Sherwin-Williams', // Paint brand name
    colorFormat = 'auto', // 'hex', 'rgb', 'color', 'auto' - which color property to use
    showColorValues = false, // Show color values in tooltip (hex, rgb, etc.)
    onClick, // Click handler
    onHover, // Hover handler (external state)
    onLeave, // Leave handler (external state)
    isHovered = false, // External hover state
    className = '',
    disabled = false,
    ariaLabel,
    ...props
  }) => {
    // Smart color extraction - tries different properties in order
    const getColorValue = useMemo(() => {
      if (!paintInfo) return null;

      if (colorFormat === 'auto') {
        // Try in order of preference: hex, color, then rgb array
        return (
          paintInfo.hex ||
          paintInfo.color ||
          (paintInfo.rgb ? `rgb(${paintInfo.rgb.join(', ')})` : null)
        );
      }

      switch (colorFormat) {
        case 'hex':
          return paintInfo.hex;
        case 'color':
          return paintInfo.color;
        case 'rgb':
          if (paintInfo.rgb && Array.isArray(paintInfo.rgb)) {
            return `rgb(${paintInfo.rgb.join(', ')})`;
          }
          return paintInfo.rgb;
        default:
          return paintInfo[colorFormat] || paintInfo.hex || paintInfo.color;
      }
    }, [paintInfo, colorFormat]);

    // Format color values for display in tooltip
    const formatColorValues = useMemo(() => {
      if (!paintInfo || !showColorValues) return null;

      const values = [];

      if (paintInfo.hex) {
        values.push({ label: 'HEX', value: paintInfo.hex });
      }

      if (paintInfo.rgb && Array.isArray(paintInfo.rgb)) {
        values.push({
          label: 'RGB',
          value: `${paintInfo.rgb[0]}, ${paintInfo.rgb[1]}, ${paintInfo.rgb[2]}`,
        });
      }

      if (paintInfo.cmyk && Array.isArray(paintInfo.cmyk)) {
        values.push({
          label: 'CMYK',
          value: `${paintInfo.cmyk[0]}%, ${paintInfo.cmyk[1]}%, ${paintInfo.cmyk[2]}%, ${paintInfo.cmyk[3]}%`,
        });
      }

      // Backwards compatibility - if we have a 'color' property that's different from hex
      if (paintInfo.color && paintInfo.color !== paintInfo.hex) {
        values.push({ label: 'COLOR', value: paintInfo.color });
      }

      return values.length > 0 ? values : null;
    }, [paintInfo, showColorValues]);

    const handleClick = useCallback(() => {
      if (disabled || !onClick) return;
      onClick(paintInfo);
    }, [onClick, paintInfo, disabled]);

    const handleKeyDown = useCallback(
      (e) => {
        if (disabled) return;

        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      },
      [handleClick, disabled]
    );

    // Build class names
    const sizeClass = {
      small: styles.sizeSmall,
      medium: styles.sizeMedium,
      large: styles.sizeLarge,
      xlarge: styles.sizeXLarge,
    }[size];

    const shapeClass = {
      square: styles.shapeSquare,
      rounded: styles.shapeRounded,
      circle: styles.shapeCircle,
    }[shape];

    const swatchClasses = [
      styles.swatch,
      sizeClass,
      shapeClass,
      onClick && !disabled ? styles.swatchClickable : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    if (!paintInfo || !getColorValue) {
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
          style={{ backgroundColor: getColorValue }}
          aria-hidden="true"
        />

        {brand && (
          <div className={styles.tooltipBrand}>
            <span className={styles.brandText}>{brand}</span>
          </div>
        )}

        <div className={styles.tooltipInfo}>
          {paintInfo.code && (
            <div className={styles.paintCode}>{paintInfo.code}</div>
          )}
          {paintInfo.name && (
            <div className={styles.paintName}>{paintInfo.name}</div>
          )}
        </div>

        {/* Color values section */}
        {formatColorValues && (
          <div className={styles.tooltipColorValues}>
            {formatColorValues.map(({ label, value }) => (
              <div key={label} className={styles.colorValue}>
                <span className={styles.colorValueLabel}>{label}:</span>
                <span className={styles.colorValueText}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );

    const swatchElement = (
      <div
        className={swatchClasses}
        style={{ backgroundColor: getColorValue }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        tabIndex={onClick && !disabled ? 0 : -1}
        role={onClick ? 'button' : 'img'}
        aria-label={
          ariaLabel ||
          (paintInfo.name ? `${paintInfo.name} color swatch` : 'Color swatch')
        }
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
        trigger={onHover ? 'manual' : 'hover'}
        disabled={disabled}
      >
        {swatchElement}
      </Tooltip>
    );
  }
);

ColorSwatch.displayName = 'ColorSwatch';

export default ColorSwatch;
