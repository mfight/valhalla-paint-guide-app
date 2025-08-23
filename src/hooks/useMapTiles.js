// src/hooks/useMapTiles.js
import { useState, useEffect } from 'react';
import { getTileConfig } from '../config/mapConfig';

// Hook to detect system dark mode preference
export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => 
	window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	const handleChange = (e) => setIsDarkMode(e.matches);
	
	mediaQuery.addEventListener('change', handleChange);
	return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isDarkMode;
};

// Hook to get current map tile configuration
export const useMapTiles = () => {
  const isDarkMode = useDarkMode();
  return getTileConfig(isDarkMode);
};