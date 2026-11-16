import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach staff access key if stored in sessionStorage
apiClient.interceptors.request.use((config) => {
  const staffKey = sessionStorage.getItem('staff_access_key');
  if (staffKey) {
    config.headers['X-Staff-Key'] = staffKey;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor to format errors
apiClient.interceptors.response.use(
  (response) => response,
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

export async function resolveReport(reportId, resolvedBy, resolutionNotes) {
  const payload = {
    resolved_by: resolvedBy.trim(),
    resolution_notes: resolutionNotes?.trim() || null,
  };
  const res = await apiClient.post(`/api/reports/${reportId}/resolve`, payload);
  return res.data;
}

export default apiClient;
