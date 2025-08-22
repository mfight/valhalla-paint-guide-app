import React, { useState, useCallback, memo, useEffect } from 'react';
import { Search, Home, Palette, X } from 'lucide-react';
import SegmentedControl from './components/ui/SegmentedControl';
import SearchInput from './components/ui/SearchInput';
import ColorSwatch from './components/ui/ColorSwatch';
import Card from './components/ui/Card';
import Icon from './components/ui/Icon';
import Button from './components/ui/Button';
import SWPaintCodeCard from './components/features/SWPaintCodeCard';
import UnitSearch from './components/features/UnitSearch';
import { createBadgeIcon } from './components/maps/LeafletBadgeMarker';
import { createPinIcon } from './components/maps/LeafletPinMarker';
import { colorSchemes } from './data/colorSchemes';
import { buildingData } from './data/buildingData';

// Only import Leaflet if we're using it
let MapContainer, TileLayer, Marker, Popup, L;
try {
  const leaflet = require('react-leaflet');
  MapContainer = leaflet.MapContainer;
  TileLayer = leaflet.TileLayer;
  Marker = leaflet.Marker;
  Popup = leaflet.Popup;
  L = require('leaflet');
  
  // Import Leaflet CSS
  require('leaflet/dist/leaflet.css');
  
  // Fix Leaflet default marker icons
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
} catch (e) {
  console.log('Leaflet not available, using fallback');
}

const allUnits = buildingData.flatMap(building => {
  return building.units.map(unit => {
    // Check unit first, fall back to building (hybrid approach)
    const schemeId = unit.colorSchemeId || building.colorSchemeId;
    const colorScheme = colorSchemes.find(scheme => scheme.id === schemeId);
    
    // Create street address and full address separately
    const streetAddress = unit.streetNumber && unit.streetName 
      ? `${unit.streetNumber} ${unit.streetName}`
      : unit.address || 'Address not available';
    
    const fullAddress = unit.streetNumber && unit.streetName 
      ? `${unit.streetNumber} ${unit.streetName}, ${unit.city} ${unit.state} ${unit.zipCode}`
      : unit.address || 'Address not available';
    
    return {
      ...unit,
      buildingId: building.id,
      buildingType: building.buildingType,
      streetAddress,
      fullAddress,
      coordinates: unit.coordinates || building.coordinates, // Use unit coordinates first, then building coordinates
      buildingCoordinates: building.coordinates, // Keep building coordinates available
      colorScheme: colorScheme ? colorScheme.name : 'Unknown',
      paintCodes: colorScheme ? colorScheme.paintCodes : {}
    };
  });
});

const UnitListItem = memo(({ unit, onSelect, hoveredSwatch, onSwatchHover, onSwatchLeave }) => (
  <Card variant="listItem" onClick={() => onSelect(unit)}>
    <Card.Header hasActions>
      <div>
        <Card.Title>{unit.streetAddress}</Card.Title>
        <Card.Subtitle>{unit.buildingId.replace('building-', 'Building ')} | {unit.buildingType} unit</Card.Subtitle>
      </div>
      <Card.Actions position="header">
        <div className="text-center">
          <div className="text-sm font-medium text-gray-700 mb-1">{unit.colorScheme}</div>
          <div className="flex space-x-1">
            <ColorSwatch 
              paintInfo={unit.paintCodes.bodyPrimary} 
              label="Body Secondary"
              size="medium"
              onHover={() => onSwatchHover(`${unit.id}-primary`)}
              onLeave={onSwatchLeave}
              isHovered={hoveredSwatch === `${unit.id}-primary`}
            />
            <ColorSwatch 
              paintInfo={unit.paintCodes.bodySecondary} 
              label="Body Secondary"
              size="medium"
              onHover={() => onSwatchHover(`${unit.id}-secondary`)}
              onLeave={onSwatchLeave}
              isHovered={hoveredSwatch === `${unit.id}-secondary`}
            />
            <ColorSwatch 
              paintInfo={unit.paintCodes.trim} 
              label="Trim"
              size="medium"
              onHover={() => onSwatchHover(`${unit.id}-trim`)}
              onLeave={onSwatchLeave}
              isHovered={hoveredSwatch === `${unit.id}-trim`}
            />
            <ColorSwatch 
              paintInfo={unit.paintCodes.door} 
              label="Door"
              size="medium"
              onHover={() => onSwatchHover(`${unit.id}-door`)}
              onLeave={onSwatchLeave}
              isHovered={hoveredSwatch === `${unit.id}-door`}
            />
          </div>
        </div>
      </Card.Actions>
    </Card.Header>
  </Card>
));

