// API configuration using environment variables
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export { API_BASE };

// Export configuration object
export default {
  API_BASE,
  TIMEOUT: 30000, // 30 seconds for Render cold starts
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 1000, // 1 second between retries
};

// Fetch wrapper with timeout and retry logic
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - backend may be starting up');
    }
    throw error;
  }
};