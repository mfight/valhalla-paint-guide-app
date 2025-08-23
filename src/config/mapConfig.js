// src/config/mapConfig.js

// Available tile providers
export const TILE_PROVIDERS = {
  // Light themes
  openStreetMap: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    theme: 'light',
  },

  cartoVoyager: {
    name: 'CartoDB Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    theme: 'light',
  },

  cartoPositron: {
    name: 'CartoDB Positron (Light)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    theme: 'light',
  },

  // Dark themes
  cartoDarkMatter: {
    name: 'CartoDB Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    theme: 'dark',
  },

  stamenToner: {
    name: 'Stamen Toner (High Contrast)',
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.png',
    attribution:
      'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    theme: 'dark',
  },

  esriDarkGray: {
    name: 'ESRI Dark Gray',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    theme: 'dark',
  },

  // Special themes
  cartoNoLabels: {
    name: 'CartoDB No Labels (Light)',
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    theme: 'light',
  },

  cartoDarkNoLabels: {
    name: 'CartoDB Dark No Labels',
    url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    theme: 'dark',
  },
};

// Current configuration - easy to change!
export const MAP_CONFIG = {
  // Default tiles for each theme
  defaultLightTile: 'openStreetMap', // Change this to switch light theme
  defaultDarkTile: 'cartoDarkNoLabels', // Change this to switch dark theme

  // Map settings
  defaultCenter: [27.90186699819714, -82.33602233229566], // Valhalla neighborhood
  defaultZoom: 17,
  detailZoom: 18,

  // Marker settings
  markerColors: {
    Bay: '#3B82F6', // Blue
    Chase: '#10B981', // Green
    Keys: '#F59E0B', // Orange
    default: '#6B7280', // Gray
  },
};

// Helper function to get current tile config based on theme
export const getTileConfig = (isDarkMode = false) => {
  const tileKey = isDarkMode
    ? MAP_CONFIG.defaultDarkTile
    : MAP_CONFIG.defaultLightTile;
  return TILE_PROVIDERS[tileKey];
};

// Helper to get all tiles for a specific theme (useful for settings UI later)
export const getTilesByTheme = (theme) => {
  return Object.entries(TILE_PROVIDERS)
    .filter(([key, config]) => config.theme === theme)
    .reduce((acc, [key, config]) => ({ ...acc, [key]: config }), {});
};

// Helper to get marker color
export const getMarkerColor = (buildingType) => {
  return (
    MAP_CONFIG.markerColors[buildingType] || MAP_CONFIG.markerColors.default
  );
};