// Building type filter using the SegmentedControl
const BuildingTypeFilter = memo(({ selectedType, onTypeSelect }) => {
  const buildingTypes = [
    { value: 'All', label: 'All units', color: null },
    { value: 'Bay', label: 'Bay', color: '#3B82F6' },
    { value: 'Chase', label: 'Chase', color: '#10B981' },
    { value: 'Keys', label: 'Keys', color: '#F59E0B' }
  ];
  
  return (
    <SegmentedControl 
      options={buildingTypes}
      selectedValue={selectedType}
      onSelect={onTypeSelect}
      ariaLabel="Filter units by building type"
    />
  );
});

const NeighborhoodMap = memo(({ filteredUnits, onUnitSelect, selectedBuildingType, searchTerm, onBuildingTypeSelect }) => {
  const [mapError, setMapError] = useState(false);
  
  useEffect(() => {
    // Force Leaflet to invalidate size after component mounts
    const timer = setTimeout(() => {
      if (window.leafletMap) {
        window.leafletMap.invalidateSize();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  console.log('NeighborhoodMap rendering...');
  
  // Get buildings to show on map based on search/filter logic
  const getBuildingsForMap = () => {
    return buildingData.reduce((acc, building) => {
      if (building.coordinates) {
        // Apply building type filter
        const matchesBuildingTypeFilter = selectedBuildingType === 'All' || building.buildingType === selectedBuildingType;
        
        if (matchesBuildingTypeFilter) {
          // If there's a search term, only show buildings with matching units
          if (searchTerm.trim()) {
            const matchingUnits = filteredUnits.filter(unit => unit.buildingId === building.id);
            if (matchingUnits.length > 0) {
              acc.push({
                buildingId: building.id,
                buildingType: building.buildingType,
                coordinates: building.coordinates,
                units: matchingUnits
              });
            }
          } else {
            // No search term - show all buildings of the selected type with all their units
            const allUnitsInBuilding = allUnits.filter(unit => unit.buildingId === building.id);
            acc.push({
              buildingId: building.id,
              buildingType: building.buildingType,
              coordinates: building.coordinates,
              units: allUnitsInBuilding
            });
          }
        }
      }
      return acc;
    }, []);
  };
  
  const allBuildingsWithCoordinates = getBuildingsForMap();
  
  // Function to get building coordinates from building data
  function getBuildingCoordinates(buildingId) {
    const building = buildingData.find(b => b.id === buildingId);
    return building?.coordinates || null;
  }
  
  // Get marker color based on building type
  function getMarkerColor(buildingType) {
    const colors = {
      'Bay': '#3B82F6',    // Blue
      'Chase': '#10B981',  // Green  
      'Keys': '#F59E0B',   // Orange
    };
    return colors[buildingType] || '#6B7280'; // Default gray
  }
  
  // Fallback if Leaflet isn't working
  if (mapError || !MapContainer) {
    return (
      <div className="bg-white rounded-lg shadow border mb-4">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <Home className="mr-2 text-blue-600" />
            Valhalla Neighborhood
          </h2>
          <p className="text-sm text-gray-600">Pond Ridge Dr area, Riverview FL</p>
        </div>
        
        <div style={{ height: '480px', width: '100%', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Home className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#6b7280' }}>Map Unavailable</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#9ca3af' }}>
              Centered on 4916 Pond Ridge Dr, Riverview FL 33578
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow border mb-4">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Valhalla</h2>
            <p className="text-sm text-gray-600">Riverview, FL</p>
          </div>
          
          {/* Building Type Filter in map header */}
          <BuildingTypeFilter 
            selectedType={selectedBuildingType}
            onTypeSelect={onBuildingTypeSelect}
          />
        </div>
      </div>
      
      <div style={{ height: '480px', width: '100%' }}>
        <MapContainer
          center={[27.90186699819714, -82.33602233229566]}
          zoom={17}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          className="rounded-b-lg"
          whenCreated={(mapInstance) => {
            window.leafletMap = mapInstance;
            console.log('Map created successfully!');
          }}
          onError={() => {
            console.error('Map failed to load');
            setMapError(true);
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Building markers - show all buildings that have matching filtered units */}
          {allBuildingsWithCoordinates.map((building) => {
            const markerColor = getMarkerColor(building.buildingType);
            
            // Create custom badge marker for buildings using the component
            const customIcon = createBadgeIcon(L, {
              count: building.units.length,
              badgeColor: markerColor,
              borderColor: 'white',
              textColor: 'white',
              size: 'md'
            });
            
            return (
              <Marker 
                key={`building-${building.buildingId}`}
                position={building.coordinates}
                icon={customIcon}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                      {building.buildingId.replace('building-', 'Building ')}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                      {building.buildingType} • {building.units.length} unit{building.units.length !== 1 ? 's' : ''}
                    </div>
                    <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                      {building.units.map((unit, index) => (
                        <div 
                          key={unit.id}
                          style={{ 
                            padding: '4px 0', 
                            borderBottom: index < building.units.length - 1 ? '1px solid #eee' : 'none',
                            cursor: 'pointer'
                          }}
                          onClick={() => onUnitSelect && onUnitSelect(unit)}
                        >
                          <div style={{ fontSize: '13px', fontWeight: '500' }}>
                            {unit.streetAddress}
                          </div>
                          <div style={{ fontSize: '11px', color: '#666' }}>
                            {unit.colorScheme}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
});

const UnitDetailMap = memo(({ unit, setSelectedUnit }) => {
  const [mapError, setMapError] = useState(false);
  
  // Use unit coordinates if available, otherwise building coordinates, otherwise center on neighborhood
  const unitCoordinates = unit.coordinates || unit.buildingCoordinates || [27.90186699819714, -82.33602233229566];
  
  // Use the same color system as building markers
  function getMarkerColor(buildingType) {
    const colors = {
      'Bay': '#3B82F6',    // Blue
      'Chase': '#10B981',  // Green  
      'Keys': '#F59E0B',   // Orange
    };
    return colors[buildingType] || '#6B7280'; // Default gray
  }
  
  const markerColor = getMarkerColor(unit.buildingType);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.unitMap) {
        window.unitMap.invalidateSize();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [unit.id]);
  
  if (mapError || !MapContainer) {
    return (
      <div className="bg-white rounded-lg shadow border mb-4">
        <div className="p-4 bg-white border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{unit.fullAddress}</h2>
              <p className="text-gray-600">{unit.buildingType} • {unit.colorScheme}</p>
            </div>
            <Button
              variant="icon"
              size="xl"
              onClick={() => setSelectedUnit(null)}
              ariaLabel="Close unit details"
            >
              <X />
            </Button>
          </div>
        </div>
        <div style={{ height: '200px', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="text-gray-500">Map not available</p>
        </div>
        
        {/* Paint Code Swatches in same card */}
        <div className="p-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SWPaintCodeCard label="Body (Primary)" paintInfo={unit.paintCodes.bodyPrimary} />
            <SWPaintCodeCard label="Body (Secondary)" paintInfo={unit.paintCodes.bodySecondary} />
            <SWPaintCodeCard label="Trim" paintInfo={unit.paintCodes.trim} />
            <SWPaintCodeCard label="Door" paintInfo={unit.paintCodes.door} />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow border mb-4">
      <div className="p-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{unit.fullAddress}</h2>
            <p className="text-gray-600">{unit.buildingType} • {unit.colorScheme}</p>
          </div>
          <Button
            variant="icon"
            size="xl"
            onClick={() => setSelectedUnit(null)}
            ariaLabel="Close unit details"
          >
            <X />
          </Button>
        </div>
      </div>
      
      <div style={{ height: '200px', width: '100%' }}>
        <MapContainer
          center={unitCoordinates}
          zoom={18}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          whenCreated={(mapInstance) => {
            window.unitMap = mapInstance;
          }}
          onError={() => setMapError(true)}
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <Marker 
            position={unitCoordinates}
            icon={createPinIcon(L, {
              badgeColor: markerColor,
              borderColor: 'white',
              textColor: 'white',
              size: 'md'
            })}
          >
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <strong>{unit.streetAddress}</strong><br />
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {unit.buildingType} • {unit.colorScheme}
                </span>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      
      {/* Paint Code Swatches in same card */}
      <div className="p-4 border-t border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SWPaintCodeCard label="Body (Primary)" paintInfo={unit.paintCodes.bodyPrimary} />
          <SWPaintCodeCard label="Body (Secondary)" paintInfo={unit.paintCodes.bodySecondary} />
          <SWPaintCodeCard label="Trim" paintInfo={unit.paintCodes.trim} />
          <SWPaintCodeCard label="Door" paintInfo={unit.paintCodes.door} />
        </div>
        
        {/* Sherwin-Williams info section */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Sherwin-Williams Paint Codes</h3>
          <p className="text-blue-700 text-sm">
            Take these codes to any Sherwin-Williams store for exact color matching. 
            Consider ordering samples before making your final purchase.
          </p>
        </div>
      </div>
    </div>
  );
});

const TownhomePaintApp = () => {
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [hoveredSwatch, setHoveredSwatch] = useState(null);
  
  // State for filtered units from UnitSearch
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [searchMeta, setSearchMeta] = useState({
    searchTerm: '',
    selectedBuildingType: 'All',
    hasActiveFilters: false
  });

  // Handler for building type filter (separate from UnitSearch)
  const handleBuildingTypeFilter = useCallback((buildingType) => {
    setSearchMeta(prev => ({
      ...prev,
      selectedBuildingType: buildingType,
      hasActiveFilters: prev.searchTerm.trim() !== '' || buildingType !== 'All'
    }));
  }, []);

  // Handler for UnitSearch component (now only handles search term)
  const handleFilteredUnitsChange = useCallback((filtered, meta) => {
    setFilteredUnits(filtered);
    setSearchMeta(prev => ({
      ...prev,
      searchTerm: meta.searchTerm,
      hasActiveFilters: meta.searchTerm.trim() !== '' || prev.selectedBuildingType !== 'All'
    }));
  }, []);

  const handleUnitSelect = useCallback((unit) => {
    setSelectedUnit(unit);
  }, []);

  const handleSwatchHover = useCallback((uniqueId) => {
    setHoveredSwatch(uniqueId);
  }, []);

  const handleSwatchLeave = useCallback(() => {
    setHoveredSwatch(null);
  }, []);

  const UnitDetailView = ({ unit, setSelectedUnit }) => (
    <div className="space-y-4">
      <UnitDetailMap unit={unit} setSelectedUnit={setSelectedUnit} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Valhalla Exterior Paint Guide
          </h1>
          <p className="text-gray-600">Find official Sherwin-Williams exterior paint colors for your unit.</p>
        </header>

        {selectedUnit ? (
          <UnitDetailView unit={selectedUnit} setSelectedUnit={setSelectedUnit} />
        ) : (
          <div className="space-y-4">
            <NeighborhoodMap 
              filteredUnits={filteredUnits}
              onUnitSelect={handleUnitSelect}
              selectedBuildingType={searchMeta.selectedBuildingType}
              searchTerm={searchMeta.searchTerm}
              onBuildingTypeSelect={handleBuildingTypeFilter}
            />
            
            <UnitSearch
              units={allUnits}
              onFilteredUnitsChange={handleFilteredUnitsChange}
              onUnitSelect={handleUnitSelect}
              showBuildingTypeFilter={false}
              searchTerm={searchMeta.searchTerm}
              selectedBuildingType={searchMeta.selectedBuildingType}
            />

            <div className="grid gap-4">
              {!searchMeta.hasActiveFilters ? (
                <div className="text-center py-12 text-gray-500">
                  <Home className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">Search for Your Unit</h3>
                  <p>Start typing to find units by address, building type, or color scheme</p>
                </div>
              ) : filteredUnits.length > 0 ? (
                filteredUnits.map(unit => (
                  <UnitListItem
                    key={unit.id}
                    unit={unit}
                    onSelect={handleUnitSelect}
                    hoveredSwatch={hoveredSwatch}
                    onSwatchHover={handleSwatchHover}
                    onSwatchLeave={handleSwatchLeave}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>
                    {searchMeta.searchTerm.trim() === '' ? (
                      // Empty search - only filtering by building type
                      searchMeta.selectedBuildingType === 'All' 
                        ? 'No units found' 
                        : `No ${searchMeta.selectedBuildingType} units found`
                    ) : (
                      // Has search term
                      `No ${searchMeta.selectedBuildingType === 'All' ? '' : searchMeta.selectedBuildingType + ' '}units found matching "${searchMeta.searchTerm}"`
                    )}
                    {searchMeta.selectedBuildingType !== 'All' && (
                      <span className="block mt-1 text-sm">
                        Try searching in all units or adjusting your search term
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TownhomePaintApp;