import { useState, useEffect, useCallback, useMemo } from 'react';
import waterPointService from '../services/waterPointService';
import reportService from '../services/reportService';
import { REPORT_STATUS } from '../utils/constants';

export function useWaterPoints() {
  const [waterPoints, setWaterPoints] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const refetch = useCallback(() => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [wpData, repData] = await Promise.all([
          waterPointService.getWaterPoints({ limit: 100 }),
          reportService.getReports({ limit: 500 }),
        ]);

        if (!ignore) {
          setWaterPoints(Array.isArray(wpData) ? wpData : []);
          setReports(Array.isArray(repData) ? repData : []);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to fetch water points from the server.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [refreshTrigger]);

  // Combine water points with their latest report status and timestamp
  const waterPointsWithStatus = useMemo(() => {
    return waterPoints.map((wp) => {
      // Find all reports for this water point
      const wpReports = reports.filter((r) => r.water_point_id === wp.id);

      // Check if there is an active unresolved report first
      const activeReport = wpReports.find(
        (r) => r.status === REPORT_STATUS.REPORTED_UNAVAILABLE
      );

      // Or latest resolved report
      const latestReport = wpReports[0] || null;

      const currentStatus = activeReport
        ? REPORT_STATUS.REPORTED_UNAVAILABLE
        : latestReport
        ? latestReport.status
        : null;

      const lastUpdated = activeReport
        ? activeReport.reported_at
        : latestReport
        ? latestReport.resolved_at || latestReport.reported_at
        : wp.created_at;

      return {
        ...wp,
        latestStatus: currentStatus,
        activeReport,
        latestReport,
        lastUpdated,
      };
    });
  }, [waterPoints, reports]);

  // Apply search & status filter
  const filteredWaterPoints = useMemo(() => {
    return waterPointsWithStatus.filter((wp) => {
      const matchesSearch =
        !searchTerm.trim() ||
        wp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wp.location.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'reported_unavailable') {
        return wp.latestStatus === REPORT_STATUS.REPORTED_UNAVAILABLE;
      }
      if (statusFilter === 'staff_confirmed_resolved') {
        return wp.latestStatus === REPORT_STATUS.STAFF_CONFIRMED_RESOLVED;
      }
      if (statusFilter === 'unknown') {
        return !wp.latestStatus;
      }

      return true;
    });
  }, [waterPointsWithStatus, searchTerm, statusFilter]);

  return {
    waterPoints: filteredWaterPoints,
    rawWaterPoints: waterPoints,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    refetch,
  };
}

export default useWaterPoints;
