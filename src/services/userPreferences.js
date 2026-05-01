/**
 * User Preferences Manager
 * Store and manage user settings, preferences, and profile data
 */

import React from 'react';

/**
 * Default Preferences
 */
const DEFAULT_PREFERENCES = {
  // Theme
  theme: 'light',
  
  // Layout
  defaultLayout: '3d-upscale',
  sidebarVisible: true,
  
  // Materials & Lighting
  favoriteFloorMaterial: 'tile',
  favoriteWallMaterial: 'white',
  favoriteShelfMaterial: 'steel',
  favoriteLightingProfile: 'bright',
  favoriteScenes: [],
  
  // PDF & Export
  defaultPDFTemplate: 'snowy',
  pdfQuality: 'pro',
  autoDownloadPDF: true,
  
  // Email
  emailNotifications: true,
  weeklyReports: false,
  batchExportNotifications: true,
  emailAddress: '',
  
  // Features
  enableAnalytics: true,
  enableAutoSave: true,
  autoSaveInterval: 5000, // milliseconds
  
  // Keybinds (future)
  customKeybinds: {},
  
  // Appearance
  fontSize: 'medium',
  showTooltips: true,
  animationsEnabled: true,
  
  // Advanced
  enableBeta: false,
  showDebugInfo: false
};

/**
 * User Preferences Class
 */
export class UserPreferences {
  constructor() {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.listeners = [];
    this.load();
  }

  /**
   * Get preference
   */
  get(key) {
    return this.preferences[key];
  }

  /**
   * Set preference
   */
  set(key, value) {
    const oldValue = this.preferences[key];
    this.preferences[key] = value;
    
    // Notify listeners
    this.notifyListeners(key, value, oldValue);
    
    // Auto-save
    this.save();
    
    console.log(`🔧 Preference updated: ${key} = ${value}`);
  }

  /**
   * Update multiple preferences
   */
  setMultiple(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      this.preferences[key] = value;
    });
    this.save();
  }

  /**
   * Reset to defaults
   */
  reset() {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.save();
    console.log('✅ Preferences reset to defaults');
  }

  /**
   * Get all preferences
   */
  getAll() {
    return { ...this.preferences };
  }

  /**
   * Subscribe to changes
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify listeners
   */
  notifyListeners(key, newValue, oldValue) {
    this.listeners.forEach(listener => {
      try {
        listener(key, newValue, oldValue);
      } catch (error) {
        console.error('Preference listener error:', error);
      }
    });
  }

  /**
   * Save to localStorage
   */
  save() {
    try {
      localStorage.setItem('user_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  /**
   * Load from localStorage
   */
  load() {
    try {
      const saved = localStorage.getItem('user_preferences');
      if (saved) {
        // Merge with defaults to preserve new keys
        this.preferences = {
          ...DEFAULT_PREFERENCES,
          ...JSON.parse(saved)
        };
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }

  /**
   * Export as JSON
   */
  exportJSON() {
    return JSON.stringify(this.preferences, null, 2);
  }

  /**
   * Import from JSON
   */
  importJSON(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      this.setMultiple(imported);
      console.log('✅ Preferences imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import preferences:', error);
      return false;
    }
  }

  /**
   * Export as file
   */
  exportToFile() {
    const json = this.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nokta-preferences-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Clear all data (including analytics)
   */
  clearAll() {
    this.reset();
    localStorage.clear();
    sessionStorage.clear();
    console.log('🗑️ All data cleared');
  }
}

/**
 * User Profile
 */
export class UserProfile {
  constructor() {
    this.profile = {
      id: this.generateId(),
      name: 'Nokta User',
      email: '',
      company: '',
      role: 'Designer',
      createdAt: new Date(),
      updatedAt: new Date(),
      avatar: null,
      bio: ''
    };
    this.load();
  }

  generateId() {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update profile
   */
  update(data) {
    this.profile = {
      ...this.profile,
      ...data,
      updatedAt: new Date()
    };
    this.save();
  }

  /**
   * Get profile
   */
  getProfile() {
    return { ...this.profile };
  }

  /**
   * Save to localStorage
   */
  save() {
    try {
      localStorage.setItem('user_profile', JSON.stringify(this.profile));
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  }

  /**
   * Load from localStorage
   */
  load() {
    try {
      const saved = localStorage.getItem('user_profile');
      if (saved) {
        this.profile = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }

  /**
   * Reset profile
   */
  reset() {
    this.profile = {
      id: this.profile.id, // Keep ID
      name: 'Nokta User',
      email: '',
      company: '',
      role: 'Designer',
      createdAt: this.profile.createdAt,
      updatedAt: new Date(),
      avatar: null,
      bio: ''
    };
    this.save();
  }
}

/**
 * Favorites Manager
 */
export class FavoritesManager {
  constructor() {
    this.favorites = {
      materials: [],
      lighting: [],
      scenes: [],
      assets: [],
      exports: []
    };
    this.load();
  }

  /**
   * Add favorite
   */
  addFavorite(type, item) {
    if (!this.favorites[type]) {
      this.favorites[type] = [];
    }
    
    // Avoid duplicates
    if (!this.favorites[type].find(f => f.id === item.id)) {
      this.favorites[type].push({
        ...item,
        addedAt: new Date()
      });
      this.save();
    }
  }

  /**
   * Remove favorite
   */
  removeFavorite(type, itemId) {
    if (this.favorites[type]) {
      this.favorites[type] = this.favorites[type].filter(f => f.id !== itemId);
      this.save();
    }
  }

  /**
   * Get favorites by type
   */
  getFavorites(type) {
    return this.favorites[type] || [];
  }

  /**
   * Check if favorited
   */
  isFavorited(type, itemId) {
    return this.favorites[type]?.some(f => f.id === itemId) || false;
  }

  /**
   * Save to localStorage
   */
  save() {
    try {
      localStorage.setItem('user_favorites', JSON.stringify(this.favorites));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  }

  /**
   * Load from localStorage
   */
  load() {
    try {
      const saved = localStorage.getItem('user_favorites');
      if (saved) {
        this.favorites = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }

  /**
   * Clear all favorites
   */
  clearAll() {
    this.favorites = {
      materials: [],
      lighting: [],
      scenes: [],
      assets: [],
      exports: []
    };
    this.save();
  }
}

// Create singleton instances
export const userPreferences = new UserPreferences();
export const userProfile = new UserProfile();
export const favoritesManager = new FavoritesManager();

/**
 * React hook for preferences
 */
export function usePreferences() {
  const [prefs, setPrefs] = React.useState(userPreferences.getAll());

  React.useEffect(() => {
    const unsubscribe = userPreferences.subscribe((key, newValue) => {
      setPrefs(userPreferences.getAll());
    });
    return unsubscribe;
  }, []);

  return {
    preferences: prefs,
    get: (key) => userPreferences.get(key),
    set: (key, value) => userPreferences.set(key, value),
    setMultiple: (updates) => userPreferences.setMultiple(updates),
    reset: () => userPreferences.reset()
  };
}
