/**
 * Input Validation & Sanitization
 * Security utilities for input validation and data protection
 */

/**
 * Validate email address
 */
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Validate URL
 */
export function validateURL(url) {
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize string - remove potentially dangerous characters
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  
  // Remove HTML tags
  let sanitized = str.replace(/<[^>]*>/g, '');
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Encode special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  return sanitized;
}

/**
 * Validate file type
 */
export function validateFileType(file, allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']) {
  if (!file || !file.type) return false;
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size (max 10MB default)
 */
export function validateFileSize(file, maxSize = 10 * 1024 * 1024) {
  if (!file || !file.size) return false;
  return file.size <= maxSize;
}

/**
 * Validate project data
 */
export function validateProjectData(data) {
  const errors = {};
  
  // Project name
  if (!data.projectName || typeof data.projectName !== 'string') {
    errors.projectName = 'Project name is required';
  } else if (data.projectName.length < 3 || data.projectName.length > 100) {
    errors.projectName = 'Project name must be 3-100 characters';
  }
  
  // Location
  if (!data.location || typeof data.location !== 'string') {
    errors.location = 'Location is required';
  } else if (data.location.length < 2 || data.location.length > 50) {
    errors.location = 'Location must be 2-50 characters';
  }
  
  // Area
  if (!data.area || isNaN(data.area)) {
    errors.area = 'Area must be a number';
  } else if (data.area < 10 || data.area > 10000) {
    errors.area = 'Area must be between 10-10000 m²';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate email data
 */
export function validateEmailData(data) {
  const errors = {};
  
  // Recipient email
  if (!data.to || !validateEmail(data.to)) {
    errors.to = 'Valid email address required';
  }
  
  // Subject
  if (!data.subject || data.subject.length < 5) {
    errors.subject = 'Subject must be at least 5 characters';
  }
  
  // Client name
  if (data.clientName && data.clientName.length > 50) {
    errors.clientName = 'Client name must be less than 50 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Validate JSON
 */
export function validateJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }

  reset(key) {
    this.attempts.delete(key);
  }

  resetAll() {
    this.attempts.clear();
  }
}

/**
 * CSRF token management
 */
export class CSRFProtection {
  constructor() {
    this.token = this.generateToken();
  }

  generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  getToken() {
    return this.token;
  }

  validateToken(token) {
    return token === this.token;
  }

  refreshToken() {
    this.token = this.generateToken();
    return this.token;
  }
}

/**
 * Password strength validator
 */
export function validatePasswordStrength(password) {
  if (!password || password.length < 8) {
    return { strength: 'weak', message: 'Password must be at least 8 characters' };
  }

  let strength = 0;
  const feedback = [];

  if (/[a-z]/.test(password)) strength++;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) strength++;
  else feedback.push('Add uppercase letters');

  if (/\d/.test(password)) strength++;
  else feedback.push('Add numbers');

  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  else feedback.push('Add special characters');

  const strengthLevels = ['weak', 'fair', 'good', 'strong', 'very-strong'];
  
  return {
    strength: strengthLevels[strength],
    score: strength,
    feedback
  };
}

/**
 * Content Security Policy validator
 */
export function validateCSPCompliance(html) {
  const issues = [];

  // Check for inline scripts
  if (/<script[^>]*>.*?<\/script>/gi.test(html)) {
    issues.push('Inline scripts detected - use external scripts instead');
  }

  // Check for inline styles
  if (/style\s*=\s*['"]/gi.test(html)) {
    issues.push('Inline styles detected - use external stylesheets instead');
  }

  // Check for event handlers
  if (/on\w+\s*=\s*['"]/gi.test(html)) {
    issues.push('Event handlers detected - use addEventListener instead');
  }

  // Check for data URLs
  if (/data:[^,]*,/gi.test(html)) {
    issues.push('Data URLs detected - use proper resource URLs instead');
  }

  return {
    isCompliant: issues.length === 0,
    issues
  };
}

/**
 * Secure localStorage wrapper
 */
export class SecureStorage {
  constructor(prefix = 'app_') {
    this.prefix = prefix;
  }

  setItem(key, value) {
    try {
      const data = JSON.stringify({
        value,
        timestamp: Date.now(),
        hash: this.generateHash(value)
      });
      localStorage.setItem(this.prefix + key, data);
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  }

  getItem(key) {
    try {
      const data = JSON.parse(localStorage.getItem(this.prefix + key));
      if (!data) return null;
      
      // Verify hash
      if (data.hash !== this.generateHash(data.value)) {
        console.warn('Storage integrity check failed');
        return null;
      }
      
      return data.value;
    } catch (error) {
      console.error('Storage retrieval error:', error);
      return null;
    }
  }

  removeItem(key) {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.error('Storage removal error:', error);
      return false;
    }
  }

  generateHash(value) {
    // Simple hash for integrity check (not cryptographic)
    const str = JSON.stringify(value);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  clear() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

/**
 * Security audit logger
 */
export class SecurityLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
  }

  log(level, message, data = {}) {
    const entry = {
      timestamp: new Date(),
      level,
      message,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    console.log(`[${level.toUpperCase()}] ${message}`, data);
  }

  warning(message, data) {
    this.log('warning', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  info(message, data) {
    this.log('info', message, data);
  }

  getLogs() {
    return this.logs;
  }

  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  clear() {
    this.logs = [];
  }
}

// Create singleton instances
export const secureStorage = new SecureStorage('nokta_');
export const csrfProtection = new CSRFProtection();
export const securityLogger = new SecurityLogger();
export const emailRateLimiter = new RateLimiter(5, 60000); // 5 emails per minute
export const exportRateLimiter = new RateLimiter(10, 60000); // 10 exports per minute
