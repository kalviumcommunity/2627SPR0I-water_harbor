import apiClient from './client';

export async function submitIssueReport(payload) {
  const response = await apiClient.post('/api/reports', {
    water_point_id: Number(payload.water_point_id),
    description: payload.description.trim(),
  });
  return response.data;
}

export async function fetchIssueReports(params = {}) {
  const response = await apiClient.get('/api/reports', { params });
  return response.data;
}

export async function fetchIssueReportById(id) {
  const response = await apiClient.get(`/api/reports/${id}`);
  return response.data;
}

export async function resolveIssueReport(id, resolvedBy = 'facilities_staff') {
  const response = await apiClient.post(`/api/reports/${id}/resolve`, {
    resolved_by: resolvedBy,
  });
  return response.data;
}
