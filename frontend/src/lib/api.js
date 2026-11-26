import axios from 'axios';

export const API_BASE_URL =
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

export function getReportPhotoUrl(photoUrl) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  return `${API_BASE_URL}${photoUrl}`;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
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
    if (response.data && response.data.csrf_token) {
      setCsrfToken(response.data.csrf_token);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 409) {
      error.isDuplicate = true;
    }
    return Promise.reject(error);
  }
);

export const api = apiClient;

// ── Campus Locations ────────────────────────────────────────────────────────
export async function fetchCampusLocations({ includeInactive = false } = {}) {
  const res = await apiClient.get('/api/campus-locations', {
    params: includeInactive ? { include_inactive: true } : undefined,
  });
  return res.data;
}

export async function createCampusLocation(payload) {
  const res = await apiClient.post('/api/campus-locations', payload);
  return res.data;
}

export async function updateCampusLocation(locationId, payload) {
  const res = await apiClient.patch(`/api/campus-locations/${locationId}`, payload);
  return res.data;
}

// ── Water Points ────────────────────────────────────────────────────────────
export async function fetchWaterPoints({ includeInactive = false, campusLocationId, type } = {}) {
  const params = {};
  if (includeInactive) params.include_inactive = true;
  if (campusLocationId) params.campus_location_id = campusLocationId;
  if (type) params.type = type;
  const res = await apiClient.get('/api/water-points', { params });
  return res.data;
}

export async function createWaterPoint(payload) {
  const res = await apiClient.post('/api/water-points', payload);
  return res.data;
}

export async function updateWaterPoint(waterPointId, payload) {
  const res = await apiClient.patch(`/api/water-points/${waterPointId}`, payload);
  return res.data;
}

// ── Public Reports & Confirmations ──────────────────────────────────────────
export async function fetchReports() {
  const res = await apiClient.get('/api/reports');
  return res.data;
}

export async function fetchMyConfirmations() {
  const res = await apiClient.get('/api/reports/my-confirmations');
  return res.data?.report_ids || [];
}

export async function submitReport(waterPointId, description, photoFile = null) {
  if (photoFile) {
    const formData = new FormData();
    formData.append('water_point_id', String(Number(waterPointId)));
    formData.append('description', description.trim());
    formData.append('photo', photoFile);
    const res = await apiClient.post('/api/reports', formData, {
      headers: { 'Content-Type': undefined },
    });
    return res.data;
  }

  const res = await apiClient.post('/api/reports', {
    water_point_id: Number(waterPointId),
    description: description.trim(),
  });
  return res.data;
}

export async function confirmReport(reportId) {
  const res = await apiClient.post(`/api/reports/${reportId}/confirm`);
  return res.data;
}

// ── Staff Authenticated Actions ─────────────────────────────────────────────
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

export async function claimReport(reportId) {
  const res = await apiClient.post(`/api/reports/${reportId}/claim`);
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
