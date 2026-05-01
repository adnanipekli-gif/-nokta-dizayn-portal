import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * PDF Builder Service
 * Generates PDF from 3D renders with project details
 */

// Brand colors
const colors = {
  primary: '#1B3D4F',    // ND GROUP Teal
  cyan: '#00C4CC',       // Accent
  magenta: '#D4006A',    // Highlight
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  darkGray: '#333333'
};

/**
 * Generate PDF from 3D render image
 * @param {Object} config - PDF configuration
 * @param {string} config.renderImage - Base64 or URL of 3D render PNG
 * @param {string} config.projectName - Project name (e.g., "SNOWY MARKET")
 * @param {string} config.location - Project location
 * @param {number} config.area - Area in m²
 * @param {Array} config.products - Product list (Ecocold, Pasifik, etc.)
 * @param {string} config.brand - Brand selector (ecocold/pasifik/nokta)
 * @returns {Promise<jsPDF>} PDF document
 */
export async function generateProjectPDF(config) {
  const {
    renderImage,
    projectName = 'NOKTA DİZAYN PROJESI',
    location = 'İstanbul, Türkiye',
    area = 0,
    products = [],
    brand = 'ecocold'
  } = config;

  // Create PDF (A4 portrait)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  // PAGE 1: Title + 3D Render
  addPage1(pdf, pageWidth, pageHeight, margin, {
    renderImage,
    projectName,
    location,
    area,
    brand
  });

  // PAGE 2: Project Details
  pdf.addPage();
  addPage2(pdf, pageWidth, pageHeight, margin, {
    projectName,
    location,
    area,
    products,
    brand
  });

  return pdf;
}

/**
 * PAGE 1: Header + 3D Render
 */
function addPage1(pdf, pageWidth, pageHeight, margin, config) {
  const { renderImage, projectName, location, area, brand } = config;

  // Header background
  pdf.setFillColor(27, 61, 79);  // Primary color
  pdf.rect(0, 0, pageWidth, 40, 'F');

  // Logo text
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont(undefined, 'bold');
  pdf.text('ND', margin, 20);

  // Brand accent
  pdf.setTextColor(0, 196, 204);  // Cyan
  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(10);
  pdf.text('GROUP', margin + 8, 21);

  // Company tagline
  pdf.setTextColor(200, 200, 200);
  pdf.setFontSize(8);
  pdf.text('Perakende Tasarım ve Soğutma Çözümleri', pageWidth - margin - 60, 20);

  // Project title
  pdf.setTextColor(27, 61, 79);
  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  pdf.text(projectName, margin, 55);

  // Project details
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(80, 80, 80);
  pdf.text(`Lokasyon: ${location}`, margin, 65);
  pdf.text(`Alan: ${area} m²`, margin, 72);

  // Add 3D render image
  if (renderImage) {
    try {
      // Image dimensions: 170mm width, ~120mm height (maintains aspect)
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = 120;
      pdf.addImage(renderImage, 'PNG', margin, 85, imgWidth, imgHeight);
    } catch (error) {
      console.error('Error adding image to PDF:', error);
      // Fallback: add placeholder
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, 85, pageWidth - margin * 2, 120, 'F');
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(11);
      pdf.text('3D Görüntü', pageWidth / 2, 145, { align: 'center' });
    }
  }

  // Footer
  pdf.setFontSize(9);
  pdf.setTextColor(150, 150, 150);
  const footerY = pageHeight - 10;
  pdf.text(`© ${new Date().getFullYear()} ND GROUP Companies`, margin, footerY);
  pdf.text(`Sayfa 1`, pageWidth - margin - 15, footerY);
}

/**
 * PAGE 2: Project Details + Product List
 */
