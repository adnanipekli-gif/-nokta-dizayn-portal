import React, { useState, useCallback } from 'react';
import MagnificAPI from '../services/magnificAPI';

const MagnificUpscaler = ({ renderImageUrl, onUpscaleComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [upscaledUrl, setUpscaledUrl] = useState(null);
  const [error, setError] = useState(null);
  const [jobId, setJobId] = useState(null);

  const magnific = new MagnificAPI();

  const handleUpscale = useCallback(async () => {
    if (!renderImageUrl) {
      setError('No render image provided');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Start upscaling job
      const result = await magnific.upscaleImage(renderImageUrl, {
        mode: 'upscayl',
        prompt: 'professional photorealistic store display cabinet shelving products',
        quality: 'ultra',
        scale: 4,
      });

      setJobId(result.jobId);
      setProgress(10);

      // Poll for completion
      const finalUrl = await magnific.waitForCompletion(result.jobId);
      
      setUpscaledUrl(finalUrl);
      setProgress(100);

      if (onUpscaleComplete) {
        onUpscaleComplete({
          original: renderImageUrl,
          upscaled: finalUrl,
          jobId: result.jobId,
        });
      }
    } catch (err) {
      console.error('Upscale failed:', err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [renderImageUrl, onUpscaleComplete]);

  const handleReimage = useCallback(async () => {
    if (!renderImageUrl) {
      setError('No render image provided');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const result = await magnific.reimagineImage(
        renderImageUrl,
        'photorealistic modern market display with professional lighting and shadows'
      );

      setJobId(result.jobId);
      setProgress(10);

      const finalUrl = await magnific.waitForCompletion(result.jobId);
      
      setUpscaledUrl(finalUrl);
      setProgress(100);

      if (onUpscaleComplete) {
        onUpscaleComplete({
          original: renderImageUrl,
          reimagined: finalUrl,
          jobId: result.jobId,
        });
      }
    } catch (err) {
      console.error('Reimagine failed:', err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [renderImageUrl, onUpscaleComplete]);

  const handleDownload = () => {
    if (!upscaledUrl) return;

    const a = document.createElement('a');
    a.href = upscaledUrl;
    a.download = `render-upscaled-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
      }}
    >
      <h3 style={{ margin: '0 0 15px 0' }}>🚀 Magnific AI Upscaler</h3>

      {renderImageUrl && (
        <div style={{ marginBottom: '15px' }}>
          <div
            style={{
              fontSize: '12px',
              color: '#666',
              marginBottom: '10px',
            }}
          >
            Render loaded ✓
          </div>
          <img
            src={renderImageUrl}
            alt="Original render"
            style={{
              maxWidth: '100%',
              maxHeight: '200px',
              borderRadius: '4px',
              marginBottom: '10px',
            }}
          />
        </div>
      )}

      {upscaledUrl && (
        <div style={{ marginBottom: '15px' }}>
          <div
            style={{
              fontSize: '12px',
              color: '#27ae60',
              marginBottom: '10px',
              fontWeight: 'bold',
            }}
          >
            ✨ Upscaled 4K Output
          </div>
          <img
            src={upscaledUrl}
            alt="Upscaled render"
            style={{
              maxWidth: '100%',
              maxHeight: '300px',
              borderRadius: '4px',
              marginBottom: '10px',
              border: '2px solid #27ae60',
            }}
          />
        </div>
      )}

      {isProcessing && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>
            Processing... {progress}%
          </div>
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#3498db',
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '10px',
            backgroundColor: '#fadbd8',
            color: '#c0392b',
            borderRadius: '4px',
            marginBottom: '15px',
            fontSize: '13px',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
        }}
      >
        <button
          onClick={handleUpscale}
          disabled={isProcessing || !renderImageUrl}
          style={{
            padding: '10px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.6 : 1,
            fontSize: '13px',
            fontWeight: 'bold',
          }}
        >
          {isProcessing ? '⏳ Upscaling...' : '⬆️ Upscale 4K'}
        </button>

        <button
          onClick={handleReimage}
          disabled={isProcessing || !renderImageUrl}
          style={{
            padding: '10px',
            backgroundColor: '#9b59b6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.6 : 1,
            fontSize: '13px',
            fontWeight: 'bold',
          }}
        >
          {isProcessing ? '⏳ Reimagining...' : '🎨 Reimagine'}
        </button>

        {upscaledUrl && (
          <button
            onClick={handleDownload}
            style={{
              padding: '10px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              gridColumn: '1 / -1',
            }}
          >
            📥 Download 4K
          </button>
        )}
      </div>

      {jobId && (
        <div
          style={{
            marginTop: '10px',
            fontSize: '11px',
            color: '#999',
            fontFamily: 'monospace',
          }}
        >
          Job ID: {jobId}
        </div>
      )}
    </div>
  );
};

export default MagnificUpscaler;
