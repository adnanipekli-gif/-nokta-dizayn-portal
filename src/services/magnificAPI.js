/**
 * Magnific AI API Integration
 * Converts renders to photo-realistic 4K quality
 */

export class MagnificAPI {
  constructor(apiKey = null) {
    this.apiKey = apiKey || process.env.REACT_APP_MAGNIFIC_API_KEY;
    this.baseURL = 'https://api.magnific.ai/v1';
    this.maxRetries = 3;
    this.retryDelay = 2000; // ms
  }

  /**
   * Upscale a render image
   * @param {File|Blob|string} input - Image file, blob, or base64 URL
   * @param {Object} options - Enhancement options
   * @returns {Promise<{url: string, status: string}>}
   */
  async upscaleImage(input, options = {}) {
    const {
      mode = 'upscayl', // upscayl | reimagine
      prompt = 'professional photorealistic product display',
      quality = 'ultra', // standard | premium | ultra
      scale = 2, // 2x, 4x
    } = options;

    try {
      const formData = new FormData();

      // Handle different input types
      if (typeof input === 'string') {
        // Base64 or URL
        if (input.startsWith('http')) {
          formData.append('image_url', input);
        } else {
          const blob = this.base64ToBlob(input);
          formData.append('image', blob, 'render.png');
        }
      } else if (input instanceof Blob) {
        formData.append('image', input, 'render.png');
      } else if (input instanceof File) {
        formData.append('image', input);
      }

      formData.append('mode', mode);
      formData.append('prompt', prompt);
      formData.append('quality', quality);
      formData.append('scale', scale);

      const response = await fetch(`${this.baseURL}/upscale`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Magnific API Error: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        jobId: result.id,
        status: 'processing',
        estimatedTime: result.eta || 30,
      };
    } catch (error) {
      console.error('Magnific Upscale Error:', error);
      throw error;
    }
  }

  /**
   * Check upscaling job status
   * @param {string} jobId - Job ID from upscaleImage
   * @returns {Promise<{status: string, url?: string, progress?: number}>}
   */
  async checkStatus(jobId) {
    try {
      const response = await fetch(`${this.baseURL}/jobs/${jobId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Status Check Error: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        status: result.status,
        url: result.output_image_url || null,
        progress: result.progress || 0,
        errorMessage: result.error || null,
      };
    } catch (error) {
      console.error('Status Check Error:', error);
      throw error;
    }
  }

  /**
   * Reimagine image with different style
   * @param {File|Blob|string} input - Image file, blob, or URL
   * @param {string} stylePrompt - What to change (e.g., "modern minimalist", "industrial")
   * @returns {Promise<{jobId: string}>}
   */
  async reimagineImage(input, stylePrompt) {
    try {
      const formData = new FormData();

      if (typeof input === 'string') {
        if (input.startsWith('http')) {
          formData.append('image_url', input);
        } else {
          const blob = this.base64ToBlob(input);
          formData.append('image', blob, 'render.png');
        }
      } else if (input instanceof Blob || input instanceof File) {
        formData.append('image', input);
      }

      formData.append('mode', 'reimagine');
      formData.append('prompt', stylePrompt);

      const response = await fetch(`${this.baseURL}/upscale`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Reimagine Error: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        jobId: result.id,
        status: 'processing',
      };
    } catch (error) {
      console.error('Reimagine Error:', error);
      throw error;
    }
  }

  /**
   * Wait for job completion with polling
   * @param {string} jobId - Job ID
   * @param {number} maxWait - Maximum time to wait (ms)
   * @returns {Promise<string>} - Final image URL
   */
  async waitForCompletion(jobId, maxWait = 300000) {
    const startTime = Date.now();
    const pollInterval = 5000; // Poll every 5 seconds

    while (Date.now() - startTime < maxWait) {
      const status = await this.checkStatus(jobId);

      if (status.status === 'completed' && status.url) {
        return status.url;
      }

      if (status.status === 'failed') {
        throw new Error(`Job failed: ${status.errorMessage}`);
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error('Job timeout exceeded');
  }

  /**
   * Convert base64 to Blob
   * @param {string} base64 - Base64 encoded image
   * @returns {Blob}
   */
  base64ToBlob(base64) {
    const byteCharacters = atob(base64.split(',')[1] || base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    return new Blob([new Uint8Array(byteNumbers)], { type: 'image/png' });
  }

  /**
   * Batch upscale multiple renders
   * @param {Array<Blob|File>} images - Array of images
   * @param {Object} options - Upscale options
   * @returns {Promise<Array>} - Array of job IDs
   */
  async batchUpscale(images, options = {}) {
    return Promise.all(images.map((img) => this.upscaleImage(img, options)));
  }
}

export default MagnificAPI;
