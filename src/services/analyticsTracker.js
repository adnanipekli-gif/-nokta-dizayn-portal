/**
 * Analytics Tracker
 * Track user actions, portal usage, and generate insights
 */

/**
 * Analytics Event
 */
export class AnalyticsEvent {
  constructor(eventType, data = {}) {
    this.id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.eventType = eventType;
    this.data = data;
    this.timestamp = new Date();
    this.sessionId = this.getSessionId();
    this.userAgent = navigator.userAgent;
    this.url = window.location.pathname;
  }

  getSessionId() {
    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  toJSON() {
    return {
      id: this.id,
      eventType: this.eventType,
      data: this.data,
      timestamp: this.timestamp,
      sessionId: this.sessionId,
      url: this.url
    };
  }
}

/**
 * Analytics Tracker
 */
export class AnalyticsTracker {
  constructor() {
    this.events = [];
    this.maxEvents = 1000; // Prevent unlimited growth
    this.isEnabled = true;
    this.loadEvents();
  }

  /**
   * Track event
   */
  track(eventType, data = {}) {
    if (!this.isEnabled) return;

    const event = new AnalyticsEvent(eventType, data);
    this.events.push(event);

    // Prevent memory leak
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Auto-save to localStorage
    this.saveEvents();

    console.log(`📊 Event tracked: ${eventType}`, data);
  }

  /**
   * Track render creation
   */
  trackRenderCreated(brand) {
    this.track('render_created', { brand });
  }

  /**
   * Track PDF export
   */
  trackPDFExport(projectName, template) {
    this.track('pdf_export', { projectName, template });
  }

  /**
   * Track batch export
   */
  trackBatchExport(projectCount, totalSize) {
    this.track('batch_export', { projectCount, totalSize });
  }

  /**
   * Track material selection
   */
  trackMaterialChange(category, material) {
    this.track('material_change', { category, material });
  }

  /**
   * Track lighting change
   */
  trackLightingChange(profile, intensity) {
    this.track('lighting_change', { profile, intensity });
  }

  /**
   * Track asset search
   */
  trackAssetSearch(query, assetType) {
    this.track('asset_search', { query, assetType });
  }

  /**
   * Track asset download
   */
  trackAssetDownload(assetId, assetName) {
    this.track('asset_download', { assetId, assetName });
  }

  /**
   * Track email send
   */
  trackEmailSent(recipientCount) {
    this.track('email_sent', { recipientCount });
  }

  /**
   * Track user preference update
   */
  trackPreferenceUpdate(key, value) {
    this.track('preference_update', { key, value });
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType) {
    return this.events.filter(e => e.eventType === eventType);
  }

  /**
   * Get events in time range
   */
  getEventsByTimeRange(startDate, endDate) {
    return this.events.filter(e => {
      const eventTime = new Date(e.timestamp);
      return eventTime >= startDate && eventTime <= endDate;
    });
  }

  /**
   * Get today's events
   */
  getTodayEvents() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.getEventsByTimeRange(today, tomorrow);
  }

  /**
   * Get this week's events
   */
  getWeekEvents() {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return this.getEventsByTimeRange(weekAgo, today);
  }

  /**
   * Get statistics
   */
  getStats(timeRange = 'all') {
    let events = this.events;

    if (timeRange === 'today') {
      events = this.getTodayEvents();
    } else if (timeRange === 'week') {
      events = this.getWeekEvents();
    }

    const stats = {
      totalEvents: events.length,
      eventTypes: {},
      topActivities: [],
      timeline: this.generateTimeline(events)
    };

    // Count by event type
    events.forEach(event => {
      stats.eventTypes[event.eventType] = (stats.eventTypes[event.eventType] || 0) + 1;
    });

    // Top activities
    stats.topActivities = Object.entries(stats.eventTypes)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }))
      .slice(0, 10);

    return stats;
  }

  /**
   * Generate timeline data for charts
   */
  generateTimeline(events) {
    const timeline = {};

    events.forEach(event => {
      const date = new Date(event.timestamp).toLocaleDateString('tr-TR');
      if (!timeline[date]) {
        timeline[date] = { date, count: 0 };
      }
      timeline[date].count++;
    });

    return Object.values(timeline).sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
  }

  /**
   * Export report
   */
  generateReport(timeRange = 'all') {
    const stats = this.getStats(timeRange);
    const timestamp = new Date().toLocaleString('tr-TR');

    return {
      title: 'Nokta Dizayn Portal - Usage Report',
      generatedAt: timestamp,
      timeRange,
      summary: {
        totalEvents: stats.totalEvents,
        eventTypes: stats.eventTypes,
        topActivities: stats.topActivities
      },
      timeline: stats.timeline,
      recommendations: this.generateRecommendations(stats)
    };
  }

  /**
   * Generate recommendations based on usage
   */
  generateRecommendations(stats) {
    const recommendations = [];

    // Analyze usage patterns
    if (stats.topActivities.length === 0) {
      recommendations.push('📌 Start using Nokta Dizayn Portal to track your activities');
    }

    if (stats.eventTypes['render_created'] && stats.eventTypes['render_created'] > 10) {
      recommendations.push('💡 Consider saving your favorite render configurations');
    }

    if (stats.eventTypes['pdf_export'] && stats.eventTypes['pdf_export'] > 5) {
      recommendations.push('📦 Try batch export to save time with multiple projects');
    }

    if (stats.eventTypes['material_change']) {
      recommendations.push('⭐ Mark your favorite material combinations as presets');
    }

    if (stats.eventTypes['email_sent']) {
      recommendations.push('📧 Set up weekly reports to track your work');
    }

    return recommendations;
  }

  /**
   * Clear old events
   */
  clearOldEvents(daysOld = 30) {
    const threshold = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    this.events = this.events.filter(e => new Date(e.timestamp).getTime() > threshold);
    this.saveEvents();
  }

  /**
   * Export events as JSON
   */
  exportAsJSON() {
    return JSON.stringify(this.events, null, 2);
  }

  /**
   * Export events as CSV
   */
  exportAsCSV() {
    let csv = 'EventType,Data,Timestamp,URL\n';
    this.events.forEach(event => {
      csv += `"${event.eventType}","${JSON.stringify(event.data)}","${event.timestamp}","${event.url}"\n`;
    });
    return csv;
  }

  /**
   * Save to localStorage
   */
  saveEvents() {
    try {
      const data = JSON.stringify(
        this.events.map(e => e.toJSON())
      );
      localStorage.setItem('analytics_events', data);
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }
  }

  /**
   * Load from localStorage
   */
  loadEvents() {
    try {
      const data = localStorage.getItem('analytics_events');
      if (data) {
        this.events = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  }

  /**
   * Reset analytics
   */
  reset() {
    this.events = [];
    localStorage.removeItem('analytics_events');
  }
}

// Create singleton instance
export const analytics = new AnalyticsTracker();

// Track page views automatically
if (typeof window !== 'undefined') {
  analytics.track('page_view', {
    page: window.location.pathname,
    title: document.title
  });
}
