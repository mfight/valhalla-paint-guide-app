// components/features/UnitSearch/UnitSearch.jsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Search, Home } from 'lucide-react';
import SearchInput from '../../ui/SearchInput';
import SegmentedControl from '../../ui/SegmentedControl';

const UnitSearch = ({
  units = [],
  onUnitSelect,
  onFilteredUnitsChange,
  placeholder = 'Search by street address, building type, or color scheme...',
  showBuildingTypeFilter = true,
  searchTerm: externalSearchTerm, // Accept external search term
  selectedBuildingType: externalBuildingType, // Accept external building type
  buildingTypes = [
    { value: 'All', label: 'All units', color: null },
    { value: 'Bay', label: 'Bay', color: '#3B82F6' },
    { value: 'Chase', label: 'Chase', color: '#10B981' },
    { value: 'Keys', label: 'Keys', color: '#F59E0B' },
  ],
  emptyStateComponent,
  noResultsComponent,
  className = '',
  ...props
}) => {
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm || '');
  const [selectedBuildingType, setSelectedBuildingType] = useState(
    externalBuildingType || 'All'
  );

  // Sync with external state if provided
  useEffect(() => {
    if (externalSearchTerm !== undefined) {
      setSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm]);

  useEffect(() => {
    if (externalBuildingType !== undefined) {
      setSelectedBuildingType(externalBuildingType);
    }
  }, [externalBuildingType]);

  // Memoized filtered units
  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const matchesSearch =
        searchTerm === '' ||
        [
          unit.streetAddress,
          unit.streetNumber,
          unit.streetName,
          unit.buildingType,
          unit.colorScheme,
          unit.buildingId?.replace('building-', 'Building '),
        ].some((field) =>
          field?.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesBuildingType =
        selectedBuildingType === 'All' ||
        unit.buildingType === selectedBuildingType;

      return matchesSearch && matchesBuildingType;
    });
  }, [units, searchTerm, selectedBuildingType]);

  // Notify parent of filtered units changes (only search term, not building type)
  React.useEffect(() => {
    if (onFilteredUnitsChange) {
      onFilteredUnitsChange(filteredUnits, {
        searchTerm,
        hasActiveFilters: searchTerm.trim() !== '',
      });
    }
  }, [filteredUnits, searchTerm, onFilteredUnitsChange]);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchTerm('');
  }, []);

  const handleBuildingTypeFilter = useCallback((buildingType) => {
    setSelectedBuildingType(buildingType);
  }, []);

  // Building type filter component
  const BuildingTypeFilter = () => (
    <SegmentedControl
      options={buildingTypes}
      selectedValue={selectedBuildingType}
      onSelect={handleBuildingTypeFilter}
      ariaLabel="Filter units by building type"
    />
  );

  // Default empty state
  const DefaultEmptyState = () => (
    <div className="text-center py-12 text-gray-500">
      <Home className="w-16 h-16 mx-auto mb-4 text-gray-300" />
      <h3 className="text-lg font-semibold mb-2">Search for Your Unit</h3>
      <p>
        Start typing to find units by address, building type, or color scheme
      </p>
    </div>
  );

  // Default no results state
  const DefaultNoResults = () => (
    <div className="text-center py-8 text-gray-500">
      <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <p>
        {searchTerm.trim() === ''
          ? // Empty search - only filtering by building type
            selectedBuildingType === 'All'
            ? 'No units found'
            : `No ${selectedBuildingType} units found`
          : // Has search term
            `No ${selectedBuildingType === 'All' ? '' : selectedBuildingType + ' '}units found matching "${searchTerm}"`}
        {selectedBuildingType !== 'All' && (
          <span className="block mt-1 text-sm">
            Try searching in all units or adjusting your search term
          </span>
        )}
      </p>
    </div>
  );

  const hasActiveFilters =
    searchTerm.trim() !== '' || selectedBuildingType !== 'All';
  const showEmptyState = !hasActiveFilters && filteredUnits.length === 0;
  const showNoResults = hasActiveFilters && filteredUnits.length === 0;

  return (
    <div className={`unit-search ${className}`} {...props}>
      {/* Search Controls */}
      <div className="space-y-4">
        {showBuildingTypeFilter && (
          <div className="flex justify-center">
            <BuildingTypeFilter />
          </div>
        )}

        <SearchInput
          value={searchTerm}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          placeholder={placeholder}
          ariaLabel="Search units"
        />
      </div>

      {/* Results or States */}
      <div className="mt-4">
        {showEmptyState && (emptyStateComponent || <DefaultEmptyState />)}

        {showNoResults && (noResultsComponent || <DefaultNoResults />)}
      </div>
    </div>
  );
};

// Export search state and controls separately for flexibility
export const useUnitSearch = (units = []) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuildingType, setSelectedBuildingType] = useState('All');

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const matchesSearch =
        searchTerm === '' ||
        [
          unit.streetAddress,
          unit.streetNumber,
          unit.streetName,
          unit.buildingType,
          unit.colorScheme,
          unit.buildingId?.replace('building-', 'Building '),
        ].some((field) =>
          field?.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesBuildingType =
        selectedBuildingType === 'All' ||
        unit.buildingType === selectedBuildingType;

      return matchesSearch && matchesBuildingType;
    });
  }, [units, searchTerm, selectedBuildingType]);

  const searchControls = {
    searchTerm,
    setSearchTerm,
    selectedBuildingType,
    setSelectedBuildingType,
    hasActiveFilters:
      searchTerm.trim() !== '' || selectedBuildingType !== 'All',
  };

  return {
    filteredUnits,
    searchControls,
  };
};

export default UnitSearch;
