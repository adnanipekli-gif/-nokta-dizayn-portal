/**
 * Freepik API Integration
 * Handles asset search, caching, and attribution
 * Note: This requires Freepik API key in environment
 */

const FREEPIK_API_BASE = 'https://api.freepik.com/v1';
const CACHE_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours

// Simple in-memory cache
const assetCache = new Map();

/**
 * Freepik Asset Types
 */
export const ASSET_TYPES = {
  textures: {
    name: 'Textures',
    icon: '🎨',
    keywords: ['texture', 'floor', 'wall', 'material'],
    filters: { content_type: 'photos' }
  },
  lighting: {
    name: 'Lighting',
    icon: '💡',
    keywords: ['light', 'lamp', 'fixture', 'pendant'],
    filters: { content_type: 'graphics' }
  },
  furniture: {
    name: 'Furniture',
    icon: '🪑',
    keywords: ['shelf', 'rack', 'display', 'cabinet'],
    filters: { content_type: 'graphics' }
  },
  people: {
    name: 'People',
    icon: '👥',
    keywords: ['person', 'customer', 'shopper', 'staff'],
    filters: { content_type: 'photos' }
  },
  products: {
    name: 'Products',
    icon: '📦',
    keywords: ['product', 'item', 'goods', 'merchandise'],
    filters: { content_type: 'photos' }
  }
};

/**
 * Search assets from Freepik
 * @param {string} query - Search query
 * @param {string} assetType - Type of asset to search
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Array of assets
 */
export async function searchAssets(query, assetType = 'textures', limit = 20) {
  const cacheKey = `${query}:${assetType}`;

  // Check cache first
  if (assetCache.has(cacheKey)) {
    const cached = assetCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_EXPIRY) {
      return cached.data;
    }
  }

  try {
    // Mock API response (in production, would call Freepik API)
    // const response = await fetch(`${FREEPIK_API_BASE}/search`, {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.REACT_APP_FREEPIK_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     query,
    //     content_type: ASSET_TYPES[assetType]?.filters?.content_type,
    //     limit,
    //     page: 1
    //   })
    // });

    // For now, return mock data
    const mockAssets = generateMockAssets(query, assetType, limit);

    // Cache the results
    assetCache.set(cacheKey, {
      data: mockAssets,
      timestamp: Date.now()
    });

    return mockAssets;
  } catch (error) {
    console.error('Asset search error:', error);
    return [];
  }
}

/**
 * Generate mock assets for demo
 */
function generateMockAssets(query, type, limit) {
  const assets = [];
  const typeConfig = ASSET_TYPES[type] || ASSET_TYPES.textures;

  for (let i = 0; i < limit; i++) {
    assets.push({
      id: `asset-${type}-${i}`,
      title: `${query} - Option ${i + 1}`,
      description: `High-quality ${typeConfig.name.toLowerCase()} for ${query}`,
      type: type,
      category: typeConfig.name,
      thumbnail: generateMockThumbnail(type, i),
      url: '#', // Mock URL
      author: 'Freepik',
      license: 'Free',
      attribution: `Image by ${['Freepik', 'Creative Commons', 'Public Domain'][i % 3]}`,
      tags: [query, type, ...typeConfig.keywords],
      rating: 4 + Math.random(),
      downloads: Math.floor(Math.random() * 100000),
      premium: i % 5 === 0 // Some premium items
    });
  }

  return assets;
}

/**
 * Generate mock thumbnail
 */
