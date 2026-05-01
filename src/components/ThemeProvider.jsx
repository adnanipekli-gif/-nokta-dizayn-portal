import React, { createContext, useContext } from 'react';
import useThemeStore, { themeColors } from '../stores/themeStore';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? themeColors.dark : themeColors.light;

  const globalStyles = `
    body {
      background-color: ${colors.bg};
      color: ${colors.text};
      transition: background-color 0.3s, color 0.3s;
    }
    * {
      color: ${colors.text};
    }
  `;

  return (
    <ThemeContext.Provider value={colors}>
      <style>{globalStyles}</style>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
