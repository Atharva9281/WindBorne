// API configuration for different environments
const config = {
  development: {
    API_BASE: 'http://localhost:8000/api',
  },
  production: {
    API_BASE: 'https://windborne-backend.onrender.com/api',  // Replace with your Render backend URL
  }
};

const environment = process.env.NODE_ENV || 'development';
export const { API_BASE } = config[environment];

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