import React, { useState, useCallback, memo, useEffect } from 'react';
import { Search, Home, X } from 'lucide-react';

// Styles
import styles from './App.module.scss';

// UI Components
import SegmentedControl from './components/ui/SegmentedControl';
import ColorSwatch from './components/ui/ColorSwatch';
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import EmptyState from './components/ui/EmptyState';

// Feature Components
import SWPaintCodeCard from './components/features/SWPaintCodeCard';
import UnitSearch from './components/features/UnitSearch';

// Map utilities
import { useMapTiles } from './hooks/useMapTiles';
import { MAP_CONFIG, getMarkerColor } from './config/mapConfig';
import { createBadgeIcon } from './components/maps/LeafletBadgeMarker';
import { createPinIcon } from './components/maps/LeafletPinMarker';

// Data
import { getPaintByCode } from './data/PaintData-SherwinWilliams';
import { colorSchemes } from './data/colorSchemes';
import { buildingData } from './data/buildingData';

// Leaflet imports with fallback
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
    iconRetinaUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
} catch (e) {}

// Process building data into flat array of units
const allUnits = buildingData.flatMap((building) => {
  return building.units.map((unit) => {
    // Check unit first, fall back to building (hybrid approach)
    const schemeId = unit.colorSchemeId || building.colorSchemeId;
    const colorScheme = colorSchemes.find((scheme) => scheme.id === schemeId);

    // Create street address and full address separately
    const streetAddress =
      unit.streetNumber && unit.streetName
        ? `${unit.streetNumber} ${unit.streetName}`
        : unit.address || 'Address not available';

    const fullAddress =
      unit.streetNumber && unit.streetName
        ? `${unit.streetNumber} ${unit.streetName}, ${unit.city} ${unit.state} ${unit.zipCode}`
        : unit.address || 'Address not available';

    // Create backward-compatible paintCodes object for existing components
    const paintCodes = {};
    if (colorScheme) {
      Object.entries(colorScheme.paintCodes).forEach(([key, paintCode]) => {
        const paintInfo = getPaintByCode(paintCode);
        if (paintInfo) {
          paintCodes[key] = {
            ...paintInfo,
            color: paintInfo.hex, // Add backward compatibility
          };
        }
      });
    }

    return {
      ...unit,
      buildingId: building.id,
      buildingType: building.buildingType,
      streetAddress,
      fullAddress,
      coordinates: unit.coordinates || building.coordinates,
      buildingCoordinates: building.coordinates,
      colorScheme: colorScheme ? colorScheme.name : 'Unknown',
      paintCodes, // For backward compatibility with ColorSwatch components
      colorSchemeData: colorScheme, // Full color scheme data for new components
    };
  });
});

const UnitListItem = memo(
  ({ unit, onSelect, hoveredSwatch, onSwatchHover, onSwatchLeave }) => (
    <Card variant="listItem" onClick={() => onSelect(unit)}>
      <Card.Header hasActions>
        <div>
          <Card.Title>{unit.streetAddress}</Card.Title>
          <Card.Subtitle>
            {unit.buildingId.replace('building-', 'Building ')} |{' '}
            {unit.buildingType} unit
          </Card.Subtitle>
        </div>
        <Card.Actions position="header">
          <div className="text-center">
            <Card.Subtitle className="text-sm font-medium mb-1 text-center">
              {unit.colorScheme}
            </Card.Subtitle>
            <div className="flex space-x-1">
              {[
                {
                  paintInfo: unit.paintCodes.bodyPrimary,
                  label: 'Body Primary',
                  key: 'primary',
                },
                {
                  paintInfo: unit.paintCodes.bodySecondary,
                  label: 'Body Secondary',
                  key: 'secondary',
                },
                { paintInfo: unit.paintCodes.trim, label: 'Trim', key: 'trim' },
                { paintInfo: unit.paintCodes.door, label: 'Door', key: 'door' },
              ].map(({ paintInfo, label, key }) => (
                <ColorSwatch
                  key={key}
                  paintInfo={paintInfo}
                  label={label}
                  size="medium"
                  onHover={() => onSwatchHover(`${unit.id}-${key}`)}
                  onLeave={onSwatchLeave}
                  isHovered={hoveredSwatch === `${unit.id}-${key}`}
                />
              ))}
            </div>
          </div>
        </Card.Actions>
      </Card.Header>
    </Card>
  )
);

