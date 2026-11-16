/**
 * Centralized API Service for Campus WaterPoint Board
 * Connects to FastAPI backend using VITE_API_BASE_URL.
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.isConflict = status === 409;
    this.conflictDetail =
      status === 409 && data?.detail
        ? data.detail
        : null;
  }
}

/**
 * Reusable request helper with centralized error handling and query parsing.
 */
async function request(endpoint, options = {}) {
  const { params, ...customConfig } = options;
  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...customConfig.headers,
  };

  const config = {
    method: 'GET',
    ...customConfig,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage =
        (typeof data === 'object' && data?.detail) ||
        (typeof data === 'string' && data) ||
        `Request failed with status ${response.status}`;

      throw new ApiError(errorMessage, response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error or fetch abort
    throw new ApiError(
      error.message || 'Unable to connect to the WaterPoint backend service. Please ensure the backend is running.',
      0,
      null
    );
  }
}

export const api = {
  get: (endpoint, params = {}, options = {}) =>
    request(endpoint, { ...options, method: 'GET', params }),

  post: (endpoint, body = {}, options = {}) =>
    request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patch: (endpoint, body = null, params = {}, options = {}) =>
    request(endpoint, {
      ...options,
      method: 'PATCH',
      params,
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),

  delete: (endpoint, options = {}) =>
    request(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
