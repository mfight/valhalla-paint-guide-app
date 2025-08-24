// components/maps/LeafletBadgeMarker.jsx
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BadgeMarker from '../ui/MapMarkers/BadgeMarker';
import { LeafletTooltip } from './LeafletTooltip';

// Helper function to create Leaflet icon from BadgeMarker
export const createBadgeIcon = (L, props = {}) => {
  if (!L) return null;

  const {
    count,
    text,
    badgeColor, // Pass through custom badge color
    borderColor, // Pass through custom border color
    textColor, // Pass through custom text color
    size = 'md',
    iconSize, // Override default icon size
    iconAnchor, // Override default anchor point
    className = '',
    ...markerProps
  } = props;

  // Generate HTML from React component
  const html = renderToStaticMarkup(
    <BadgeMarker
      count={count}
      text={text}
      badgeColor={badgeColor}
      borderColor={borderColor}
      textColor={textColor}
      size={size}
      {...markerProps}
    />
  );

  // Default sizes based on marker size
  const sizeMap = {
    sm: [24, 24],
    md: [32, 32],
    lg: [40, 40],
    xl: [48, 48],
  };

  const defaultIconSize = iconSize || sizeMap[size] || sizeMap.md;
  const defaultIconAnchor = iconAnchor || [
    defaultIconSize[0] / 2,
    defaultIconSize[1] / 2,
  ];

  return L.divIcon({
    className: `custom-badge-marker ${className}`,
    html: html,
    iconSize: defaultIconSize,
    iconAnchor: defaultIconAnchor,
  });
};

// Enhanced function to create badge marker with tooltip
export const createBadgeMarkerWithTooltip = ({
  L, // Leaflet instance
  position, // [lat, lng]
  tooltipContent, // JSX content for tooltip
  tooltipTrigger = 'click', // 'hover' or 'click'
  tooltipPosition = 'top', // tooltip position
  tooltipMaxWidth = 280,
  tooltipVariant = 'default',
  tooltipSize = 'medium',
  // onUnitSelect, // Unit selection handler
  // Badge marker props
  count,
  text,
  badgeColor,
  borderColor,
  textColor,
  size = 'md',
  className = '',
  // Leaflet marker props
  ...leafletMarkerProps
}) => {
  if (!L) return null;

  const icon = createBadgeIcon(L, {
    count,
    text,
    badgeColor,
    borderColor,
    textColor,
    size,
    className,
  });

  // Return JSX component that can be used in React-Leaflet
  return (
    <LeafletTooltip
      key={`badge-marker-${position[0]}-${position[1]}`}
      content={tooltipContent}
      trigger={tooltipTrigger}
      position={tooltipPosition}
      maxWidth={tooltipMaxWidth}
      variant={tooltipVariant}
      size={tooltipSize}
    >
      <L.Marker position={position} icon={icon} {...leafletMarkerProps} />
    </LeafletTooltip>
  );
};

// React component for preview/testing
const LeafletBadgeMarker = (props) => {
  return <BadgeMarker {...props} />;
};

export default LeafletBadgeMarker;
