// components/maps/LeafletPinMarker.jsx
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PinMarker from '../ui/MapMarkers/PinMarker';
import { LeafletTooltip } from './LeafletTooltip';

// Helper function to create Leaflet icon from PinMarker
export const createPinIcon = (L, props = {}) => {
  if (!L) return null;
  
  const {
	badgeColor,        // Pass through custom badge color
	borderColor,       // Pass through custom border color
	textColor,         // Pass through custom text color
	size = "md",
	iconSize,          // Override default icon size
	iconAnchor,        // Override default anchor point
	className = "",
	...markerProps
  } = props;
  
  // Generate HTML from React component
  const html = renderToStaticMarkup(
	<PinMarker 
	  badgeColor={badgeColor}
	  borderColor={borderColor}
	  textColor={textColor}
	  size={size}
	  {...markerProps}
	/>
  );
  
  // Default sizes based on marker size (pins are taller than wide)
  const sizeMap = {
	sm: [20, 24],
	md: [24, 32], 
	lg: [32, 40],
	xl: [40, 48]
  };
  
  const defaultIconSize = iconSize || sizeMap[size] || sizeMap.md;
  // Pin anchor should be at the bottom point of the pin
  const defaultIconAnchor = iconAnchor || [defaultIconSize[0] / 2, defaultIconSize[1]];
  
  return L.divIcon({
	className: `custom-pin-marker ${className}`,
	html: html,
	iconSize: defaultIconSize,
	iconAnchor: defaultIconAnchor,
  });
};

// Enhanced function to create pin marker with tooltip
export const createPinMarkerWithTooltip = ({
  L,                           // Leaflet instance
  position,                    // [lat, lng]
  tooltipContent,              // JSX content for tooltip
  tooltipTrigger = "click",    // 'hover' or 'click'
  tooltipPosition = "top",     // tooltip position
  tooltipMaxWidth = 280,
  tooltipVariant = "default",
  tooltipSize = "medium",
  onUnitSelect,                // Unit selection handler
  // Pin marker props
  badgeColor,
  borderColor,
  textColor,
  size = "md",
  className = "",
  // Leaflet marker props
  ...leafletMarkerProps
}) => {
  if (!L) return null;

  const icon = createPinIcon(L, {
	badgeColor,
	borderColor,
	textColor,
	size,
	className
  });

  // Return JSX component that can be used in React-Leaflet
  return (
	<LeafletTooltip
	  key={`pin-marker-${position[0]}-${position[1]}`}
	  content={tooltipContent}
	  trigger={tooltipTrigger}
	  position={tooltipPosition}
	  maxWidth={tooltipMaxWidth}
	  variant={tooltipVariant}
	  size={tooltipSize}
	>
	  <L.Marker
		position={position}
		icon={icon}
		{...leafletMarkerProps}
	  />
	</LeafletTooltip>
  );
};

// React component for preview/testing
const LeafletPinMarker = (props) => {
  return <PinMarker {...props} />;
};

export default LeafletPinMarker;