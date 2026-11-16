import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppContext } from './context';
import {
  fetchWaterPoints,
  fetchReports,
  submitReport,
  resolveReport,
} from '../lib/api';
import { initialSeedWaterPoints, initialSeedReports } from '../data/seedData';

const STORAGE_WP_KEY = 'campus_waterpoint_data';
const STORAGE_REPORTS_KEY = 'campus_waterpoint_reports';

export function AppProvider({ children }) {
  const [waterPoints, setWaterPoints] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    setToast({ message, type, duration });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Initialize or fallback to localStorage seed data
  const loadFallbackData = useCallback(() => {
    try {
      const savedWp = localStorage.getItem(STORAGE_WP_KEY);
      const savedReports = localStorage.getItem(STORAGE_REPORTS_KEY);

      const parsedWp = savedWp ? JSON.parse(savedWp) : initialSeedWaterPoints;
      const parsedReports = savedReports ? JSON.parse(savedReports) : initialSeedReports;

      setWaterPoints(parsedWp);
      setReports(parsedReports);
      setIsFallback(true);
    } catch (e) {
      console.warn('Could not read fallback from localStorage:', e);
      setWaterPoints(initialSeedWaterPoints);
      setReports(initialSeedReports);
      setIsFallback(true);
    }
  }, []);

  const saveFallbackData = useCallback((newWp, newReports) => {
    try {
      localStorage.setItem(STORAGE_WP_KEY, JSON.stringify(newWp));
      localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(newReports));
    } catch (e) {
      console.warn('Could not write fallback to localStorage:', e);
    }
  }, []);

  // Fetch data from live FastAPI backend on mount
  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [wpData, repData] = await Promise.all([
          fetchWaterPoints(),
          fetchReports(),
        ]);
        if (!ignore) {
          setWaterPoints(wpData);
          setReports(repData);
          setIsFallback(false);
          saveFallbackData(wpData, repData);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.warn('API unreachable, falling back to cached seed data:', err.message);
          loadFallbackData();
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [loadFallbackData, saveFallbackData]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [wpData, repData] = await Promise.all([
        fetchWaterPoints(),
        fetchReports(),
      ]);
      setWaterPoints(wpData);
      setReports(repData);
      setIsFallback(false);
      saveFallbackData(wpData, repData);
    } catch (err) {
      console.warn('API unreachable, falling back to cached seed data:', err.message);
      loadFallbackData();
    } finally {
      setLoading(false);
    }
  }, [loadFallbackData, saveFallbackData]);

  // Compute active reports map: water_point_id -> active report
  const activeReportsMap = useMemo(() => {
    const map = new Map();
    for (const report of reports) {
      if (report.status === 'reported_unavailable') {
        map.set(report.water_point_id, report);
      }
    }
    return map;
  }, [reports]);

  // Compute most recent resolved reports map: water_point_id -> resolved report
  const resolvedReportsMap = useMemo(() => {
    const map = new Map();
    const sorted = [...reports].sort((a, b) => {
      const tA = a.resolved_at ? new Date(a.resolved_at).getTime() : 0;
      const tB = b.resolved_at ? new Date(b.resolved_at).getTime() : 0;
      return tB - tA;
    });

    for (const report of sorted) {
      const isResolved =
        report.status === 'staff_confirmed_resolved' ||
        report.status === 'resolved' ||
        Boolean(report.resolved_at);
      if (isResolved && !map.has(report.water_point_id)) {
        map.set(report.water_point_id, report);
      }
    }
    return map;
  }, [reports]);

  // Compute overall status counts
  const stats = useMemo(() => {
    let reportedUnavailable = 0;
    let staffConfirmedResolved = 0;
    let noRecentReport = 0;

    for (const wp of waterPoints) {
      if (activeReportsMap.has(wp.id)) {
        reportedUnavailable += 1;
      } else if (resolvedReportsMap.has(wp.id)) {
        staffConfirmedResolved += 1;
      } else {
        noRecentReport += 1;
      }
    }

    return {
      total: waterPoints.length,
      reportedUnavailable,
      staffConfirmedResolved,
      noRecentReport,
    };
  }, [waterPoints, activeReportsMap, resolvedReportsMap]);

  // Submit a student report (anonymous, 1-500 chars)
  const addReport = async (waterPointId, description) => {
    const numericId = Number(waterPointId);
    const trimmedDesc = description.trim();

    // Check if duplicate locally first
    if (activeReportsMap.has(numericId)) {
      return {
        duplicate: true,
        message: 'Someone already reported this water point. Our team is on it!',
      };
    }

    // Optimistic report placeholder
    const tempReport = {
      id: `temp-${Date.now()}`,
      water_point_id: numericId,
      description: trimmedDesc,
      status: 'reported_unavailable',
      reported_at: new Date().toISOString(),
      resolved_at: null,
      resolved_by: null,
      resolution_notes: null,
    };

    // Apply optimistic update
    const previousReports = [...reports];
    setReports((prev) => [tempReport, ...prev]);

    if (isFallback) {
      const nextReports = [tempReport, ...previousReports];
      saveFallbackData(waterPoints, nextReports);
      showToast('Report recorded in offline mode.', 'success');
      return { success: true, report: tempReport };
    }

    try {
      const createdReport = await submitReport(numericId, trimmedDesc);
      setReports((prev) =>
        prev.map((r) => (r.id === tempReport.id ? createdReport : r))
      );
      showToast('Thank you! Your report has been noted.', 'success');
      return { success: true, report: createdReport };
    } catch (err) {
      setReports(previousReports);

      if (err.isDuplicate || err.response?.status === 409) {
        return {
          duplicate: true,
          message:
            err.response?.data?.detail ||
            'Someone already reported this water point. Our team is on it!',
        };
      }

      showToast(err.response?.data?.detail || err.message || 'Failed to submit report', 'error');
      throw err;
    }
  };

  // Resolve an issue report (Staff action with X-Staff-Key)
  const resolveReportAction = async (reportId, resolvedBy, resolutionNotes) => {
    const previousReports = [...reports];
    const nowIso = new Date().toISOString();

    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'staff_confirmed_resolved',
              resolved_at: nowIso,
              resolved_by: resolvedBy,
              resolution_notes: resolutionNotes || null,
            }
          : r
      )
    );

    if (isFallback) {
      const updatedReports = previousReports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'staff_confirmed_resolved',
              resolved_at: nowIso,
              resolved_by: resolvedBy,
              resolution_notes: resolutionNotes || null,
            }
          : r
      );
      saveFallbackData(waterPoints, updatedReports);
      showToast('Repair logged in offline mode.', 'success');
      return;
    }

    try {
      const updated = await resolveReport(reportId, resolvedBy, resolutionNotes);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? updated : r))
      );
      showToast('Water point marked resolved!', 'success');
      return updated;
    } catch (err) {
      setReports(previousReports);
      showToast(
        err.response?.status === 401
          ? 'Staff authorization failed. Check your staff key.'
          : err.response?.data?.detail || 'Failed to resolve report',
        'error'
      );
      throw err;
    }
  };

  const value = {
    waterPoints,
    reports,
    activeReportsMap,
    resolvedReportsMap,
    stats,
    loading,
    isFallback,
    toast,
    showToast,
    hideToast,
    refreshData: loadData,
    addReport,
    resolveReportAction,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppProvider;
