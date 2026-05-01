import React, { createContext, useContext, useEffect } from 'react';
import useThemeStore, { themeColors } from '../stores/themeStore';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? themeColors.dark : themeColors.light;

  // Apply theme to document root on mount and when isDarkMode changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-color', colors.bg);
    root.style.setProperty('--text-color', colors.text);
    root.style.setProperty('--border-color', colors.border);
    root.style.setProperty('--primary-color', colors.primary);
    
    // Apply body styles
    document.body.style.backgroundColor = colors.bg;
    document.body.style.color = colors.text;
    document.body.style.transition = 'background-color 0.3s, color 0.3s';
  }, [colors, isDarkMode]);

  return (
    <ThemeContext.Provider value={colors}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
