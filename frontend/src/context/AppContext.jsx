import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppContext } from './context';
import {
  fetchWaterPoints,
  fetchReports,
  fetchStaffReports,
  fetchStaffSession,
  staffLogin as apiStaffLogin,
  staffLogout as apiStaffLogout,
  submitReport,
  resolveReport,
  setCsrfToken,
} from '../lib/api';
import {
  executeKeyedSingleFlight,
  fetchDashboardData,
  formatBackendError,
  performStaffLogout,
} from '../lib/reliability';

export function AppProvider({ children }) {
  const [waterPoints, setWaterPoints] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [toast, setToast] = useState(null);

  // Authenticated Staff Session State (held in memory only)
  const [staffSession, setStaffSession] = useState(null);
  const [staffAuthLoading, setStaffAuthLoading] = useState(true);

  const inFlightRefreshRef = useRef(null);
  const requestGenerationRef = useRef(0);
  const isMountedRef = useRef(true);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    setToast({ message, type, duration });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Restore staff session on mount from HttpOnly cookie
  useEffect(() => {
    let active = true;
    async function restoreSession() {
      try {
        const session = await fetchStaffSession();
        if (active && session?.authenticated) {
          setStaffSession(session);
        }
      } catch {
        if (active) {
          setStaffSession(null);
        }
      } finally {
        if (active) {
          setStaffAuthLoading(false);
        }
      }
    }
    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const loadData = useCallback(
    (options = {}) => {
      const hasOptionsObject = options && typeof options === 'object';
      const silent = Boolean(
        hasOptionsObject && 'silent' in options ? options.silent : false
      );
      const notifyOnError =
        hasOptionsObject && 'notifyOnError' in options
          ? Boolean(options.notifyOnError)
          : !silent;
      const force = Boolean(
        hasOptionsObject && 'force' in options ? options.force : false
      );
      const hasSessionOverride =
        hasOptionsObject &&
        Object.prototype.hasOwnProperty.call(options, 'sessionOverride');
      const effectiveSession = hasSessionOverride
        ? options.sessionOverride
        : staffSession;
      const isAuthenticated = Boolean(effectiveSession?.authenticated);
      const authKey = isAuthenticated ? 'staff' : 'public';

      const currentInFlight = inFlightRefreshRef.current;
      if (currentInFlight && !force && currentInFlight.key === authKey) {
        return currentInFlight.promise;
      }

      const myGeneration = ++requestGenerationRef.current;

      return executeKeyedSingleFlight(
        inFlightRefreshRef,
        { key: authKey, force },
        async () => {
          if (silent) {
            setIsRefreshing(true);
          } else {
            setLoading(true);
          }
          try {
            const { waterPoints: wpData, reports: repData } =
              await fetchDashboardData({
                isAuthenticated,
                fetchWaterPoints,
                fetchReports,
                fetchStaffReports,
              });

            if (
              !isMountedRef.current ||
              myGeneration !== requestGenerationRef.current
            ) {
              return { ok: false, aborted: true };
            }

            setWaterPoints(wpData);
            setReports(repData);
            setError(null);
            setLastUpdated(new Date().toISOString());
            return { ok: true, waterPoints: wpData, reports: repData };
          } catch (err) {
            if (
              !isMountedRef.current ||
              myGeneration !== requestGenerationRef.current
            ) {
              return { ok: false, aborted: true };
            }

            if (isAuthenticated && err?.response?.status === 401) {
              setCsrfToken(null);
              setStaffSession(null);
              const message =
                'Your staff session has expired. Please sign in again.';
              setError(message);
              if (notifyOnError) {
                showToast(message, 'error');
              }
              return {
                ok: false,
                error: err,
                message,
                sessionExpired: true,
              };
            }

            const message = formatBackendError(
              err,
              silent ? 'refresh' : 'load'
            );
            setError(message);
            if (notifyOnError) {
              showToast(message, 'error');
            }
            return { ok: false, error: err, message };
          } finally {
            if (
              isMountedRef.current &&
              myGeneration === requestGenerationRef.current
            ) {
              setLoading(false);
              setIsRefreshing(false);
            }
          }
        }
      );
    },
    [showToast, staffSession]
  );

  // Fetch live data once initial staff session check completes (and when session changes)
  useEffect(() => {
    if (!staffAuthLoading) {
      void loadData({ silent: false, notifyOnError: false });
    }
  }, [loadData, staffAuthLoading]);

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

    const previousReports = [...reports];
    setReports((prev) => [tempReport, ...prev]);

    try {
      const createdReport = await submitReport(numericId, trimmedDesc);
      setReports((prev) =>
        prev.map((r) => (r.id === tempReport.id ? createdReport : r))
      );
      setError(null);
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

      const message = formatBackendError(err, 'submit');
      if (!err?.response) {
        setError(formatBackendError(err, 'load'));
      }
      showToast(message, 'error');
      throw err;
    }
  };

  // Resolve an issue report (Staff action using HttpOnly cookie session)
  const resolveReportAction = async (reportId, resolutionNotes) => {
    const previousReports = [...reports];
    const nowIso = new Date().toISOString();
    const staffDisplayName = staffSession?.staff?.display_name || 'Staff';

    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'staff_confirmed_resolved',
              resolved_at: nowIso,
              resolved_by: staffDisplayName,
              resolution_notes: resolutionNotes || null,
            }
          : r
      )
    );

    try {
      const updated = await resolveReport(reportId, resolutionNotes);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? updated : r))
      );
      setError(null);
      showToast('Water point marked resolved!', 'success');
      return updated;
    } catch (err) {
      setReports(previousReports);
      if (err?.response?.status === 401) {
        setCsrfToken(null);
        setStaffSession(null);
      }
      const message = formatBackendError(err, 'resolve');
      if (!err?.response) {
        setError(formatBackendError(err, 'load'));
      }
      showToast(message, 'error');
      throw err;
    }
  };

  // Staff login action
  const loginStaff = async (accessKey) => {
    const session = await apiStaffLogin(accessKey);
    setStaffSession(session);
    // Fetch privileged staff reports immediately (never fall back to public reports)
    await loadData({
      silent: true,
      notifyOnError: true,
      force: true,
      sessionOverride: session,
    });
    return session;
  };

  // Staff logout action: clear session & CSRF only after backend confirms logout
  const logoutStaff = async () => {
    return performStaffLogout({
      apiStaffLogout,
      onSuccess: async () => {
        setStaffSession(null);
        showToast('Signed out of staff session.', 'info');
        await loadData({
          silent: true,
          notifyOnError: false,
          force: true,
          sessionOverride: null,
        });
      },
      onError: (err) => {
        const message = formatBackendError(err, 'logout');
        showToast(message, 'error');
      },
    });
  };

  const value = {
    waterPoints,
    reports,
    activeReportsMap,
    resolvedReportsMap,
    stats,
    loading,
    isRefreshing,
    error,
    lastUpdated,
    toast,
    showToast,
    hideToast,
    refreshData: loadData,
    addReport,
    resolveReportAction,
    // Staff session methods & state
    staffSession,
    staffAuthLoading,
    loginStaff,
    logoutStaff,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppProvider;
