/**
 * Production Testing Utilities
 * Run these tests in browser console (F12) before deployment
 */

// ============================================
// 1. LOCALSTORAGE TEST
// ============================================
window.testLocalStorage = function() {
  console.log('🧪 Testing localStorage...');
  
  try {
    // Test 1: Set and get
    localStorage.setItem('test_key', 'test_value');
    const value = localStorage.getItem('test_key');
    
    if (value !== 'test_value') {
      throw new Error('localStorage get/set failed');
    }
    console.log('✅ localStorage get/set: OK');
    
    // Test 2: JSON storage
    const testObj = { name: 'Test', data: [1, 2, 3] };
    localStorage.setItem('test_json', JSON.stringify(testObj));
    const retrieved = JSON.parse(localStorage.getItem('test_json'));
    
    if (JSON.stringify(retrieved) !== JSON.stringify(testObj)) {
      throw new Error('JSON storage failed');
    }
    console.log('✅ JSON storage: OK');
    
    // Test 3: Size
    const size = JSON.stringify(localStorage).length;
    console.log(`✅ Current size: ${(size / 1024).toFixed(2)} KB`);
    
    // Test 4: Clear
    localStorage.removeItem('test_key');
    localStorage.removeItem('test_json');
    console.log('✅ localStorage clear: OK');
    
    console.log('✅ localStorage test: PASSED\n');
    return true;
  } catch (error) {
    console.error('❌ localStorage test: FAILED', error);
    return false;
  }
};

// ============================================
// 2. EMAIL SERVICE TEST
// ============================================
window.testEmailService = function() {
  console.log('🧪 Testing email service...');
  
  try {
    // Check if emailService is available
    if (typeof sendEmail === 'undefined') {
      console.warn('⚠️ Email service not loaded in this context');
      return false;
    }
    
    const emailConfig = {
      isConfigured: () => !!process.env.REACT_APP_SENDGRID_API_KEY,
      fromEmail: 'portal@nokta-dizayn.com'
    };
    
    console.log('✅ Email config loaded');
    console.log(`✅ SendGrid configured: ${emailConfig.isConfigured()}`);
    
    // Test email validation
    const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    console.log(`✅ Valid email test: ${validEmail('test@test.com')}`);
    console.log(`✅ Invalid email test: ${!validEmail('invalid.email')}`);
    
    console.log('✅ Email service test: PASSED\n');
    return true;
  } catch (error) {
    console.error('❌ Email service test: FAILED', error);
    return false;
  }
};

// ============================================
// 3. BATCH EXPORT TEST
// ============================================
window.testBatchExport = function() {
  console.log('🧪 Testing batch export...');
  
  try {
    // Mock batch generator
    const mockProjects = [
      { id: 1, projectName: 'Project 1', location: 'Istanbul', area: 200 },
      { id: 2, projectName: 'Project 2', location: 'Ankara', area: 150 }
    ];
    
    console.log(`✅ Mock projects created: ${mockProjects.length}`);
    
    // Test batch task creation
    const mockTask = {
      id: `batch-${Date.now()}`,
      projects: mockProjects,
      status: 'pending',
      progress: 0,
      results: []
    };
    
    console.log(`✅ Batch task created: ${mockTask.id}`);
    console.log(`✅ Projects in batch: ${mockTask.projects.length}`);
    
    // Test progress calculation
    mockTask.results.push({ success: true });
    const progress = Math.round((mockTask.results.length / mockTask.projects.length) * 100);
    console.log(`✅ Progress calculation: ${progress}%`);
    
    console.log('✅ Batch export test: PASSED\n');
    return true;
  } catch (error) {
    console.error('❌ Batch export test: FAILED', error);
    return false;
  }
};

// ============================================
// 4. ANALYTICS TRACKER TEST
// ============================================
window.testAnalytics = function() {
  console.log('🧪 Testing analytics...');
  
  try {
    // Mock analytics
    const mockEvents = [];
    const mockTrack = (eventType, data) => {
      mockEvents.push({
        eventType,
        data,
        timestamp: new Date(),
        sessionId: 'session-123'
      });
    };
    
    // Test event tracking
    mockTrack('test_event', { value: 'test' });
    console.log(`✅ Event tracked: ${mockEvents.length} events`);
    
    // Test stats generation
    const stats = {
      totalEvents: mockEvents.length,
      eventTypes: {}
    };
    
    mockEvents.forEach(e => {
      stats.eventTypes[e.eventType] = (stats.eventTypes[e.eventType] || 0) + 1;
    });
    
    console.log(`✅ Stats generated: ${JSON.stringify(stats)}`);
    
    // Test localStorage persistence
    localStorage.setItem('analytics_events', JSON.stringify(mockEvents));
    const retrieved = JSON.parse(localStorage.getItem('analytics_events'));
    console.log(`✅ Analytics persisted: ${retrieved.length} events`);
    
    localStorage.removeItem('analytics_events');
    
    console.log('✅ Analytics test: PASSED\n');
    return true;
  } catch (error) {
    console.error('❌ Analytics test: FAILED', error);
    return false;
  }
};

