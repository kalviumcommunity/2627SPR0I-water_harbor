import apiClient from './client';

export async function fetchWaterPoints(skip = 0, limit = 100) {
  const response = await apiClient.get('/api/water-points', {
    params: { skip, limit },
  });
  return response.data;
}

export async function createWaterPoint(payload) {
  const response = await apiClient.post('/api/water-points', payload);
  return response.data;
}

export async function fetchWaterPointById(id) {
  const response = await apiClient.get(`/api/water-points/${id}`);
  return response.data;
}
