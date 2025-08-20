import React, { useState, useCallback, memo } from 'react';
import { Search, Home, Palette, X } from 'lucide-react';
import { colorSchemes } from './data/colorSchemes';
import { buildingData } from './data/buildingData';

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
    { value: 'All', label: 'All units' },
    { value: 'Bay', label: 'Bay' },
    { value: 'Chase', label: 'Chase' },
    { value: 'Keys', label: 'Keys' }
  ];
  
  return (
    <div className="inline-flex bg-gray-100 rounded-lg p-1">
      {buildingTypes.map(({ value, label }, index) => (
        <button
          key={value}
          onClick={() => onTypeSelect(value)}
          className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md ${
            selectedType === value
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {label}
        </button>
      ))}
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

  const PaintCodeCard = ({ label, paintInfo }) => (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-medium text-gray-700 mb-2">{label}</h4>
      <div className="flex items-center space-x-3">
        <div 
          className="w-12 h-12 rounded border-2 border-gray-300 shadow-inner"
          style={{ backgroundColor: paintInfo.color }}
        ></div>
        <div>
          <p className="font-bold text-lg">{paintInfo.code}</p>
          <p className="text-gray-600">{paintInfo.name}</p>
        </div>
      </div>
    </div>
  );

  const UnitDetailView = ({ unit }) => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{unit.fullAddress}</h2>
          <p className="text-gray-600">Building Type: {unit.buildingType}</p>
          <p className="text-gray-600">Color Scheme: {unit.colorScheme}</p>
        </div>
        <button 
          onClick={() => setSelectedUnit(null)}
          className="text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PaintCodeCard label="Body (Primary)" paintInfo={unit.paintCodes.bodyPrimary} />
        <PaintCodeCard label="Body (Secondary)" paintInfo={unit.paintCodes.bodySecondary} />
        <PaintCodeCard label="Trim" paintInfo={unit.paintCodes.trim} />
        <PaintCodeCard label="Door" paintInfo={unit.paintCodes.door} />
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Sherwin-Williams Paint Codes</h3>
        <p className="text-blue-700 text-sm">
          Take these codes to any Sherwin-Williams store for exact color matching. 
          Consider ordering samples before making your final purchase.
        </p>
      </div>
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
          <UnitDetailView unit={selectedUnit} />
        ) : (
          <div className="space-y-4">
            <SearchInput 
              value={searchTerm} 
              onChange={handleSearchChange} 
              onClear={handleSearchClear} 
            />
            
            <BuildingTypeFilter 
              selectedType={selectedBuildingType}
              onTypeSelect={handleBuildingTypeFilter}
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