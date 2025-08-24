// components/ui/Tooltip/Tooltip.jsx
import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.scss';

const Tooltip = memo(
  ({
    children, // Trigger element
    content, // Tooltip content (string, JSX, or render function)
    position = 'top', // 'top', 'bottom', 'left', 'right', 'auto'
    variant = 'default', // 'default', 'dark', 'light', 'info', 'warning', 'error'
    size = 'medium', // 'small', 'medium', 'large'
    delay = 0, // Show delay in ms
    hideDelay = 0, // Hide delay in ms
    disabled = false, // Disable tooltip
    trigger = 'hover', // 'hover', 'click', 'focus', 'manual'
    visible, // Controlled visibility (for manual trigger)
    onVisibilityChange, // Callback when visibility changes
    offset = 8, // Distance from trigger element
    maxWidth = 320, // Max width of tooltip
    className = '',
    ariaLabel,
    ...props
  }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [calculatedPosition, setCalculatedPosition] = useState(position);
    const [tooltipStyle, setTooltipStyle] = useState({});
    const [tailStyle, setTailStyle] = useState({});
    const triggerRef = useRef(null);
    const tooltipRef = useRef(null);
    const showTimeoutRef = useRef(null);
    const hideTimeoutRef = useRef(null);

    // Use controlled visibility if provided, otherwise use internal state
    const shouldShow = visible !== undefined ? visible : isVisible;

    const clearTimeouts = useCallback(() => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    }, []);

    const showTooltip = useCallback(() => {
      if (disabled) return;

      clearTimeouts();

      if (delay > 0) {
        showTimeoutRef.current = setTimeout(() => {
          setIsVisible(true);
          onVisibilityChange?.(true);
        }, delay);
      } else {
        setIsVisible(true);
        onVisibilityChange?.(true);
      }
    }, [disabled, delay, onVisibilityChange, clearTimeouts]);

    const hideTooltip = useCallback(() => {
      clearTimeouts();

      if (hideDelay > 0) {
        hideTimeoutRef.current = setTimeout(() => {
          setIsVisible(false);
          onVisibilityChange?.(false);
        }, hideDelay);
      } else {
        setIsVisible(false);
        onVisibilityChange?.(false);
      }
    }, [hideDelay, onVisibilityChange, clearTimeouts]);

    const toggleTooltip = useCallback(() => {
      if (shouldShow) {
        hideTooltip();
      } else {
        showTooltip();
      }
    }, [shouldShow, showTooltip, hideTooltip]);

    // Calculate tooltip position with viewport boundary detection
    const updatePosition = useCallback(() => {
      if (!triggerRef.current || !tooltipRef.current || !shouldShow) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      // Use actual tooltip dimensions, not estimated ones
      const tooltipWidth = tooltipRect.width || maxWidth;
      const tooltipHeight = tooltipRect.height || 120;

      let finalPosition = position;

      // Auto positioning logic
      if (position === 'auto') {
        const spaceTop = triggerRect.top;
        const spaceBottom = viewport.height - triggerRect.bottom;
        // const spaceLeft = triggerRect.left;
        const spaceRight = viewport.width - triggerRect.right;

        if (spaceTop >= tooltipHeight + offset && spaceTop >= spaceBottom) {
          finalPosition = 'top';
        } else if (spaceBottom >= tooltipHeight + offset) {
          finalPosition = 'bottom';
        } else if (spaceRight >= tooltipWidth + offset) {
          finalPosition = 'right';
        } else {
          finalPosition = 'left';
        }
      }

      // Calculate trigger center
      const triggerCenterX = triggerRect.left + triggerRect.width / 2;
      const triggerCenterY = triggerRect.top + triggerRect.height / 2;

      // Basic positioning with CSS transforms
      let style = {};
      let tailStyles = {};

      switch (finalPosition) {
        case 'top':
          style = {
            left: triggerCenterX,
            top: triggerRect.top - offset,
            transform: 'translateX(-50%) translateY(-100%)',
          };

          // Check if we need to flip to bottom
          if (triggerRect.top - offset - tooltipHeight < 10) {
            finalPosition = 'bottom';
            style = {
              left: triggerCenterX,
              top: triggerRect.bottom + offset,
              transform: 'translateX(-50%)',
            };
          }
          break;

        case 'bottom':
          style = {
            left: triggerCenterX,
            top: triggerRect.bottom + offset,
            transform: 'translateX(-50%)',
          };

          // Check if we need to flip to top
          if (
            triggerRect.bottom + offset + tooltipHeight >
            viewport.height - 10
          ) {
            finalPosition = 'top';
            style = {
              left: triggerCenterX,
              top: triggerRect.top - offset,
              transform: 'translateX(-50%) translateY(-100%)',
            };
          }
          break;

        case 'left':
          style = {
            left: triggerRect.left - offset,
            top: triggerCenterY,
            transform: 'translateX(-100%) translateY(-50%)',
          };
          break;

        case 'right':
          style = {
            left: triggerRect.right + offset,
            top: triggerCenterY,
            transform: 'translateY(-50%)',
          };
          break;

        default:
          // Default to bottom positioning
          style = {
            left: triggerCenterX,
            top: triggerRect.bottom + offset,
            transform: 'translateX(-50%)',
          };
          break;
      }

      // Handle horizontal viewport boundaries for top/bottom tooltips
      if (finalPosition === 'top' || finalPosition === 'bottom') {
        // Calculate where the tooltip would appear with current positioning
        const tooltipLeft = style.left - tooltipWidth / 2;
        const tooltipRight = style.left + tooltipWidth / 2;

        if (tooltipLeft < 10) {
          // Tooltip would go off left edge
          const newCenterX = 10 + tooltipWidth / 2;
          const tailOffset = triggerCenterX - newCenterX;

          style.left = newCenterX;

          // Only apply tail offset if it's reasonable (tail stays within tooltip bounds)
          if (Math.abs(tailOffset) < tooltipWidth * 0.4) {
            tailStyles = {
              left: `calc(50% + ${tailOffset}px)`,
              transform: 'translateX(-50%)',
            };
          }
        } else if (tooltipRight > viewport.width - 10) {
          // Tooltip would go off right edge
          const newCenterX = viewport.width - 10 - tooltipWidth / 2;
          const tailOffset = triggerCenterX - newCenterX;

          style.left = newCenterX;

          // Only apply tail offset if it's reasonable
          if (Math.abs(tailOffset) < tooltipWidth * 0.4) {
            tailStyles = {
              left: `calc(50% + ${tailOffset}px)`,
              transform: 'translateX(-50%)',
            };
          }
        }
      }

      // Handle vertical viewport boundaries for left/right tooltips
      if (finalPosition === 'left' || finalPosition === 'right') {
        // Calculate where the tooltip would appear
        const tooltipTop = style.top - tooltipHeight / 2;
        const tooltipBottom = style.top + tooltipHeight / 2;

        if (tooltipTop < 10) {
          // Tooltip would go off top edge
          const newCenterY = 10 + tooltipHeight / 2;
          const tailOffset = triggerCenterY - newCenterY;

          style.top = newCenterY;

          if (Math.abs(tailOffset) < tooltipHeight * 0.4) {
            tailStyles = {
              top: `calc(50% + ${tailOffset}px)`,
              transform: 'translateY(-50%)',
            };
          }
        } else if (tooltipBottom > viewport.height - 10) {
          // Tooltip would go off bottom edge
          const newCenterY = viewport.height - 10 - tooltipHeight / 2;
          const tailOffset = triggerCenterY - newCenterY;

          style.top = newCenterY;

          if (Math.abs(tailOffset) < tooltipHeight * 0.4) {
            tailStyles = {
              top: `calc(50% + ${tailOffset}px)`,
              transform: 'translateY(-50%)',
            };
          }
        }
      }

      setCalculatedPosition(finalPosition);
      setTooltipStyle(style);
      setTailStyle(tailStyles);
    }, [position, offset, shouldShow, maxWidth]);

    // Event handlers based on trigger type
    const getEventHandlers = () => {
      if (trigger === 'manual') return {};

      const handlers = {};

      if (trigger === 'hover' || trigger === 'focus') {
        handlers.onMouseEnter = showTooltip;
        handlers.onMouseLeave = hideTooltip;
        handlers.onFocus = showTooltip;
        handlers.onBlur = hideTooltip;
      }

      if (trigger === 'click') {
        handlers.onClick = toggleTooltip;
      }

      return handlers;
    };

    // Update position when visible or window resizes
    useEffect(() => {
      if (shouldShow) {
        updatePosition();

        const handleResize = () => updatePosition();
        const handleScroll = () => updatePosition();

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
          window.removeEventListener('resize', handleResize);
          window.removeEventListener('scroll', handleScroll, true);
        };
      }
    }, [shouldShow, updatePosition]);

    // Cleanup timeouts on unmount
    useEffect(() => {
      return clearTimeouts;
    }, [clearTimeouts]);

    // Build CSS classes
    const tooltipClasses = [
      styles.tooltip,
      styles[
        `position${calculatedPosition.charAt(0).toUpperCase() + calculatedPosition.slice(1)}`
      ],
      styles[`variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
      styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`],
      shouldShow ? styles.visible : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const renderContent = () => {
      if (typeof content === 'function') {
        return content({ isVisible: shouldShow, position: calculatedPosition });
      }
      return content;
    };

    return (
      <>
        {/* Trigger element */}
        <div
          ref={triggerRef}
          className={styles.trigger}
          {...getEventHandlers()}
          aria-describedby={shouldShow ? 'tooltip' : undefined}
          {...props}
        >
          {children}
        </div>

        {/* Tooltip content */}
        {shouldShow &&
          createPortal(
            <div
              ref={tooltipRef}
              className={tooltipClasses}
              style={{
                ...tooltipStyle,
                maxWidth: `${maxWidth}px`,
                zIndex: 9999,
              }}
              role="tooltip"
              aria-label={ariaLabel}
              id="tooltip"
            >
              <div className={styles.content}>{renderContent()}</div>
              <div className={styles.tail} style={tailStyle} />
            </div>,
            document.body
          )}
      </>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export default Tooltip;