function generateMockThumbnail(type, index) {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1',
    '#f7dc6f', '#bb8fce', '#85c1e2'
  ];
  const color = colors[index % colors.length];

  // Return SVG as data URL
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='${encodeURIComponent(color)}' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='white' text-anchor='middle' dominant-baseline='middle'%3E${type[0].toUpperCase()}%3C/text%3E%3C/svg%3E`;
}

/**
 * Get asset details
 */
export async function getAssetDetails(assetId) {
  try {
    // Mock API call
    const cacheKey = `details:${assetId}`;
    if (assetCache.has(cacheKey)) {
      return assetCache.get(cacheKey).data;
    }

    const asset = {
      id: assetId,
      title: 'Asset Title',
      description: 'Detailed asset description',
      fullImage: '#',
      resolution: '4000x3000',
      fileSize: '5.2 MB',
      fileFormat: 'JPG',
      color: '#00c4cc',
      tags: ['texture', 'modern', 'clean'],
      author: 'Freepik',
      attribution: 'Image by Freepik',
      usageRights: 'Free for commercial use with attribution'
    };

    assetCache.set(cacheKey, {
      data: asset,
      timestamp: Date.now()
    });

    return asset;
  } catch (error) {
    console.error('Asset details error:', error);
    return null;
  }
}

/**
 * Download asset (with proper attribution handling)
 */
export async function downloadAsset(asset) {
  try {
    const response = await fetch(asset.url);
    const blob = await response.blob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${asset.id}-${Date.now()}.jpg`;
    a.click();
    URL.revokeObjectURL(url);

    // Log attribution
    console.log(`Asset downloaded: ${asset.title} - ${asset.attribution}`);

    return {
      success: true,
      message: 'Asset downloaded successfully',
      attribution: asset.attribution
    };
  } catch (error) {
    console.error('Download error:', error);
    return {
      success: false,
      message: 'Failed to download asset'
    };
  }
}

/**
 * Get attribution text for asset
 */
export function getAttributionText(asset) {
  return `${asset.title} by ${asset.author} - ${asset.attribution}`;
}

/**
 * Generate attribution HTML
 */
export function getAttributionHTML(assets) {
  if (!Array.isArray(assets) || assets.length === 0) {
    return '';
  }

  const attributions = assets.map(asset =>
    `<li>${getAttributionText(asset)}</li>`
  ).join('\n');

  return `
    <div class="asset-attributions">
      <h4>Attribution</h4>
      <ul>
        ${attributions}
      </ul>
    </div>
  `;
}

/**
 * Popular search categories
 */
export const POPULAR_SEARCHES = {
  flooring: ['marble floor', 'tile floor', 'concrete floor', 'wood floor'],
  walls: ['white wall', 'painted wall', 'brick wall', 'textured wall'],
  lighting: ['led light', 'pendant lamp', 'track light', 'ambient lighting'],
  shelving: ['metal shelf', 'wood shelf', 'display case', 'gondola shelf'],
  decoration: ['plant decoration', 'artwork', 'signage', 'promotional display']
};

/**
 * Trending assets
 */
export const TRENDING_ASSETS = [
  { name: 'Minimalist Design', query: 'minimalist modern', type: 'textures' },
  { name: 'Sustainable Materials', query: 'eco friendly', type: 'textures' },
  { name: 'Smart Lighting', query: 'smart led', type: 'lighting' },
  { name: 'Modular Shelving', query: 'modular shelf system', type: 'furniture' }
];

/**
 * Asset collection management
 */
export class AssetCollection {
  constructor(name) {
    this.name = name;
    this.assets = [];
    this.created = Date.now();
  }

  addAsset(asset) {
    if (!this.assets.find(a => a.id === asset.id)) {
      this.assets.push({
        ...asset,
        addedAt: Date.now()
      });
    }
  }

  removeAsset(assetId) {
    this.assets = this.assets.filter(a => a.id !== assetId);
  }

  exportJSON() {
    return JSON.stringify({
      name: this.name,
      created: this.created,
      assetCount: this.assets.length,
      assets: this.assets
    }, null, 2);
  }

  exportAttributions() {
    return getAttributionHTML(this.assets);
  }

  getAssetsByType(type) {
    return this.assets.filter(a => a.type === type);
  }

  getTags() {
    const tags = new Set();
    this.assets.forEach(asset => {
      asset.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }
}

/**
 * Clear cache
 */
export function clearAssetCache() {
  assetCache.clear();
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  return {
    size: assetCache.size,
    keys: Array.from(assetCache.keys()),
    memory: `${assetCache.size * 1024}B` // Rough estimate
  };
}