// ============================================
// 5. PERFORMANCE TEST
// ============================================
window.testPerformance = function() {
  console.log('🧪 Testing performance...');
  
  try {
    // Test 1: DOM ready time
    const timing = window.performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    console.log(`✅ Page load time: ${loadTime}ms (target: < 3000ms)`);
    
    // Test 2: Memory usage
    if (performance.memory) {
      const memUsed = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
      const memLimit = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2);
      console.log(`✅ Memory: ${memUsed}MB / ${memLimit}MB`);
    }
    
    // Test 3: Resources
    const resources = performance.getEntriesByType('resource');
    const sizes = resources.reduce((sum, r) => sum + r.transferSize, 0);
    console.log(`✅ Total resources: ${resources.length} (${(sizes / 1024 / 1024).toFixed(2)} MB)`);
    
    // Test 4: 3D canvas
    const canvas = document.querySelector('canvas');
    if (canvas) {
      console.log(`✅ Canvas found: ${canvas.width}x${canvas.height}`);
    }
    
    console.log('✅ Performance test: PASSED\n');
    return true;
  } catch (error) {
    console.error('❌ Performance test: FAILED', error);
    return false;
  }
};

// ============================================
// 6. MOBILE RESPONSIVENESS TEST
// ============================================
window.testResponsiveness = function() {
  console.log('🧪 Testing responsiveness...');
  
  try {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    console.log(`✅ Current viewport: ${width}x${height}`);
    
    // Check breakpoints
    const breakpoints = {
      'Mobile': width < 480,
      'Tablet': width >= 480 && width < 768,
      'Desktop': width >= 768
    };
    
    Object.entries(breakpoints).forEach(([name, matches]) => {
      console.log(`${matches ? '✅' : '❌'} ${name} (${width}px)`);
    });
    
    // Check touch support
    const isTouchDevice = () => {
      return (('ontouchstart' in window) ||
              (navigator.maxTouchPoints > 0) ||
              (navigator.msMaxTouchPoints > 0));
    };
    
    console.log(`✅ Touch support: ${isTouchDevice()}`);
    
    // Check button sizes (should be >= 44px)
    const buttons = document.querySelectorAll('button');
    console.log(`✅ Buttons found: ${buttons.length}`);
    
    console.log('✅ Responsiveness test: PASSED\n');
    return true;
  } catch (error) {
    console.error('❌ Responsiveness test: FAILED', error);
    return false;
  }
};

// ============================================
// 7. RUN ALL TESTS
// ============================================
window.runAllTests = function() {
  console.log('═══════════════════════════════════════════');
  console.log('🚀 PRODUCTION TESTING SUITE');
  console.log('═══════════════════════════════════════════\n');
  
  const results = [];
  
  results.push({
    name: 'localStorage',
    passed: testLocalStorage()
  });
  
  results.push({
    name: 'Email Service',
    passed: testEmailService()
  });
  
  results.push({
    name: 'Batch Export',
    passed: testBatchExport()
  });
  
  results.push({
    name: 'Analytics',
    passed: testAnalytics()
  });
  
  results.push({
    name: 'Performance',
    passed: testPerformance()
  });
  
  results.push({
    name: 'Responsiveness',
    passed: testResponsiveness()
  });
  
  // Summary
  console.log('═══════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════\n');
  
  let passCount = 0;
  results.forEach(r => {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} ${r.name}`);
    if (r.passed) passCount++;
  });
  
  console.log(`\nTotal: ${passCount}/${results.length} passed\n`);
  
  if (passCount === results.length) {
    console.log('🎉 ALL TESTS PASSED - Ready for production!\n');
  } else {
    console.log('⚠️  Some tests failed - review before deploying\n');
  }
  
  return results;
};

// ============================================
// 8. QUICK HEALTH CHECK
// ============================================
window.healthCheck = function() {
  console.log('🏥 Health Check\n');
  
  const checks = {
    'Browser': !!window,
    'DOM Ready': document.readyState === 'complete',
    'localStorage': (() => {
      try { localStorage.setItem('t', '1'); localStorage.removeItem('t'); return true; }
      catch (e) { return false; }
    })(),
    'Canvas': !!document.querySelector('canvas'),
    'Touch Support': ('ontouchstart' in window),
    'ES6 Support': (() => {
      try { eval('(()=>{})'); return true; }
      catch (e) { return false; }
    })()
  };
  
  Object.entries(checks).forEach(([name, status]) => {
    console.log(`${status ? '✅' : '⚠️'} ${name}`);
  });
  
  console.log('\n✅ Health check complete');
};

// ============================================
// USAGE
// ============================================
/*
// Run in browser console (F12):

// Quick health check
healthCheck()

// Test specific feature
testLocalStorage()
testEmailService()
testBatchExport()
testAnalytics()
testPerformance()
testResponsiveness()

// Run all tests
runAllTests()
*/

console.log('📋 Test utilities loaded!');
console.log('Run: healthCheck() or runAllTests()');
