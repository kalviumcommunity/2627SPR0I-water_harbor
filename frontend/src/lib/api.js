import axios from 'axios';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:8000';

// In-memory CSRF token store (never written to localStorage or sessionStorage)
let inMemoryCsrfToken = null;

export function setCsrfToken(token) {
  inMemoryCsrfToken = token || null;
}

export function getCsrfToken() {
  return inMemoryCsrfToken;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  withCredentials: true, // Enable sending HttpOnly cookies cross-origin / same-origin
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach CSRF token header on mutating operations
apiClient.interceptors.request.use(
  (config) => {
    const method = config.method?.toUpperCase();
    if (inMemoryCsrfToken && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      config.headers['X-CSRF-Token'] = inMemoryCsrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to format errors
apiClient.interceptors.response.use(
  (response) => {
    // If backend returns a new CSRF token in response data, track it
    if (response.data && response.data.csrf_token) {
      setCsrfToken(response.data.csrf_token);
    }
    return response;
  },
  (error) => {
    // Enrich 409 duplicate errors
    if (error.response?.status === 409) {
      error.isDuplicate = true;
    }
    return Promise.reject(error);
  }
);

export const api = apiClient;

export async function fetchWaterPoints() {
  const res = await apiClient.get('/api/water-points');
  return res.data;
}

export async function fetchReports() {
  const res = await apiClient.get('/api/reports');
  return res.data;
}

export async function submitReport(waterPointId, description) {
  const res = await apiClient.post('/api/reports', {
    water_point_id: Number(waterPointId),
    description: description.trim(),
  });
  return res.data;
}

// Staff authenticated actions
export async function staffLogin(accessKey) {
  const res = await apiClient.post('/api/staff/login', {
    access_key: accessKey.trim(),
  });
  if (res.data?.csrf_token) {
    setCsrfToken(res.data.csrf_token);
  }
  return res.data;
}

export async function fetchStaffSession() {
  const res = await apiClient.get('/api/staff/session');
  if (res.data?.csrf_token) {
    setCsrfToken(res.data.csrf_token);
  }
  return res.data;
}

export async function staffLogout(client = apiClient) {
  const res = await client.post('/api/staff/logout');
  setCsrfToken(null);
  return res.data;
}

export async function fetchStaffReports() {
  const res = await apiClient.get('/api/staff/reports');
  return res.data;
}

export async function resolveReport(reportId, resolutionNotes) {
  const payload = {
    resolution_notes: resolutionNotes?.trim() || null,
  };
  const res = await apiClient.post(`/api/reports/${reportId}/resolve`, payload);
  return res.data;
}

export default apiClient;
