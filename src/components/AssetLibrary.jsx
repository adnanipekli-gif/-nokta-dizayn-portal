import React, { useState, useEffect } from 'react';
import { searchAssets, ASSET_TYPES, POPULAR_SEARCHES, getAttributionText } from '../services/freepikAPI';
import '../styles/assetLibrary.css';

export default function AssetLibrary({ onAssetSelect, onAssetDownload, theme }) {
  const [activeType, setActiveType] = useState('textures');
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Search assets
  const handleSearch = async (query = searchQuery, type = activeType) => {
    if (!query.trim()) {
      setAssets([]);
      return;
    }

    setLoading(true);
    try {
      const results = await searchAssets(query, type, 12);
      setAssets(results);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Search error:', error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle asset type change
  const handleTypeChange = (type) => {
    setActiveType(type);
    setAssets([]);
    setShowSuggestions(true);
    setSearchQuery('');
  };

  // Handle suggestion click
  const handleSuggestion = (query) => {
    setSearchQuery(query);
    handleSearch(query, activeType);
  };

  // Toggle favorite
  const toggleFavorite = (assetId) => {
    setFavorites(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  // Handle asset selection
  const handleAssetSelect = (asset) => {
    setSelectedAsset(asset);
    if (onAssetSelect) {
      onAssetSelect(asset);
    }
  };

  // Get type suggestions
  const getSuggestions = () => {
    return POPULAR_SEARCHES[activeType] || [];
  };

  const typeConfig = ASSET_TYPES[activeType];

  return (
    <div className="asset-library" style={{
      backgroundColor: theme?.bg || '#ffffff',
      color: theme?.text || '#000000'
    }}>
      {/* Header */}
      <div className="asset-library-header">
        <h3>📚 Asset Library</h3>
        <p>Browse and add assets to your scene</p>
      </div>

      {/* Type Navigation */}
      <div className="asset-types-nav">
        {Object.entries(ASSET_TYPES).map(([key, type]) => (
          <button
            key={key}
            className={`type-btn ${activeType === key ? 'active' : ''}`}
            onClick={() => handleTypeChange(key)}
            title={type.name}
          >
            <span className="icon">{type.icon}</span>
            <span className="label">{type.name}</span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="asset-search-bar">
        <input
          type="text"
          placeholder={`Search ${typeConfig?.name.toLowerCase()}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="search-input"
        />
        <button
          onClick={() => handleSearch()}
          disabled={loading}
          className="search-btn"
        >
          {loading ? '🔄' : '🔍'}
        </button>
      </div>

      {/* Content Area */}
      <div className="asset-content">
        {/* Suggestions */}
        {showSuggestions && assets.length === 0 && (
          <div className="asset-suggestions">
            <h4>💡 Popular searches</h4>
            <div className="suggestion-list">
              {getSuggestions().map(suggestion => (
                <button
                  key={suggestion}
                  className="suggestion-btn"
                  onClick={() => handleSuggestion(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="asset-loading">
            <div className="spinner"></div>
            <p>Searching assets...</p>
          </div>
        )}

        {/* Asset Grid */}
        {!loading && assets.length > 0 && (
          <div className="asset-grid">
            {assets.map(asset => (
              <div
                key={asset.id}
                className={`asset-card ${selectedAsset?.id === asset.id ? 'selected' : ''}`}
                onClick={() => handleAssetSelect(asset)}
              >
                {/* Thumbnail */}
                <div className="asset-thumbnail">
                  <img src={asset.thumbnail} alt={asset.title} />
                  
                  {/* Premium Badge */}
                  {asset.premium && (
                    <div className="premium-badge">⭐ Premium</div>
                  )}

                  {/* Favorite Button */}
                  <button
                    className={`favorite-btn ${favorites.includes(asset.id) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(asset.id);
                    }}
                  >
                    {favorites.includes(asset.id) ? '❤️' : '🤍'}
                  </button>
                </div>

                {/* Asset Info */}
                <div className="asset-info">
                  <h5>{asset.title}</h5>
                  <p className="asset-description">{asset.description}</p>
                  
                  {/* Meta */}
                  <div className="asset-meta">
                    <span className="license">{asset.license}</span>
                    <span className="rating">⭐ {asset.rating.toFixed(1)}</span>
                  </div>

                  {/* Download Counter */}
                  <small className="downloads">
                    📥 {(asset.downloads / 1000).toFixed(1)}K
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && assets.length === 0 && !showSuggestions && (
          <div className="asset-empty">
            <p>🔍 No assets found</p>
            <small>Try a different search term</small>
          </div>
        )}
      </div>

      {/* Selected Asset Details */}
      {selectedAsset && (
        <div className="asset-details-panel">
          <h4>Asset Details</h4>
          <div className="detail-row">
            <label>Title:</label>
            <span>{selectedAsset.title}</span>
          </div>
          <div className="detail-row">
            <label>Type:</label>
            <span>{selectedAsset.category}</span>
          </div>
          <div className="detail-row">
            <label>Author:</label>
            <span>{selectedAsset.author}</span>
          </div>
          <div className="detail-row">
            <label>License:</label>
            <span>{selectedAsset.license}</span>
          </div>
          <div className="detail-row full">
            <label>Attribution:</label>
            <small>{selectedAsset.attribution}</small>
          </div>

          {/* Download Button */}
          <button
            className="download-asset-btn"
            onClick={() => {
              if (onAssetDownload) {
                onAssetDownload(selectedAsset);
              }
            }}
          >
            📥 Add to Scene
          </button>
        </div>
      )}
    </div>
  );
}
