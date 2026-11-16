import api from './api';

export const reportService = {
  /**
   * Submit a student unavailable dispenser report.
   * Does not require authentication.
   * Rejects duplicate active unresolved reports with 409 Conflict.
   */
  async submitReport({ waterPointId, description }) {
    return api.post('/api/reports', {
      water_point_id: Number(waterPointId),
      description: description.trim(),
    });
  },

  /**
   * List reports with optional status and waterPointId filtering.
   */
  async getReports(params = {}) {
    return api.get('/api/reports', params);
  },

  /**
   * Retrieve report by ID.
   */
  async getReportById(id) {
    return api.get(`/api/reports/${id}`);
  },

  /**
   * Facilities staff action: confirm issue resolution.
   */
  async resolveReport(reportId, resolvedBy = 'facilities_staff') {
    return api.patch(`/api/reports/${reportId}/resolve`, null, {
      resolved_by: resolvedBy,
    });
  },
};

export default reportService;
