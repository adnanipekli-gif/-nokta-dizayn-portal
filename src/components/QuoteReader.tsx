import React, { useState } from 'react';
import { useTheme } from './ThemeProvider';
import Store3DViewer from './Store3DViewer';

const QuoteReader = () => {
  const theme = useTheme();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const base64 = event.target?.result;
      setUploadedFile(file.name);

      try {
        const response = await fetch('/api/read-quote-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfBase64: base64 }),
        });

        const result = await response.json();
        setQuoteData(result);
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: theme.bg,
      color: theme.text,
      minHeight: '100vh'
    }}>
      <h1>📄 Quote Reader</h1>
      
      <input 
        type="file" 
        accept=".pdf" 
        onChange={handleFileUpload}
        disabled={loading}
      />
      
      {loading && <p>Processing...</p>}
      {uploadedFile && <p>✅ Uploaded: {uploadedFile}</p>}

      <Store3DViewer brand="ecocold" height="400px" />

      {quoteData && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          border: `1px solid ${theme.border}`,
          borderRadius: '8px'
        }}>
          <h3>Quote Data</h3>
          <pre>{JSON.stringify(quoteData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default QuoteReader;
