/**
 * Batch Export Manager
 * Handle multiple PDF exports, create ZIP files, and manage downloads
 */

import { generateProjectPDF, exportPDFBlob } from './pdfBuilderAPI';

/**
 * Batch Export Task
 */
export class BatchExportTask {
  constructor(projects) {
    this.id = `batch-${Date.now()}`;
    this.projects = projects;
    this.createdAt = new Date();
    this.status = 'pending'; // pending, processing, completed, failed
    this.progress = 0;
    this.results = [];
    this.error = null;
  }

  getProgress() {
    return Math.round((this.results.length / this.projects.length) * 100);
  }

  addResult(projectId, success, data = null, error = null) {
    this.results.push({
      projectId,
      success,
      data,
      error,
      timestamp: new Date()
    });
    this.progress = this.getProgress();
  }

  getStats() {
    return {
      total: this.projects.length,
      completed: this.results.filter(r => r.success).length,
      failed: this.results.filter(r => !r.success).length,
      percentage: this.progress
    };
  }

  toJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      status: this.status,
      progress: this.progress,
      stats: this.getStats(),
      results: this.results
    };
  }
}

/**
 * Batch PDF Generator
 */
export class BatchPDFGenerator {
  constructor() {
    this.tasks = new Map();
    this.activeTask = null;
  }

  /**
   * Create batch export task
   */
  createTask(projects) {
    const task = new BatchExportTask(projects);
    this.tasks.set(task.id, task);
    return task;
  }

  /**
   * Get task by ID
   */
  getTask(taskId) {
    return this.tasks.get(taskId);
  }

  /**
   * Generate all PDFs in batch
   */
  async generateBatch(task, options = {}) {
    task.status = 'processing';
    const { onProgress = null, onError = null } = options;

    const pdfs = [];

    for (const project of task.projects) {
      try {
        // Notify progress
        if (onProgress) {
          onProgress({
            taskId: task.id,
            current: task.results.length + 1,
            total: task.projects.length,
            projectName: project.projectName
          });
        }

        // Generate PDF
        const pdf = await generateProjectPDF({
          renderImage: project.renderImage,
          projectName: project.projectName,
          location: project.location,
          area: project.area,
          products: project.products || [],
          brand: project.brand || 'ecocold'
        });

        const blob = exportPDFBlob(pdf);
        pdfs.push({
          id: project.id,
          name: project.projectName,
          blob: blob,
          size: blob.size,
          type: blob.type
        });

        task.addResult(project.id, true, blob);
      } catch (error) {
        console.error(`Failed to generate PDF for ${project.projectName}:`, error);
        task.addResult(project.id, false, null, error.message);

        if (onError) {
          onError({
            projectName: project.projectName,
            error: error.message
          });
        }
      }
    }

    task.status = 'completed';
    return pdfs;
  }

  /**
   * Clear completed tasks (older than 1 hour)
   */
  clearOldTasks(olderThanMinutes = 60) {
    const threshold = Date.now() - (olderThanMinutes * 60 * 1000);
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.createdAt.getTime() < threshold) {
        this.tasks.delete(taskId);
      }
    }
  }

  /**
   * Get all tasks
   */
  getAllTasks() {
    return Array.from(this.tasks.values());
  }
}

/**
 * ZIP File Creator (requires JSZip library)
 * Note: Install with: npm install jszip
 */
export async function createZipFromPDFs(pdfs, folderName = 'exports') {
  // Dynamic import for JSZip
  let JSZip;
  try {
    JSZip = (await import('jszip')).default;
  } catch (error) {
    console.warn('JSZip not available, returning individual files instead');
    return null;
  }

  const zip = new JSZip();
  const folder = zip.folder(folderName);

  for (const pdf of pdfs) {
    folder.file(`${pdf.name}.pdf`, pdf.blob);
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Download batch as ZIP
 */
export async function downloadBatchZip(pdfs, zipFileName = 'nokta-projects') {
  try {
    const zipBlob = await createZipFromPDFs(pdfs);
    
    if (!zipBlob) {
      // Fallback: download individual files
      console.warn('ZIP creation failed, downloading individual files');
      pdfs.forEach(pdf => downloadFile(pdf.blob, `${pdf.name}.pdf`));
      return;
    }

    downloadFile(zipBlob, `${zipFileName}-${Date.now()}.zip`);
  } catch (error) {
    console.error('ZIP download error:', error);
    throw error;
  }
}

/**
 * Download single file
 */
export function downloadFile(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Batch export statistics
 */
export class BatchExportStats {
  constructor() {
    this.exports = [];
  }

  addExport(data) {
    this.exports.push({
      ...data,
      timestamp: new Date()
    });
  }

  getTotalExports() {
    return this.exports.length;
  }

  getTotalPDFs() {
    return this.exports.reduce((sum, exp) => sum + (exp.projectCount || 0), 0);
  }

  getTotalSize() {
    return this.exports.reduce((sum, exp) => sum + (exp.totalSize || 0), 0);
  }

  getAveragePDFSize() {
    const total = this.getTotalPDFs();
    if (total === 0) return 0;
    return this.getTotalSize() / total;
  }

  getLastExports(count = 10) {
    return this.exports.slice(-count).reverse();
  }

  getStats() {
    return {
      totalExports: this.getTotalExports(),
      totalPDFs: this.getTotalPDFs(),
      totalSize: this.getTotalSize(),
      avgPDFSize: this.getAveragePDFSize(),
      lastExports: this.getLastExports(5)
    };
  }

  exportToJSON() {
    return JSON.stringify(this.getStats(), null, 2);
  }

  saveToLocalStorage(key = 'batchExportStats') {
    try {
      localStorage.setItem(key, JSON.stringify(this.exports));
    } catch (error) {
      console.error('Failed to save stats:', error);
    }
  }

  loadFromLocalStorage(key = 'batchExportStats') {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        this.exports = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }
}

// Create singleton instances
export const batchGenerator = new BatchPDFGenerator();
export const batchStats = new BatchExportStats();

// Load existing stats
batchStats.loadFromLocalStorage();
