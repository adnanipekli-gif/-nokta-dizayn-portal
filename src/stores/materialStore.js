/**
 * Material & Lighting Store
 * Zustand state management for 3D scene configuration
 */

import React from 'react';

// Simple store implementation (Zustand alternative)
class MaterialStore {
  constructor() {
    this.state = {
      // Current materials
      floorMaterial: 'tile',
      wallMaterial: 'white',
      shelfMaterial: 'steel',

      // Current lighting
      lightingProfile: 'bright',
      lightingIntensity: 1.0,
      lightingColor: '#ffffff',

      // Scene configuration
      currentScene: null,
      customMaterials: {},

      // Favorites
      favoriteMaterials: [],
      favoriteLighting: [],

      // History
      materialHistory: [],
      lightingHistory: []
    };

    this.listeners = [];
  }

  // Subscribe to state changes
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Get current state
  getState() {
    return { ...this.state };
  }

  // Set material
  setFloorMaterial(material) {
    this.state.materialHistory.push({
      type: 'floor',
      value: this.state.floorMaterial,
      timestamp: Date.now()
    });
    this.state.floorMaterial = material;
    this.notify();
  }

  setWallMaterial(material) {
    this.state.materialHistory.push({
      type: 'walls',
      value: this.state.wallMaterial,
      timestamp: Date.now()
    });
    this.state.wallMaterial = material;
    this.notify();
  }

  setShelfMaterial(material) {
    this.state.materialHistory.push({
      type: 'shelves',
      value: this.state.shelfMaterial,
      timestamp: Date.now()
    });
    this.state.shelfMaterial = material;
    this.notify();
  }

  // Set lighting
  setLightingProfile(profile) {
    this.state.lightingHistory.push({
      value: this.state.lightingProfile,
      timestamp: Date.now()
    });
    this.state.lightingProfile = profile;
    this.notify();
  }

  setLightingIntensity(intensity) {
    this.state.lightingIntensity = Math.max(0, Math.min(2, intensity));
    this.notify();
  }

  setLightingColor(color) {
    this.state.lightingColor = color;
    this.notify();
  }

  // Set scene
  setScene(scene) {
    this.state.currentScene = scene;
    this.notify();
  }

  // Favorites management
  toggleFavoriteMaterial(material) {
    const key = `${material.type}:${material.name}`;
    const index = this.state.favoriteMaterials.indexOf(key);
    if (index > -1) {
      this.state.favoriteMaterials.splice(index, 1);
    } else {
      this.state.favoriteMaterials.push(key);
    }
    this.notify();
  }

  isFavoriteMaterial(type, name) {
    return this.state.favoriteMaterials.includes(`${type}:${name}`);
  }

  toggleFavoriteLighting(profile) {
    const index = this.state.favoriteLighting.indexOf(profile);
    if (index > -1) {
      this.state.favoriteLighting.splice(index, 1);
    } else {
      this.state.favoriteLighting.push(profile);
    }
    this.notify();
  }

  isFavoriteLighting(profile) {
    return this.state.favoriteLighting.includes(profile);
  }

  // History management
  undoMaterialChange() {
    if (this.state.materialHistory.length > 0) {
      const last = this.state.materialHistory.pop();
      switch (last.type) {
        case 'floor':
          this.state.floorMaterial = last.value;
          break;
        case 'walls':
          this.state.wallMaterial = last.value;
          break;
        case 'shelves':
          this.state.shelfMaterial = last.value;
          break;
      }
      this.notify();
    }
  }

  undoLightingChange() {
    if (this.state.lightingHistory.length > 0) {
      const last = this.state.lightingHistory.pop();
      this.state.lightingProfile = last.value;
      this.notify();
    }
  }

  // Reset to defaults
  resetMaterials() {
    this.state.materialHistory = [];
    this.state.floorMaterial = 'tile';
    this.state.wallMaterial = 'white';
    this.state.shelfMaterial = 'steel';
    this.notify();
  }

  resetLighting() {
    this.state.lightingHistory = [];
    this.state.lightingProfile = 'bright';
    this.state.lightingIntensity = 1.0;
    this.notify();
  }

  // Export configuration
  exportConfig() {
    return {
      materials: {
        floor: this.state.floorMaterial,
        walls: this.state.wallMaterial,
        shelves: this.state.shelfMaterial
      },
      lighting: {
        profile: this.state.lightingProfile,
        intensity: this.state.lightingIntensity,
        color: this.state.lightingColor
      },
      scene: this.state.currentScene,
      favorites: {
        materials: this.state.favoriteMaterials,
        lighting: this.state.favoriteLighting
      }
    };
  }

  // Import configuration
  importConfig(config) {
    if (config.materials) {
      this.state.floorMaterial = config.materials.floor || 'tile';
      this.state.wallMaterial = config.materials.walls || 'white';
      this.state.shelfMaterial = config.materials.shelves || 'steel';
    }
    if (config.lighting) {
      this.state.lightingProfile = config.lighting.profile || 'bright';
      this.state.lightingIntensity = config.lighting.intensity || 1.0;
      this.state.lightingColor = config.lighting.color || '#ffffff';
    }
    if (config.scene) {
      this.state.currentScene = config.scene;
    }
    if (config.favorites) {
      this.state.favoriteMaterials = config.favorites.materials || [];
      this.state.favoriteLighting = config.favorites.lighting || [];
    }
    this.notify();
  }

  // Persist to localStorage
  save(key = 'materialStore') {
    try {
      localStorage.setItem(key, JSON.stringify(this.exportConfig()));
    } catch (error) {
      console.error('Failed to save material store:', error);
    }
  }

  // Load from localStorage
  load(key = 'materialStore') {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        this.importConfig(JSON.parse(data));
      }
    } catch (error) {
      console.error('Failed to load material store:', error);
    }
  }

  // Auto-save on changes
  enableAutoSave(key = 'materialStore', interval = 5000) {
    setInterval(() => {
      this.save(key);
    }, interval);
  }
}

// Create and export singleton instance
const materialStore = new MaterialStore();

// Try to load from localStorage on init
materialStore.load();

// Auto-save every 5 seconds
materialStore.enableAutoSave();

export default materialStore;

/**
 * React Hook for using material store
 */
export function useMaterialStore() {
  const [state, setState] = React.useState(materialStore.getState());

  React.useEffect(() => {
    const unsubscribe = materialStore.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  return {
    state,
    setFloorMaterial: (m) => materialStore.setFloorMaterial(m),
    setWallMaterial: (m) => materialStore.setWallMaterial(m),
    setShelfMaterial: (m) => materialStore.setShelfMaterial(m),
    setLightingProfile: (p) => materialStore.setLightingProfile(p),
    setLightingIntensity: (i) => materialStore.setLightingIntensity(i),
    setLightingColor: (c) => materialStore.setLightingColor(c),
    toggleFavoriteMaterial: (m) => materialStore.toggleFavoriteMaterial(m),
    isFavoriteMaterial: (t, n) => materialStore.isFavoriteMaterial(t, n),
    toggleFavoriteLighting: (p) => materialStore.toggleFavoriteLighting(p),
    isFavoriteLighting: (p) => materialStore.isFavoriteLighting(p),
    undoMaterialChange: () => materialStore.undoMaterialChange(),
    undoLightingChange: () => materialStore.undoLightingChange(),
    resetMaterials: () => materialStore.resetMaterials(),
    resetLighting: () => materialStore.resetLighting(),
    exportConfig: () => materialStore.exportConfig(),
    importConfig: (c) => materialStore.importConfig(c)
  };
}
