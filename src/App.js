import React, { useState, useCallback, memo, useEffect } from 'react';
import { Search, Home, Palette, X } from 'lucide-react';
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
      coordinates: unit.coordinates, // Unit coordinates (if available)
      buildingCoordinates: building.coordinates, // Building coordinates (if available)
      colorScheme: colorScheme ? colorScheme.name : 'Unknown',
      paintCodes: colorScheme ? colorScheme.paintCodes : {}
    };
  });
});

const ColorSwatch = memo(({ paintInfo, label, size = "w-6 h-6", uniqueId, onHover, onLeave, isHovered }) => (
  <div className="relative">
    <div 
      className={`${size} rounded border cursor-pointer hover:shadow-lg transition-shadow`}
      style={{ backgroundColor: paintInfo.color }}
      onMouseEnter={() => onHover(uniqueId)}
      onMouseLeave={onLeave}
    ></div>
    
    {isHovered && (
      <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none">
        <div className="bg-white border-2 border-white rounded-lg shadow-xl p-3 min-w-48">
          <div className="text-center mb-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
          </div>
          
          <div 
            className="w-full aspect-square rounded border mb-1 shadow-inner"
            style={{ backgroundColor: paintInfo.color }}
          ></div>
          
          <div className="text-center mb-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sherwin-Williams</span>
          </div>
          
          <div className="text-center">
            <div className="font-bold text-lg text-gray-800">{paintInfo.code}</div>
            <div className="text-sm text-gray-600 font-medium">{paintInfo.name}</div>
          </div>
          
          <div className="absolute top-full left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
          </div>
        </div>
      </div>
    )}
  </div>
));

const UnitListItem = memo(({ unit, onSelect, hoveredSwatch, onSwatchHover, onSwatchLeave }) => (
  <div 
    className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition-shadow cursor-pointer"
    onClick={() => onSelect(unit)}
  >
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-semibold text-lg">{unit.streetAddress}</h3>
        <p className="text-gray-600">{unit.buildingId.replace('building-', 'Building ')} | {unit.buildingType} unit</p>
      </div>
      <div className="text-center">
        <div className="text-sm font-medium text-gray-700 mb-1">{unit.colorScheme}</div>
        <div className="flex space-x-1">
          <ColorSwatch 
            paintInfo={unit.paintCodes.bodyPrimary} 
            label="Body Primary" 
            uniqueId={`${unit.id}-primary`}
            onHover={onSwatchHover}
            onLeave={onSwatchLeave}
            isHovered={hoveredSwatch === `${unit.id}-primary`}
          />
          <ColorSwatch 
            paintInfo={unit.paintCodes.bodySecondary} 
            label="Body Secondary" 
            uniqueId={`${unit.id}-secondary`}
            onHover={onSwatchHover}
            onLeave={onSwatchLeave}
            isHovered={hoveredSwatch === `${unit.id}-secondary`}
          />
          <ColorSwatch 
            paintInfo={unit.paintCodes.trim} 
            label="Trim" 
            uniqueId={`${unit.id}-trim`}
            onHover={onSwatchHover}
            onLeave={onSwatchLeave}
            isHovered={hoveredSwatch === `${unit.id}-trim`}
          />
          <ColorSwatch 
            paintInfo={unit.paintCodes.door} 
            label="Door" 
            uniqueId={`${unit.id}-door`}
            onHover={onSwatchHover}
            onLeave={onSwatchLeave}
            isHovered={hoveredSwatch === `${unit.id}-door`}
          />
        </div>
      </div>
    </div>
  </div>
));

const SearchInput = memo(({ value, onChange, onClear }) => (
  <div className="relative">
    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
    <input
      type="text"
      placeholder="Search by street address, building type, or color scheme..."
      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      value={value}
      onChange={onChange}
      autoComplete="off"
    />
    {value && (
      <button
        onClick={onClear}
        className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
        type="button"
      >
        <X className="h-4 w-4" />
      </button>
    )}
  </div>
));

