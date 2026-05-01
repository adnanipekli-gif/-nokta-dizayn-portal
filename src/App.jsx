import React, { useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './components/ThemeProvider';
import useThemeStore from './stores/themeStore';
import QuoteReader from './components/QuoteReader';
import Store3DViewer from './components/Store3DViewer';
import MagnificUpscaler from './components/MagnificUpscaler';

const Header = () => {
  const { isDarkMode, toggleTheme } = useThemeStore();
  const theme = useTheme();

  return (
    <header
      style={{
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${theme.border}`,
        backgroundColor: isDarkMode ? '#0a0a0a' : '#ffffff',
      }}
    >
      <h1 style={{ margin: 0, color: theme.primary }}>
        🎨 Nokta Dizayn Portal v5
      </h1>
      <button
        onClick={toggleTheme}
        style={{
          padding: '8px 16px',
          backgroundColor: theme.primary,
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        {isDarkMode ? '☀️ Light' : '🌙 Dark'}
      </button>
    </header>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const viewerRef = useRef(null);
  const [renderSnapshot, setRenderSnapshot] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState('ecocold');

  const handleExportRender = async () => {
    try {
      // Get canvas from Three.js renderer
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        alert('Render not loaded yet. Please wait...');
        return;
      }

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        setRenderSnapshot(url);
      }, 'image/png', 1.0);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export render');
    }
  };

  return (
    <div style={{ padding: '40px', backgroundColor: theme.bg }}>
      <h2 style={{ color: theme.text, marginTop: 0 }}>
        Market Render & Upscale
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px',
          marginBottom: '30px',
        }}
      >
        {/* 3D Viewer Section */}
        <div>
          <h3 style={{ color: theme.text, fontSize: '16px', marginBottom: '10px' }}>
            📐 3D Render
          </h3>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: theme.text, fontSize: '13px', marginRight: '10px' }}>
              Brand:
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.bg,
                color: theme.text,
                cursor: 'pointer',
              }}
            >
              <option value="ecocold">🧊 Ecocold</option>
              <option value="pasifik">📦 Pasifik Raf</option>
            </select>
          </div>

          <Store3DViewer
            ref={viewerRef}
            brand={selectedBrand}
            width="100%"
            height="500px"
          />

          <button
            onClick={handleExportRender}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '15px',
              backgroundColor: theme.primary,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            📸 Export Render
          </button>
        </div>

        {/* Magnific Upscaler Section */}
        <div>
          <h3 style={{ color: theme.text, fontSize: '16px', marginBottom: '10px' }}>
            ✨ Magnific AI
          </h3>
          <MagnificUpscaler
            renderImageUrl={renderSnapshot}
            onUpscaleComplete={(result) => {
              console.log('Upscale completed:', result);
            }}
          />
        </div>
      </div>

      {/* Info Section */}
      <div
        style={{
          padding: '20px',
          backgroundColor: isDarkMode => theme.bg === '#0a0a0a' ? '#1a1a1a' : '#f9f9f9',
          borderRadius: '8px',
          border: `1px solid ${theme.border}`,
          marginTop: '30px',
        }}
      >
        <h4 style={{ color: theme.text, marginTop: 0 }}>
          📋 Workflow
        </h4>
        <ol style={{ color: theme.text, fontSize: '13px', lineHeight: '1.8' }}>
          <li>Select brand (Ecocold or Pasifik)</li>
          <li>View 3D render in viewport</li>
          <li>Click "Export Render" to capture canvas</li>
          <li>Click "Upscale 4K" to enhance with Magnific AI</li>
          <li>Download 4K output for presentations</li>
        </ol>
      </div>
    </div>
  );
};

function App() {
  const { isDarkMode } = useThemeStore();

  return (
    <Router>
      <ThemeProvider>
        <div
          style={{
            backgroundColor: isDarkMode ? '#0a0a0a' : '#ffffff',
            minHeight: '100vh',
            transition: 'background-color 0.3s',
          }}
        >
          <Header />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/quote-reader" element={<QuoteReader />} />
          </Routes>
        </div>
      </ThemeProvider>
    </Router>
  );
}

export default App;