const BuildingTypeFilter = memo(({ selectedType, onTypeSelect }) => {
  const buildingTypes = [
    { value: 'All', label: 'All units', color: null },
    { value: 'Bay', label: 'Bay', color: '#3B82F6' },
    { value: 'Chase', label: 'Chase', color: '#10B981' },
    { value: 'Keys', label: 'Keys', color: '#F59E0B' },
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

const NeighborhoodMap = memo(
  ({
    filteredUnits,
    onUnitSelect,
    selectedBuildingType,
    searchTerm,
    onBuildingTypeSelect,
  }) => {
    const [mapError, setMapError] = useState(false);
    const tileConfig = useMapTiles();

    // Inject popup styles
    useEffect(() => {
      const popupStyles = `
      .unit-row-hover {
        transition: background-color 0.2s ease;
        pointer-events: auto;
      }
      
      .unit-row-hover:hover {
        background-color: #f3f4f6 !important;
      }
      
      .unit-row-hover * {
        pointer-events: none;
      }
      
      .custom-popup .leaflet-popup-content {
        margin: 16px 8px;
        padding: 0;
      }
      
      .custom-popup .leaflet-popup-content-wrapper {
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      }
    `;

      const styleElement = document.createElement('style');
      styleElement.textContent = popupStyles;
      document.head.appendChild(styleElement);

      return () => {
        if (document.head.contains(styleElement)) {
          document.head.removeChild(styleElement);
        }
      };
    }, []);

    // Force Leaflet to invalidate size after component mounts
    useEffect(() => {
      const timer = setTimeout(() => {
        if (window.leafletMap) {
          window.leafletMap.invalidateSize();
        }
      }, 100);

      return () => clearTimeout(timer);
    }, []);

    // Get buildings to show on map based on search/filter logic
    const getBuildingsForMap = () => {
      return buildingData.reduce((acc, building) => {
        if (building.coordinates) {
          const matchesBuildingTypeFilter =
            selectedBuildingType === 'All' ||
            building.buildingType === selectedBuildingType;

          if (matchesBuildingTypeFilter) {
            if (searchTerm.trim()) {
              // Show buildings with matching units
              const matchingUnits = filteredUnits.filter(
                (unit) => unit.buildingId === building.id
              );
              if (matchingUnits.length > 0) {
                acc.push({
                  buildingId: building.id,
                  buildingType: building.buildingType,
                  coordinates: building.coordinates,
                  units: matchingUnits,
                });
              }
            } else {
              // Show all buildings of the selected type
              const allUnitsInBuilding = allUnits.filter(
                (unit) => unit.buildingId === building.id
              );
              acc.push({
                buildingId: building.id,
                buildingType: building.buildingType,
                coordinates: building.coordinates,
                units: allUnitsInBuilding,
              });
            }
          }
        }
        return acc;
      }, []);
    };

    const allBuildingsWithCoordinates = getBuildingsForMap();

    // Fallback if Leaflet isn't working
    if (mapError || !MapContainer) {
      return (
        <div className={styles.mapContainer}>
          <div className={styles.mapHeader}>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Home className="mr-2 text-blue-600" />
              Valhalla Neighborhood
            </h2>
            <p className="text-sm text-gray-600">
              Pond Ridge Dr area, Riverview FL
            </p>
          </div>

          <EmptyState
            icon={Home}
            title="Map Unavailable"
            description="Centered on 4916 Pond Ridge Dr, Riverview FL 33578"
            size="default"
            className="bg-gray-50"
          />
        </div>
      );
    }

    return (
      <div className={styles.mapContainer}>
        <div className={styles.mapHeader}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className={styles.mapTitle}>Valhalla</h2>
              <p className={styles.mapSubtitle}>Riverview, FL</p>
            </div>

            <BuildingTypeFilter
              selectedType={selectedBuildingType}
              onTypeSelect={onBuildingTypeSelect}
            />
          </div>
        </div>

        <div style={{ height: '480px', width: '100%' }}>
          <MapContainer
            center={MAP_CONFIG.defaultCenter}
            zoom={MAP_CONFIG.defaultZoom}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            className="rounded-b-lg"
            whenCreated={(mapInstance) => {
              window.leafletMap = mapInstance;
            }}
            onError={() => {
              setMapError(true);
            }}
          >
            <TileLayer
              url={tileConfig.url}
              attribution={tileConfig.attribution}
            />

            {allBuildingsWithCoordinates.map((building) => {
              const markerColor = getMarkerColor(building.buildingType);
              const customIcon = createBadgeIcon(L, {
                count: building.units.length,
                badgeColor: markerColor,
                borderColor: 'white',
                textColor: 'white',
                size: 'md',
              });

              return (
                <Marker
                  key={`building-${building.buildingId}`}
                  position={building.coordinates}
                  icon={customIcon}
                >
                  <Popup className="custom-popup">
                    <div
                      style={{
                        minWidth: '250px',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 'bold',
                          fontSize: '16px',
                          marginBottom: '8px',
                          color: '#1f2937',
                          padding: '0 4px',
                        }}
                      >
                        {building.buildingId.replace('building-', 'Building ')}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          marginBottom: '12px',
                          padding: '0 4px',
                        }}
                      >
                        {building.buildingType} • {building.units.length} unit
                        {building.units.length !== 1 ? 's' : ''}
                      </div>
                      <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                        {building.units.map((unit, index) => (
                          <div
                            key={unit.id}
                            className="unit-row-hover"
                            style={{
                              padding: '4px',
                              borderBottom:
                                index < building.units.length - 1
                                  ? '1px solid #e5e7eb'
                                  : 'none',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              width: '100%',
                              boxSizing: 'border-box',
                            }}
                            onClick={() => onUnitSelect && onUnitSelect(unit)}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                width: '100%',
                                pointerEvents: 'none',
                              }}
                            >
                              <div style={{ flex: '1', minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: '#1f2937',
                                    marginBottom: '2px',
                                  }}
                                >
                                  {unit.streetAddress}
                                </div>
                                <div
                                  style={{ fontSize: '11px', color: '#6b7280' }}
                                >
                                  {unit.colorScheme}
                                </div>
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '4px',
                                  marginLeft: '12px',
                                  flexShrink: 0,
                                }}
                              >
                                {[
                                  {
                                    paintInfo: unit.paintCodes.bodyPrimary,
                                    label: 'Body Primary',
                                  },
                                  {
                                    paintInfo: unit.paintCodes.bodySecondary,
                                    label: 'Body Secondary',
                                  },
                                  {
                                    paintInfo: unit.paintCodes.trim,
                                    label: 'Trim',
                                  },
                                  {
                                    paintInfo: unit.paintCodes.door,
                                    label: 'Door',
                                  },
                                ].map(({ paintInfo, label }) => (
                                  <div
                                    key={label}
                                    style={{
                                      width: '16px',
                                      height: '16px',
                                      borderRadius: '3px',
                                      backgroundColor:
                                        paintInfo?.hex || '#e5e7eb',
                                      border: '1px solid #d1d5db',
                                      flexShrink: 0,
                                    }}
                                    title={`${label}: ${paintInfo?.code || 'N/A'} - ${paintInfo?.name || 'Unknown'}`}
                                  />
                                ))}
                              </div>
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
  }
);

const UnitDetailMap = memo(({ unit, setSelectedUnit }) => {
  const [mapError, setMapError] = useState(false);
  const tileConfig = useMapTiles();

  const unitCoordinates =
    unit.coordinates || unit.buildingCoordinates || MAP_CONFIG.defaultCenter;
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
      <div className={styles.mapContainer}>
        <div className={styles.mapHeader}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {unit.fullAddress}
              </h2>
              <p className="text-gray-600">
                {unit.buildingType} • {unit.colorScheme}
              </p>
            </div>
            <Button
              variant="icon"
              size="md"
              padding="none"
              onClick={() => setSelectedUnit(null)}
              aria-label="Close unit details"
            >
              <X />
            </Button>
          </div>
        </div>

        <EmptyState
          icon={Home}
          title="Map not available"
          size="small"
          className="bg-gray-50"
        />

        <PaintCodeSection colorScheme={unit.colorSchemeData} />
      </div>
    );
  }

  return (
    <div className={styles.mapContainer}>
      <div className={styles.unitDetailHeader}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={styles.unitDetailTitle}>{unit.fullAddress}</h2>
            <p className={styles.unitDetailSubtitle}>
              {unit.buildingType} Unit | {unit.colorScheme}
            </p>
          </div>
          <Button
            variant="icon"
            size="md"
            padding="none"
            onClick={() => setSelectedUnit(null)}
            aria-label="Close unit details"
          >
            <X />
          </Button>
        </div>
      </div>

      <div style={{ height: '200px', width: '100%' }}>
        <MapContainer
          center={unitCoordinates}
          zoom={MAP_CONFIG.detailZoom}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          whenCreated={(mapInstance) => {
            window.unitMap = mapInstance;
          }}
          onError={() => setMapError(true)}
        >
          <TileLayer
            url={tileConfig.url}
            attribution={tileConfig.attribution}
          />

          <Marker
            position={unitCoordinates}
            icon={createPinIcon(L, {
              badgeColor: markerColor,
              borderColor: 'white',
              textColor: 'white',
              size: 'md',
            })}
          >
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <strong>{unit.streetAddress}</strong>
                <br />
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {unit.buildingType} • {unit.colorScheme}
                </span>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <PaintCodeSection colorScheme={unit.colorSchemeData} />
    </div>
  );
});

// Paint code section component
const PaintCodeSection = memo(({ colorScheme }) => {
  if (!colorScheme) {
    return null;
  }

  return (
    <div className={styles.paintCodeSection}>
      <div className="mb-6">
        <h3 className={styles.paintCodeTitle}>Sherwin-Williams Paint Codes</h3>
        <p className={styles.paintCodeDescription}>
          Take these codes to any Sherwin-Williams store for exact color
          matching. Consider ordering samples before making your final purchase.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SWPaintCodeCard
          label="Body (Primary)"
          paintCode={colorScheme.paintCodes.bodyPrimary}
          type={colorScheme.type}
          finish={colorScheme.finish}
        />
        <SWPaintCodeCard
          label="Body (Secondary)"
          paintCode={colorScheme.paintCodes.bodySecondary}
          type={colorScheme.type}
          finish={colorScheme.finish}
        />
        <SWPaintCodeCard
          label="Trim"
          paintCode={colorScheme.paintCodes.trim}
          type={colorScheme.type}
          finish={colorScheme.finish}
        />
        <SWPaintCodeCard
          label="Door"
          paintCode={colorScheme.paintCodes.door}
          type={colorScheme.type}
          finish={colorScheme.finish}
        />
      </div>
    </div>
  );
});

const UnitDetailView = memo(({ unit, setSelectedUnit }) => (
  <div className="space-y-4">
    <UnitDetailMap unit={unit} setSelectedUnit={setSelectedUnit} />
  </div>
));

const TownhomePaintApp = () => {
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [hoveredSwatch, setHoveredSwatch] = useState(null);
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [searchMeta, setSearchMeta] = useState({
    searchTerm: '',
    selectedBuildingType: 'All',
    hasActiveFilters: false,
  });

  const handleBuildingTypeFilter = useCallback((buildingType) => {
    setSearchMeta((prev) => ({
      ...prev,
      selectedBuildingType: buildingType,
      hasActiveFilters: prev.searchTerm.trim() !== '' || buildingType !== 'All',
    }));
  }, []);

  const handleFilteredUnitsChange = useCallback((filtered, meta) => {
    setFilteredUnits(filtered);
    setSearchMeta((prev) => ({
      ...prev,
      searchTerm: meta.searchTerm,
      hasActiveFilters:
        meta.searchTerm.trim() !== '' || prev.selectedBuildingType !== 'All',
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

  return (
    <div className={styles.appContainer}>
      <div className={styles.maxWidth}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Valhalla Exterior Paint Guide</h1>
            <p className={styles.subtitle}>
              Find official Sherwin-Williams exterior paint colors for your
              unit.
            </p>
          </div>
        </header>

        {selectedUnit ? (
          <UnitDetailView
            unit={selectedUnit}
            setSelectedUnit={setSelectedUnit}
          />
        ) : (
          <div className={styles.contentGrid}>
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

            <div className={styles.resultsGrid}>
              {!searchMeta.hasActiveFilters ? (
                <EmptyState
                  icon={Home}
                  title="Search for Your Unit"
                  description="Start typing to find units by address, building type, or color scheme"
                  size="large"
                />
              ) : filteredUnits.length > 0 ? (
                filteredUnits.map((unit) => (
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
                <EmptyState
                  icon={Search}
                  title={
                    searchMeta.searchTerm.trim() === ''
                      ? searchMeta.selectedBuildingType === 'All'
                        ? 'No units found'
                        : `No ${searchMeta.selectedBuildingType} units found`
                      : `No ${searchMeta.selectedBuildingType === 'All' ? '' : searchMeta.selectedBuildingType + ' '}units found matching "${searchMeta.searchTerm}"`
                  }
                  size="default"
                >
                  {searchMeta.selectedBuildingType !== 'All' && (
                    <p className={styles.noResultsHint}>
                      Try searching in all units or adjusting your search term
                    </p>
                  )}
                </EmptyState>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TownhomePaintApp;
