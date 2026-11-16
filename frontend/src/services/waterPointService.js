import api from './api';

export const waterPointService = {
  /**
   * List campus water points with optional skip & limit pagination.
   */
  async getWaterPoints(params = {}) {
    return api.get('/api/water-points', params);
  },

  /**
   * Retrieve a single water point by ID.
   */
  async getWaterPointById(id) {
    return api.get(`/api/water-points/${id}`);
  },

  /**
   * Create a new water point location (administrative).
   */
  async createWaterPoint(payload) {
    return api.post('/api/water-points', payload);
  },
};

export default waterPointService;
