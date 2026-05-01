import { create } from 'zustand';

const useThemeStore = create((set) => ({
  isDarkMode: true,
  toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));

export const themeColors = {
  light: {
    bg: '#ffffff',
    text: '#1a1a1a',
    border: '#e0e0e0',
    primary: '#1B3D4F',
  },
  dark: {
    bg: '#0a0a0a',
    text: '#ffffff',
    border: '#333333',
    primary: '#00C4CC',
  },
};

export default useThemeStore;
