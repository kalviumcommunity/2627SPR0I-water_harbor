import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalise API error messages
    let message = 'An unexpected error occurred.';
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      message = typeof detail === 'string' ? detail : JSON.stringify(detail);
    } else if (error.message) {
      message = error.message;
    }
    return Promise.reject({
      status: error.response?.status,
      message,
      original: error,
    });
  }
);

export default apiClient;
