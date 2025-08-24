// components/maps/LeafletTooltip.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Tooltip from '../ui/Tooltip';

/**
 * Bridge component that connects Leaflet markers with your Tooltip component
 * This allows you to use your custom Tooltip design system with Leaflet maps
 */
const LeafletTooltip = ({
  children, // The marker element
  content, // Tooltip content (JSX)
  position = 'top',
  variant = 'default',
  size = 'medium',
  trigger = 'hover',
  disabled = false,
  maxWidth,
  offset,
  className,
  onVisibilityChange,
  ...tooltipProps
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [markerElement, setMarkerElement] = useState(null);
  const containerRef = useRef(null);

  // More aggressive marker detection with longer retry period
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50; // Try for 5 seconds
    let intervalId;

    const findMarkerElement = () => {
      if (!containerRef.current) {
        return null;
      }

      // Look for various Leaflet marker selectors
      const root = containerRef.current;
      return (
        root.querySelector('.leaflet-marker-icon') ||
        root.querySelector('.leaflet-marker-pane img') ||
        root.querySelector('[class*="leaflet-marker"]') ||
        root.querySelector('img[alt*="marker" i]') ||
        root.querySelector('img')
      );
    };

    const startSearch = () => {
      const marker = findMarkerElement();

      if (marker) {
        setMarkerElement(marker);
        if (intervalId) {
          clearInterval(intervalId);
        }
        return;
      }

      attempts++;
      if (attempts >= maxAttempts) {
        if (intervalId) {
          clearInterval(intervalId);
        }
      }
    };

    // Start searching immediately
    startSearch();

    // If not found, set up interval to keep trying
    if (!markerElement) {
      intervalId = setInterval(startSearch, 100);
    }

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [children, markerElement]); // Re-run when children or marker changes

  const handleShow = useCallback(() => {
    if (disabled) return;
    setIsVisible(true);
    onVisibilityChange?.(true);
  }, [disabled, onVisibilityChange]);

  const handleHide = useCallback(() => {
    if (disabled) return;
    setIsVisible(false);
    onVisibilityChange?.(false);
  }, [disabled, onVisibilityChange]);

  const handleToggle = useCallback(
    (e) => {
      e.stopPropagation(); // Prevent map click
      if (disabled) return;
      setIsVisible((prev) => {
        const next = !prev;
        onVisibilityChange?.(next);
        return next;
      });
    },
    [disabled, onVisibilityChange]
  );

  // Add event listeners to the marker element
  useEffect(() => {
    if (!markerElement) {
      return;
    }
    if (disabled) return;

    if (trigger === 'hover') {
      markerElement.addEventListener('mouseenter', handleShow);
      markerElement.addEventListener('mouseleave', handleHide);
    } else if (trigger === 'click') {
      markerElement.addEventListener('click', handleToggle);
    }

    return () => {
      if (markerElement) {
        markerElement.removeEventListener('mouseenter', handleShow);
        markerElement.removeEventListener('mouseleave', handleHide);
        markerElement.removeEventListener('click', handleToggle);
      }
    };
  }, [markerElement, trigger, disabled, handleShow, handleHide, handleToggle]);

  return (
    <>
      {/* Container for the Leaflet marker */}
      <div ref={containerRef} style={{ display: 'contents' }}>
        {children}
      </div>

      {/* Show tooltip when visible and we have a marker */}
      {isVisible && markerElement && (
        <Tooltip
          content={content}
          position={position}
          variant={variant}
          size={size}
          trigger="manual"
          visible={true}
          maxWidth={maxWidth}
          offset={offset}
          className={className}
          {...tooltipProps}
        >
          {/* Create a positioned element for tooltip reference */}
          <div
            style={{
              position: 'fixed',
              left:
                markerElement.getBoundingClientRect().left +
                markerElement.offsetWidth / 2,
              top:
                markerElement.getBoundingClientRect().top +
                markerElement.offsetHeight / 2,
              width: 1,
              height: 1,
              pointerEvents: 'none',
              zIndex: -1,
            }}
          />
        </Tooltip>
      )}
    </>
  );
};

export { LeafletTooltip };
