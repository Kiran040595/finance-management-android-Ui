// Base API configuration and HTTP request utility for Vehicle Finance Backend
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://finance-management-mnl4.onrender.com';

const DEFAULT_TIMEOUT_MS = 45000;

class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL.replace(/\/+$/, '');
  }

  setBaseURL(url) {
    this.baseURL = (url || API_BASE_URL).replace(/\/+$/, '');
  }

  getBaseURL() {
    return this.baseURL;
  }

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseURL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT_MS);

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      let responseData;
      const text = await response.text();
      try {
        responseData = text ? JSON.parse(text) : null;
      } catch {
        responseData = text;
      }

      if (!response.ok) {
        const errorMessage =
          (responseData && (responseData.message || responseData.error)) ||
          `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = responseData;
        throw error;
      }

      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timed out. Please check your internet connection or backend status.');
        timeoutError.isTimeout = true;
        throw timeoutError;
      }
      throw error;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
