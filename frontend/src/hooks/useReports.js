import { useState, useCallback, useEffect } from 'react';
import reportService from '../services/reportService';
import { ApiError } from '../services/api';

export function useReports(statusFilter = null) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchReports = useCallback(() => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadReports() {
      try {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        const data = await reportService.getReports(params);

        if (!ignore) {
          setReports(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to fetch reports.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      ignore = true;
    };
  }, [statusFilter, refreshTrigger]);

  /**
   * Submit student report with custom conflict parsing.
   * Returns { success: true, data } or { success: false, isConflict: true, message }.
   */
  const submitReport = async ({ waterPointId, description }) => {
    try {
      const result = await reportService.submitReport({ waterPointId, description });
      return { success: true, data: result };
    } catch (err) {
      if (err instanceof ApiError && err.isConflict) {
        return {
          success: false,
          isConflict: true,
          message:
            err.conflictDetail ||
            'An active unresolved report already exists for this water point.',
        };
      }
      return {
        success: false,
        isConflict: false,
        message: err.message || 'Failed to submit report. Please try again.',
      };
    }
  };

  /**
   * Resolve an issue report (Facilities staff).
   */
  const resolveReport = async (reportId, resolvedBy) => {
    try {
      const updated = await reportService.resolveReport(reportId, resolvedBy);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? updated : r))
      );
      return { success: true, data: updated };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Failed to confirm resolution.',
      };
    }
  };

  return {
    reports,
    loading,
    error,
    fetchReports,
    submitReport,
    resolveReport,
  };
}

export default useReports;
