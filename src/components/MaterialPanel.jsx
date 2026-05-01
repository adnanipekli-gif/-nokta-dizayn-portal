import React, { useState } from 'react';
import { 
  MATERIAL_PRESETS, 
  LIGHTING_PROFILES, 
  SCENE_PROFILES,
  getMaterialsByCategory,
  getLightingProfile
} from '../services/materialSystem';
import '../styles/materialPanel.css';

export default function MaterialPanel({ onMaterialChange, onLightingChange, theme }) {
  const [activeTab, setActiveTab] = useState('materials');
  const [expandedCategory, setExpandedCategory] = useState('flooring');
  const [selectedMaterial, setSelectedMaterial] = useState({
    flooring: 'tile',
    walls: 'white',
    shelving: 'steel'
  });
  const [selectedLighting, setSelectedLighting] = useState('bright');
  const [lightingIntensity, setLightingIntensity] = useState(1.0);
  const [showScenePresets, setShowScenePresets] = useState(false);

  // Handle material selection
  const handleMaterialSelect = (category, material) => {
    const updated = {
      ...selectedMaterial,
      [category]: material
    };
    setSelectedMaterial(updated);
    
    if (onMaterialChange) {
      onMaterialChange({
        category,
        material,
        allMaterials: updated
      });
    }
  };

  // Handle lighting profile selection
  const handleLightingSelect = (profileName) => {
    setSelectedLighting(profileName);
    
    if (onLightingChange) {
      const profile = getLightingProfile(profileName);
      onLightingChange({
        profile: profileName,
        config: profile,
        intensity: lightingIntensity
      });
    }
  };

  // Handle lighting intensity
  const handleIntensityChange = (e) => {
    const intensity = parseFloat(e.target.value);
    setLightingIntensity(intensity);
    
    if (onLightingChange) {
      const profile = getLightingProfile(selectedLighting);
      onLightingChange({
        profile: selectedLighting,
        config: profile,
        intensity
      });
    }
  };

  // Apply scene preset
  const handleScenePreset = (sceneName) => {
    const scene = SCENE_PROFILES[sceneName];
    if (!scene) return;

    // Set materials
    handleMaterialSelect('flooring', scene.floorMaterial);
    handleMaterialSelect('walls', scene.wallMaterial);
    handleMaterialSelect('shelving', scene.shelfMaterial);

    // Set lighting
    handleLightingSelect(scene.lightingProfile);
    setShowScenePresets(false);
  };

  // Get material preview color
  const getMaterialColor = (category, material) => {
    const presets = MATERIAL_PRESETS[category];
    if (presets && presets[material]) {
      const color = presets[material].color;
      return `#${color.toString(16).padStart(6, '0')}`;
    }
    return '#cccccc';
  };

  return (
    <div className="material-panel" style={{ 
      backgroundColor: theme?.bg || '#ffffff',
      color: theme?.text || '#000000'
    }}>
      {/* Header */}
      <div className="material-panel-header">
        <h3>🎨 Scene Setup</h3>
        <button 
          className="scene-preset-btn"
          onClick={() => setShowScenePresets(!showScenePresets)}
          title="Quick scene templates"
        >
          ⚡ Presets
        </button>
      </div>

      {/* Scene Presets Dropdown */}
      {showScenePresets && (
        <div className="scene-presets-dropdown">
          {Object.entries(SCENE_PROFILES).map(([key, scene]) => (
            <button
              key={key}
              className="preset-item"
              onClick={() => handleScenePreset(key)}
            >
              <strong>{scene.name}</strong>
              <small>{scene.description}</small>
            </button>
          ))}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="material-tabs">
        <button
          className={`tab ${activeTab === 'materials' ? 'active' : ''}`}
          onClick={() => setActiveTab('materials')}
        >
          Materials
        </button>
        <button
          className={`tab ${activeTab === 'lighting' ? 'active' : ''}`}
          onClick={() => setActiveTab('lighting')}
        >
          Lighting
        </button>
      </div>

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <div className="material-content">
          {/* Flooring */}
          <div className="material-category">
            <button
              className="category-header"
              onClick={() => setExpandedCategory(
                expandedCategory === 'flooring' ? null : 'flooring'
              )}
            >
              <span>🏢 Flooring</span>
              <span className={`arrow ${expandedCategory === 'flooring' ? 'open' : ''}`}>
                ▶
              </span>
            </button>

            {expandedCategory === 'flooring' && (
              <div className="material-options">
                {Object.entries(MATERIAL_PRESETS.flooring).map(([key, material]) => (
                  <button
                    key={key}
                    className={`material-option ${selectedMaterial.flooring === key ? 'selected' : ''}`}
                    onClick={() => handleMaterialSelect('flooring', key)}
                    style={{ borderColor: getMaterialColor('flooring', key) }}
                  >
                    <div className="color-swatch" style={{ 
                      backgroundColor: getMaterialColor('flooring', key)
                    }} />
                    <div className="material-info">
                      <strong>{material.name}</strong>
                      <small>{material.description}</small>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Walls */}
          <div className="material-category">
            <button
              className="category-header"
              onClick={() => setExpandedCategory(
                expandedCategory === 'walls' ? null : 'walls'
              )}
            >
              <span>🧱 Walls</span>
              <span className={`arrow ${expandedCategory === 'walls' ? 'open' : ''}`}>
                ▶
              </span>
            </button>

            {expandedCategory === 'walls' && (
              <div className="material-options">
                {Object.entries(MATERIAL_PRESETS.walls).map(([key, material]) => (
                  <button
                    key={key}
                    className={`material-option ${selectedMaterial.walls === key ? 'selected' : ''}`}
                    onClick={() => handleMaterialSelect('walls', key)}
                    style={{ borderColor: getMaterialColor('walls', key) }}
                  >
                    <div className="color-swatch" style={{ 
                      backgroundColor: getMaterialColor('walls', key)
                    }} />
                    <div className="material-info">
                      <strong>{material.name}</strong>
                      <small>{material.description}</small>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Shelving */}
          <div className="material-category">
            <button
              className="category-header"
              onClick={() => setExpandedCategory(
                expandedCategory === 'shelving' ? null : 'shelving'
              )}
            >
              <span>📦 Shelving</span>
              <span className={`arrow ${expandedCategory === 'shelving' ? 'open' : ''}`}>
                ▶
              </span>
            </button>

            {expandedCategory === 'shelving' && (
              <div className="material-options">
                {Object.entries(MATERIAL_PRESETS.shelving).map(([key, material]) => (
                  <button
                    key={key}
                    className={`material-option ${selectedMaterial.shelving === key ? 'selected' : ''}`}
                    onClick={() => handleMaterialSelect('shelving', key)}
                    style={{ borderColor: getMaterialColor('shelving', key) }}
                  >
                    <div className="color-swatch" style={{ 
                      backgroundColor: getMaterialColor('shelving', key)
                    }} />
                    <div className="material-info">
                      <strong>{material.name}</strong>
                      <small>{material.description}</small>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lighting Tab */}
      {activeTab === 'lighting' && (
        <div className="material-content">
          {/* Lighting Profiles */}
          <div className="lighting-section">
            <h4>💡 Lighting Profile</h4>
            <div className="lighting-options">
              {Object.entries(LIGHTING_PROFILES).map(([key, profile]) => (
                <button
                  key={key}
                  className={`lighting-option ${selectedLighting === key ? 'selected' : ''}`}
                  onClick={() => handleLightingSelect(key)}
                >
                  <strong>{profile.name}</strong>
                  <small>{profile.description}</small>
                </button>
              ))}
            </div>
          </div>

          {/* Lighting Intensity */}
          <div className="lighting-section">
            <h4>🔆 Intensity</h4>
            <div className="intensity-control">
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={lightingIntensity}
                onChange={handleIntensityChange}
                className="intensity-slider"
              />
              <span className="intensity-value">{lightingIntensity.toFixed(1)}x</span>
            </div>
          </div>

          {/* Current Lighting Info */}
          <div className="lighting-info">
            <p>
              <strong>Active Profile:</strong> {LIGHTING_PROFILES[selectedLighting]?.name}
            </p>
            <p style={{ fontSize: '12px', color: '#666' }}>
              {LIGHTING_PROFILES[selectedLighting]?.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