function addPage2(pdf, pageWidth, pageHeight, margin, config) {
  const { projectName, location, area, products, brand } = config;

  // Header
  pdf.setTextColor(27, 61, 79);
  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  pdf.text('Proje Detayları', margin, 20);

  // Section 1: Project Info
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(0, 196, 204);
  pdf.text('Proje Bilgileri', margin, 35);

  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(80, 80, 80);
  pdf.setFontSize(9);
  const infoY = 45;
  const lineHeight = 7;

  const info = [
    { label: 'Proje Adı:', value: projectName },
    { label: 'Lokasyon:', value: location },
    { label: 'Toplam Alan:', value: `${area} m²` },
    { label: 'Tasarım Tarihi:', value: new Date().toLocaleDateString('tr-TR') },
    { label: 'Durum:', value: 'Ön Tasarım' }
  ];

  info.forEach((item, index) => {
    pdf.setFont(undefined, 'bold');
    pdf.text(item.label, margin, infoY + index * lineHeight);
    pdf.setFont(undefined, 'normal');
    pdf.text(item.value, margin + 40, infoY + index * lineHeight);
  });

  // Section 2: Products
  const productsY = infoY + info.length * lineHeight + 12;
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(0, 196, 204);
  pdf.text('Ürünler & Bileşenler', margin, productsY);

  // Product list
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(80, 80, 80);
  const productsListY = productsY + 10;

  if (products && products.length > 0) {
    products.forEach((product, index) => {
      const y = productsListY + index * lineHeight;
      pdf.text(`• ${product}`, margin + 5, y);
    });
  } else {
    // Default products based on brand
    const defaultProducts = {
      ecocold: [
        'Ecocold MERGA 2750 - Buzdolabı Vitrin',
        'Ecocold APPLE 212 - Plug-in Negatif',
        'Ecocold NAVİ - Bombe Cam Vitrini'
      ],
      pasifik: [
        'Pasifik Raf Sistemi - Gondola',
        'Pasifik Metal Başlığı - Isı Yalıtımlı',
        'Pasifik Cam Raflı Vitrini'
      ],
      nokta: [
        'Nokta Dizayn - Mağaza Düzeni',
        'Nokta Dizayn - Ürün Sunumu',
        'Nokta Dizayn - Müşteri Deneyimi'
      ]
    };

    const prodList = defaultProducts[brand] || defaultProducts.ecocold;
    prodList.forEach((product, index) => {
      const y = productsListY + index * lineHeight;
      pdf.text(`• ${product}`, margin + 5, y);
    });
  }

  // Section 3: Technical Details
  const techY = productsListY + 35;
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(0, 196, 204);
  pdf.text('Teknik Özellikler', margin, techY);

  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  const specs = [
    'Enerji Verimliliği: A+ Sınıfı',
    'Ses Seviyesi: < 55 dB',
    'Ortam Sıcaklığı: 16-32°C',
    'Nem Aralığı: 45-75%',
    'Kurulum: Profesyonel Teknisyen Tarafından'
  ];

  specs.forEach((spec, index) => {
    const y = techY + 10 + index * 6;
    pdf.text(`• ${spec}`, margin + 5, y);
  });

  // Footer
  pdf.setFontSize(9);
  pdf.setTextColor(150, 150, 150);
  const footerY = pageHeight - 10;
  pdf.text(`© ${new Date().getFullYear()} ND GROUP Companies`, margin, footerY);
  pdf.text(`Sayfa 2`, pageWidth - margin - 15, footerY);
}

/**
 * Download PDF to user's device
 * @param {jsPDF} pdf - PDF document
 * @param {string} filename - File name (without .pdf extension)
 */
export function downloadPDF(pdf, filename = 'nokta-dizayn-proje') {
  const timestamp = new Date().toISOString().slice(0, 10);
  pdf.save(`${filename}_${timestamp}.pdf`);
}

/**
 * Export PDF as Base64 (for email/API)
 * @param {jsPDF} pdf - PDF document
 * @returns {string} Base64 encoded PDF
 */
export function exportPDFBase64(pdf) {
  return pdf.output('dataurlstring');
}

/**
 * Export PDF as Blob (for file upload)
 * @param {jsPDF} pdf - PDF document
 * @returns {Blob} PDF blob
 */
export function exportPDFBlob(pdf) {
  return pdf.output('blob');
}

/**
 * Capture HTML element as image and generate PDF
 * @param {HTMLElement} element - DOM element to capture
 * @param {Object} config - PDF config
 * @returns {Promise<jsPDF>} PDF document
 */
export async function generatePDFFromHTML(element, config) {
  try {
    // Capture element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF'
    });

    // Convert canvas to image
    const imageData = canvas.toDataURL('image/png');

    // Generate PDF with captured image
    return await generateProjectPDF({
      ...config,
      renderImage: imageData
    });
  } catch (error) {
    console.error('Error generating PDF from HTML:', error);
    throw error;
  }
}
