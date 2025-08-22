// components/maps/LeafletPinMarker.jsx
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PinMarker from '../ui/MapMarkers/PinMarker';

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

// React component for preview/testing
const LeafletPinMarker = (props) => {
  return <PinMarker {...props} />;
};

export default LeafletPinMarker;