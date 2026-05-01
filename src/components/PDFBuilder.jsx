import React, { useState, useRef } from 'react';
import { generateProjectPDF, downloadPDF, exportPDFBlob } from '../services/pdfBuilderAPI';
import '../styles/pdfBuilder.css';

export default function PDFBuilder({ render3DImage, selectedBrand = 'ecocold' }) {
  const [formData, setFormData] = useState({
    projectName: 'SNOWY MARKET',
    location: 'Kağıthane, İstanbul',
    area: 200,
    products: []
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [downloadLink, setDownloadLink] = useState(null);
  const previewCanvasRef = useRef(null);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'area' ? parseInt(value) || 0 : value
    }));
  };

  // Handle product input
  const handleAddProduct = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      setFormData(prev => ({
        ...prev,
        products: [...prev.products, e.target.value.trim()]
      }));
      e.target.value = '';
    }
  };

  // Remove product
  const handleRemoveProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  // Generate PDF
  const handleGeneratePDF = async () => {
    if (!render3DImage && !previewCanvasRef.current) {
      alert('Lütfen önce 3D görüntü oluşturun');
      return;
    }

    setIsGenerating(true);
    try {
      // Use provided render or capture from canvas
      let imageData = render3DImage;
      if (!imageData && previewCanvasRef.current) {
        imageData = previewCanvasRef.current.toDataURL('image/png');
      }

      // Generate PDF
      const pdf = await generateProjectPDF({
        renderImage: imageData,
        projectName: formData.projectName,
        location: formData.location,
        area: formData.area,
        products: formData.products,
        brand: selectedBrand
      });

      // Create download link
      const blob = exportPDFBlob(pdf);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setDownloadLink(url);

      // Auto-download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.projectName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('PDF generation error:', error);
      alert('PDF oluşturma hatası: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Template presets
  const presets = {
    snowy: {
      projectName: 'SNOWY MARKET',
      location: 'Kağıthane, İstanbul',
      area: 200,
      products: ['Ecocold MERGA 2750 Buzdolabı', 'Pasifik Raf Sistemi']
    },
    taze: {
      projectName: 'TAZE PAZAR SUPERMARKETİ',
      location: 'Sultanbeyli, İstanbul',
      area: 150,
      products: ['Ecocold NAVİ Bombe Cam', 'Ecocold APPLE 212 Plug-in']
    },
    izmir: {
      projectName: 'İZMİR MODERN MARKETİ',
      location: 'Alsancak, İzmir',
      area: 250,
      products: ['Ecocold MERGA 2750', 'Pasifik Gondola Raf', 'Nokta Dizayn Tezgah']
    }
  };

  const loadPreset = (presetName) => {
    setFormData(presets[presetName] || presets.snowy);
  };

  return (
    <div className="pdf-builder">
      <div className="pdf-builder-header">
        <h2>📄 PDF Şablonu Oluştur</h2>
        <p>3D render + Proje detayları → Profesyonel PDF</p>
      </div>

      <div className="pdf-builder-content">
        {/* Left: Form */}
        <div className="pdf-form-section">
          <h3>Proje Bilgileri</h3>

          {/* Presets */}
          <div className="preset-buttons">
            <button onClick={() => loadPreset('snowy')} className="preset-btn">
              SNOWY
            </button>
            <button onClick={() => loadPreset('taze')} className="preset-btn">
              TAZE PAZAR
            </button>
            <button onClick={() => loadPreset('izmir')} className="preset-btn">
              İZMİR
            </button>
          </div>

          {/* Form fields */}
          <div className="form-group">
            <label>Proje Adı *</label>
            <input
              type="text"
              name="projectName"
              value={formData.projectName}
              onChange={handleInputChange}
              placeholder="Proje adını girin"
            />
          </div>

          <div className="form-group">
            <label>Lokasyon *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Şehir, İlçe"
            />
          </div>

          <div className="form-group">
            <label>Alan (m²) *</label>
            <input
              type="number"
              name="area"
              value={formData.area}
              onChange={handleInputChange}
              placeholder="200"
              min="0"
            />
          </div>

          {/* Products */}
          <div className="form-group">
            <label>Ürünler (Enter ile ekle)</label>
            <input
              type="text"
              placeholder="Ürün adını girin ve Enter'a basın"
              onKeyDown={handleAddProduct}
              className="product-input"
            />
            <div className="products-list">
              {formData.products.map((product, index) => (
                <div key={index} className="product-tag">
                  <span>{product}</span>
                  <button
                    onClick={() => handleRemoveProduct(index)}
                    className="remove-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="generate-pdf-btn"
          >
            {isGenerating ? '⏳ Oluşturuluyor...' : '📥 PDF İndir'}
          </button>

          {/* Download link */}
          {downloadLink && (
            <div className="download-success">
              ✓ PDF oluşturuldu ve indirildi!
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div className="pdf-preview-section">
          <h3>Ön İzleme</h3>

          {/* Template preview */}
          <div className="pdf-template-preview">
            <div className="pdf-page page-1">
              {/* Header */}
              <div className="pdf-header">
                <div className="pdf-logo">
                  <span className="logo-text">ND</span>
                  <span className="logo-sub">GROUP</span>
                </div>
                <div className="pdf-tagline">
                  Perakende Tasarım ve Soğutma Çözümleri
                </div>
              </div>

              {/* Title */}
              <div className="pdf-title">{formData.projectName}</div>

              {/* Details */}
              <div className="pdf-details">
                <p><strong>Lokasyon:</strong> {formData.location}</p>
                <p><strong>Alan:</strong> {formData.area} m²</p>
              </div>

              {/* Render placeholder */}
              <div className="pdf-render-placeholder">
                <canvas
                  ref={previewCanvasRef}
                  width={300}
                  height={200}
                  style={{ display: 'none' }}
                />
                {render3DImage ? (
                  <img src={render3DImage} alt="3D Render" />
                ) : (
                  <div className="placeholder-box">
                    <span>📦 3D Görüntü Yüklenecek</span>
                  </div>
                )}
              </div>

              <div className="pdf-footer">
                © {new Date().getFullYear()} ND GROUP Companies
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="pdf-info">
            <strong>Format:</strong> A4 Dikey, 2 Sayfa<br />
            <strong>Sayfa 1:</strong> 3D Render + Başlık<br />
            <strong>Sayfa 2:</strong> Teknik Detaylar
          </div>
        </div>
      </div>
    </div>
  );
}