const BuildingTypeFilter = memo(({ selectedType, onTypeSelect }) => {
  const buildingTypes = [
    { value: 'All', label: 'All units', color: null },
    { value: 'Bay', label: 'Bay', color: '#3B82F6' },
    { value: 'Chase', label: 'Chase', color: '#10B981' },
    { value: 'Keys', label: 'Keys', color: '#F59E0B' }
  ];
  
  return (
    <div className="inline-flex bg-gray-100 rounded-lg p-1">
      {buildingTypes.map(({ value, label, color }) => (
        <button
          key={value}
          onClick={() => onTypeSelect(value)}
          className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md flex items-center space-x-2 ${
            selectedType === value
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {color && (
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: color }}
            />
          )}
          <span>{label}</span>
        </button>
      ))}
    </div>
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
          
          {/* Building Type Filter moved to map header */}
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
            
            // Create custom colored marker icon for buildings
            const customIcon = L && L.divIcon({
              className: 'custom-marker',
              html: `<div style="
                background-color: ${markerColor}; 
                width: 20px; 
                height: 20px; 
                border-radius: 50%; 
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 10px;
                font-weight: bold;
              ">${building.units.length}</div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
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

const PaintCodeCard = ({ label, paintInfo }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h4 className="font-medium text-gray-700 mb-2">{label}</h4>
    <div className="flex items-center space-x-3">
      <div 
        className="w-12 h-12 rounded border border-gray-300"
        style={{ backgroundColor: paintInfo.color }}
      ></div>
      <div>
        <p className="font-bold text-lg">{paintInfo.code}</p>
        <p className="text-gray-600">{paintInfo.name}</p>
      </div>
    </div>
  </div>
);

const UnitDetailMap = memo(({ unit, setSelectedUnit }) => {
  const [mapError, setMapError] = useState(false);
  
  // Use unit coordinates if available, otherwise building coordinates, otherwise center on neighborhood
  const unitCoordinates = unit.coordinates || unit.buildingCoordinates || [27.90186699819714, -82.33602233229566];
  const markerColor = unit.buildingType === 'Bay' ? '#3B82F6' : unit.buildingType === 'Chase' ? '#10B981' : '#F59E0B';
  
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
            <button 
              onClick={() => setSelectedUnit(null)}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
        <div style={{ height: '200px', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="text-gray-500">Map not available</p>
        </div>
        
        {/* Paint Code Swatches in same card */}
        <div className="p-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PaintCodeCard label="Body (Primary)" paintInfo={unit.paintCodes.bodyPrimary} />
            <PaintCodeCard label="Body (Secondary)" paintInfo={unit.paintCodes.bodySecondary} />
            <PaintCodeCard label="Trim" paintInfo={unit.paintCodes.trim} />
            <PaintCodeCard label="Door" paintInfo={unit.paintCodes.door} />
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
          <button 
            onClick={() => setSelectedUnit(null)}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
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
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <Marker position={unitCoordinates}>
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
          <PaintCodeCard label="Body (Primary)" paintInfo={unit.paintCodes.bodyPrimary} />
          <PaintCodeCard label="Body (Secondary)" paintInfo={unit.paintCodes.bodySecondary} />
          <PaintCodeCard label="Trim" paintInfo={unit.paintCodes.trim} />
          <PaintCodeCard label="Door" paintInfo={unit.paintCodes.door} />
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [hoveredSwatch, setHoveredSwatch] = useState(null);
  const [selectedBuildingType, setSelectedBuildingType] = useState('All');

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchTerm('');
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

  const handleBuildingTypeFilter = useCallback((buildingType) => {
    setSelectedBuildingType(buildingType);
  }, []);

  const filteredUnits = allUnits.filter(unit => {
    const matchesSearch = unit.streetAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.streetNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.streetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.buildingType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.colorScheme.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBuildingType = selectedBuildingType === 'All' || unit.buildingType === selectedBuildingType;
    
    return matchesSearch && matchesBuildingType;
  });

  const UnitDetailView = ({ unit, setSelectedUnit }) => (
    <div className="space-y-4">
      <UnitDetailMap unit={unit} setSelectedUnit={setSelectedUnit} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <Palette className="mr-3 text-blue-600" />
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
              selectedBuildingType={selectedBuildingType}
              searchTerm={searchTerm}
              onBuildingTypeSelect={handleBuildingTypeFilter}
            />
            
            <SearchInput 
              value={searchTerm} 
              onChange={handleSearchChange} 
              onClear={handleSearchClear} 
            />

            <div className="grid gap-4">
              {!searchTerm && selectedBuildingType === 'All' ? (
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
                    {searchTerm.trim() === '' ? (
                      // Empty search - only filtering by building type
                      selectedBuildingType === 'All' 
                        ? 'No units found' 
                        : `No ${selectedBuildingType} units found`
                    ) : (
                      // Has search term
                      `No ${selectedBuildingType === 'All' ? '' : selectedBuildingType + ' '}units found matching "${searchTerm}"`
                    )}
                    {selectedBuildingType !== 'All' && (
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