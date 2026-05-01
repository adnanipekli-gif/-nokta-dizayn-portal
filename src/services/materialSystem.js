/**
 * Material System
 * Manages materials, textures, and lighting for 3D scenes
 */

// Material presets library
export const MATERIAL_PRESETS = {
  flooring: {
    tile: {
      name: 'Glazed Tile',
      color: 0xcccccc,
      metalness: 0.1,
      roughness: 0.3,
      emissive: 0x000000,
      description: 'High-gloss ceramic tile for modern markets'
    },
    concrete: {
      name: 'Polished Concrete',
      color: 0xaaaaaa,
      metalness: 0.0,
      roughness: 0.6,
      emissive: 0x000000,
      description: 'Industrial look, easy to clean'
    },
    vinyl: {
      name: 'Vinyl Sheet',
      color: 0xbbbbbb,
      metalness: 0.05,
      roughness: 0.4,
      emissive: 0x000000,
      description: 'Durable, slip-resistant flooring'
    },
    marble: {
      name: 'Marble Effect',
      color: 0xf5f5f5,
      metalness: 0.0,
      roughness: 0.2,
      emissive: 0x000000,
      description: 'Premium appearance, classic elegance'
    }
  },

  walls: {
    white: {
      name: 'Clean White',
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.8,
      emissive: 0x000000,
      description: 'Neutral, professional, reflects light'
    },
    lightGray: {
      name: 'Light Gray',
      color: 0xe8e8e8,
      metalness: 0.0,
      roughness: 0.7,
      emissive: 0x000000,
      description: 'Warm neutral tone'
    },
    teal: {
      name: 'ND Teal',
      color: 0x1b3d4f,
      metalness: 0.1,
      roughness: 0.5,
      emissive: 0x000000,
      description: 'ND GROUP brand color'
    },
    cream: {
      name: 'Cream',
      color: 0xf0ebe1,
      metalness: 0.0,
      roughness: 0.75,
      emissive: 0x000000,
      description: 'Warm, inviting atmosphere'
    }
  },

  shelving: {
    steel: {
      name: 'Polished Steel',
      color: 0xcccccc,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x000000,
      description: 'Modern, durable metal frame'
    },
    wood: {
      name: 'Natural Wood',
      color: 0x8b5a2b,
      metalness: 0.0,
      roughness: 0.6,
      emissive: 0x000000,
      description: 'Warm wood tone, professional'
    },
    blackSteel: {
      name: 'Black Steel',
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x000000,
      description: 'Modern industrial style'
    },
    whiteLaminate: {
      name: 'White Laminate',
      color: 0xfafafa,
      metalness: 0.0,
      roughness: 0.4,
      emissive: 0x000000,
      description: 'Clean, easy to maintain'
    }
  }
};

// Lighting profiles
export const LIGHTING_PROFILES = {
  natural: {
    name: 'Natural Daylight',
    ambientColor: 0xffffff,
    ambientIntensity: 0.6,
    directionalColor: 0xffffeb,
    directionalIntensity: 0.8,
    directionalPosition: { x: 5, y: 10, z: 7 },
    pointColor: 0xffffff,
    pointIntensity: 0.3,
    pointPosition: { x: -5, y: 8, z: -5 },
    description: 'Bright natural light, ideal for product displays'
  },

  bright: {
    name: 'Bright Commercial',
    ambientColor: 0xffffff,
    ambientIntensity: 0.8,
    directionalColor: 0xffffff,
    directionalIntensity: 1.0,
    directionalPosition: { x: 10, y: 12, z: 8 },
    pointColor: 0xffffff,
    pointIntensity: 0.5,
    pointPosition: { x: -8, y: 10, z: -8 },
    description: 'High brightness for retail environments'
  },

  warm: {
    name: 'Warm Ambient',
    ambientColor: 0xffe4b5,
    ambientIntensity: 0.7,
    directionalColor: 0xffd580,
    directionalIntensity: 0.7,
    directionalPosition: { x: 5, y: 8, z: 6 },
    pointColor: 0xffaa55,
    pointIntensity: 0.4,
    pointPosition: { x: -4, y: 7, z: -4 },
    description: 'Warm, inviting lighting for customer areas'
  },

  cool: {
    name: 'Cool Professional',
    ambientColor: 0xe0f7ff,
    ambientIntensity: 0.65,
    directionalColor: 0xc0e8ff,
    directionalIntensity: 0.75,
    directionalPosition: { x: 6, y: 9, z: 8 },
    pointColor: 0xa0d8ff,
    pointIntensity: 0.35,
    pointPosition: { x: -6, y: 8, z: -6 },
    description: 'Cool tone, modern professional look'
  },

  dramatic: {
    name: 'Dramatic Accent',
    ambientColor: 0x444444,
    ambientIntensity: 0.4,
    directionalColor: 0xffffff,
    directionalIntensity: 1.2,
    directionalPosition: { x: 8, y: 10, z: 5 },
    pointColor: 0x00c4cc,
    pointIntensity: 0.6,
    pointPosition: { x: -5, y: 6, z: -8 },
    description: 'High contrast, highlights products'
  }
};

