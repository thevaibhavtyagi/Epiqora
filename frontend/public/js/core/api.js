/**
 * DermAI Pro - API Integration Module
 * Handles all backend API calls with retry logic and error handling
 */

// Configuration - Dynamic API URL for development and production
// const API_BASE_URL = (() => {
//   if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
//     return 'http://localhost:5000';
//   }
//   return '';
// })();

// Configuration - Dynamic API URL for development and production
const API_BASE_URL = (() => {
  const host = window.location.hostname;
  // We added your laptop's IP address here
  if (host === 'localhost' || host === '127.0.0.1' || host === '172.22.77.141') {
    // This dynamically points to whichever address you are using to view the site
    return `http://${host}:5000`; 
  }
  return '';
})();

/**
 * Retry logic for API calls
 */
async function apiCallWithRetry(url, options = {}, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status === 400) {
        return response;
      }
      if (attempt === retries - 1) throw new Error(`HTTP ${response.status}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    } catch (error) {
      if (attempt === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

/**
 * Check backend health
 */
async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is healthy:', data);
      return true;
    }
  } catch (error) {
    console.warn('⚠️ Backend is not available. Make sure to start it with: npm run dev (in backend folder)');
    return false;
  }
}

/**
 * Submit image for analysis
 */
async function submitImageForAnalysis(imageData) {
  try {
    // Convert data URI to blob
    const splitDataURI = imageData.split(',');
    const byteString = atob(splitDataURI[1]);
    const mimeString = splitDataURI[0].split(':')[1].split(';')[0];
    
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: mimeString });
    const extension = mimeString.split('/')[1] || 'jpg';

    const formData = new FormData();
    formData.append('image', blob, `photo.${extension}`);

    console.log('[Analysis] Submitting image for analysis...');
    const response = await apiCallWithRetry(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Analysis failed');
    }

    const result = await response.json();
    console.log('[Analysis] Results received:', result.data);
    return result.data;
  } catch (error) {
    console.error('[Analysis] Error:', error.message);
    throw error;
  }
}

/**
 * Fetch questions for the user based on skin analysis
 */
async function fetchQuestions(analysisData) {
  try {
    console.log('[Questions] Fetching personalized questions...');
    const response = await apiCallWithRetry(`${API_BASE_URL}/api/questions`, {
      method: 'POST', // Changed to POST
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ analysis: analysisData }), // Sending the data
    });

    if (!response.ok) {
      throw new Error('Failed to fetch questions');
    }

    const result = await response.json();
    console.log('[Questions] Questions received:', result);
    return result.data;
  } catch (error) {
    console.error('[Questions] Error:', error.message);
    throw error;
  }
}

/**
 * Generate personalized report
 */
async function generateReport(analysisData, questionsData, answersData) {
  try {
    console.log('[Report] Generating personalized report...');
    const response = await apiCallWithRetry(`${API_BASE_URL}/api/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        analysis: analysisData,
        questions: questionsData,   // Added missing parameter
        answers: answersData,       // Added missing parameter
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate report');
    }

    const result = await response.json();
    console.log('[Report] Report generated:', result);
    return result.data;
  } catch (error) {
    console.error('[Report] Error:', error.message);
    throw error;
  }
}

/**
 * Send chat message to AI assistant
 */
async function sendChatMessage(message, context = {}) {
  try {
    console.log('[Chat] Sending message:', message);
    const response = await apiCallWithRetry(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const result = await response.json();
    console.log('[Chat] Response received:', result);
    return result.data;
  } catch (error) {
    console.error('[Chat] Error:', error.message);
    throw error;
  }
}

// Initialize API on page load
document.addEventListener('DOMContentLoaded', () => {
  checkBackendHealth();
});
