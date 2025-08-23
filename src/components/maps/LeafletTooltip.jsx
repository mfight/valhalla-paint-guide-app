// components/maps/LeafletTooltip.jsx
import React, { useEffect, useRef, useState } from 'react';
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
  maxWidth = 280,
  offset = 8,
  className = '',
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
      const selectors = [
        '.leaflet-marker-icon',
        '.custom-badge-marker',
        '.custom-pin-marker',
        '.leaflet-interactive',
        '[role="button"]',
        'div[style*="transform"]', // Leaflet often uses transform styles
      ];

      for (const selector of selectors) {
        const markers = containerRef.current.querySelectorAll(selector);

        if (markers.length > 0) {
          const marker = markers[0]; // Take the first one
          return marker;
        }
      }

      return null;
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
        return;
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
  }, [children]); // Re-run when children change

  const handleShow = () => {
    if (!disabled) {
      setIsVisible(true);
      onVisibilityChange?.(true);
    }
  };

  const handleHide = () => {
    if (!disabled) {
      setIsVisible(false);
      onVisibilityChange?.(false);
    }
  };

  const handleToggle = (e) => {
    e.stopPropagation(); // Prevent map click
    const newVisible = !isVisible;
    setIsVisible(newVisible);
    onVisibilityChange?.(newVisible);
  };

  // Add event listeners to the marker element
  useEffect(() => {
    if (!markerElement) {
      return;
    }

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
  }, [markerElement, trigger, disabled]);

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
