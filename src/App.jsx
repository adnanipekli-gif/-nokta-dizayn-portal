import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import useThemeStore from './stores/themeStore';
import QuoteReader from './components/QuoteReader';
import Store3DViewer from './components/Store3DViewer';

const Header = () => {
  const { isDarkMode, toggleTheme } = useThemeStore();

  return (
    <header style={{
      padding: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #333',
    }}>
      <h1>🎨 Nokta Dizayn Portal v5</h1>
      <button onClick={toggleTheme}>
        {isDarkMode ? '☀️ Light' : '🌙 Dark'}
      </button>
    </header>
  );
};

const Dashboard = () => {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2>Welcome to Nokta Dizayn Portal</h2>
      <Store3DViewer brand="pasifik" height="600px" />
    </div>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/quote-reader" element={<QuoteReader />} />
        </Routes>
      </ThemeProvider>
    </Router>
  );
}

export default App;