// Scene configuration profiles
export const SCENE_PROFILES = {
  supermarket: {
    name: 'Supermarket',
    floorMaterial: 'tile',
    wallMaterial: 'white',
    shelfMaterial: 'steel',
    lightingProfile: 'bright',
    description: 'Standard supermarket layout'
  },

  freezerAisle: {
    name: 'Freezer Aisle',
    floorMaterial: 'tile',
    wallMaterial: 'lightGray',
    shelfMaterial: 'steel',
    lightingProfile: 'cool',
    description: 'Cold storage optimized lighting'
  },

  freshProduce: {
    name: 'Fresh Produce',
    floorMaterial: 'vinyl',
    wallMaterial: 'cream',
    shelfMaterial: 'wood',
    lightingProfile: 'natural',
    description: 'Natural, warm lighting for fresh items'
  },

  premium: {
    name: 'Premium Store',
    floorMaterial: 'marble',
    wallMaterial: 'teal',
    shelfMaterial: 'blackSteel',
    lightingProfile: 'dramatic',
    description: 'High-end retail presentation'
  }
};

/**
 * Material Configuration Class
 */
export class MaterialConfig {
  constructor(type, preset) {
    this.type = type; // 'flooring', 'walls', 'shelving'
    this.preset = preset;
    this.color = preset.color;
    this.metalness = preset.metalness || 0;
    this.roughness = preset.roughness || 1;
    this.emissive = preset.emissive || 0x000000;
  }

  toThreeJSMaterial() {
    return {
      color: this.color,
      metalness: this.metalness,
      roughness: this.roughness,
      emissive: this.emissive,
      side: 2 // THREE.DoubleSide
    };
  }

  clone() {
    const config = new MaterialConfig(this.type, this.preset);
    config.color = this.color;
    config.metalness = this.metalness;
    config.roughness = this.roughness;
    config.emissive = this.emissive;
    return config;
  }

  adjustBrightness(factor) {
    const config = this.clone();
    // Adjust emissive for brightness control
    config.metalness = Math.max(0, Math.min(1, this.metalness + factor));
    return config;
  }

  adjustReflection(factor) {
    const config = this.clone();
    config.roughness = Math.max(0, Math.min(1, this.roughness - factor));
    return config;
  }
}

/**
 * Lighting Configuration Class
 */
export class LightingConfig {
  constructor(profile) {
    Object.assign(this, profile);
  }

  toThreeJSLights() {
    return {
      ambient: {
        color: this.ambientColor,
        intensity: this.ambientIntensity
      },
      directional: {
        color: this.directionalColor,
        intensity: this.directionalIntensity,
        position: this.directionalPosition
      },
      point: {
        color: this.pointColor,
        intensity: this.pointIntensity,
        position: this.pointPosition
      }
    };
  }

  adjustIntensity(factor) {
    const config = new LightingConfig(this);
    config.ambientIntensity = Math.max(0, Math.min(2, this.ambientIntensity + factor));
    config.directionalIntensity = Math.max(0, Math.min(2, this.directionalIntensity + factor));
    config.pointIntensity = Math.max(0, Math.min(2, this.pointIntensity + factor));
    return config;
  }

  clone() {
    return new LightingConfig(this);
  }
}

/**
 * Get material preset by category and name
 */
export function getMaterialPreset(category, name) {
  if (MATERIAL_PRESETS[category] && MATERIAL_PRESETS[category][name]) {
    return new MaterialConfig(category, MATERIAL_PRESETS[category][name]);
  }
  return null;
}

/**
 * Get all materials in a category
 */
export function getMaterialsByCategory(category) {
  const materials = MATERIAL_PRESETS[category] || {};
  return Object.entries(materials).map(([key, value]) => ({
    key,
    ...value
  }));
}

/**
 * Get lighting profile
 */
export function getLightingProfile(profileName) {
  if (LIGHTING_PROFILES[profileName]) {
    return new LightingConfig(LIGHTING_PROFILES[profileName]);
  }
  return null;
}

/**
 * Get scene profile and return configured materials + lighting
 */
export function getSceneProfile(profileName) {
  const profile = SCENE_PROFILES[profileName];
  if (!profile) return null;

  return {
    name: profile.name,
    description: profile.description,
    materials: {
      floor: getMaterialPreset('flooring', profile.floorMaterial),
      walls: getMaterialPreset('walls', profile.wallMaterial),
      shelves: getMaterialPreset('shelving', profile.shelfMaterial)
    },
    lighting: getLightingProfile(profile.lightingProfile)
  };
}

/**
 * Export all profiles as JSON
 */
export function exportProfilesAsJSON() {
  return {
    materials: MATERIAL_PRESETS,
    lighting: Object.entries(LIGHTING_PROFILES).map(([key, profile]) => ({
      key,
      ...profile
    })),
    scenes: Object.entries(SCENE_PROFILES).map(([key, profile]) => ({
      key,
      ...profile
    }))
  };
}
