import { useState, useEffect, useCallback } from 'react';
import { fetchWaterPoints } from '../api/waterPoints';
import { fetchIssueReports, submitIssueReport, resolveIssueReport } from '../api/reports';
import { INITIAL_WATER_POINTS } from '../data/seedData';
import { AppContext } from './AppContextDefinition';

const STORAGE_KEY = 'water_harbor_data_v1';

function mergeData(wpList, reportsList) {
  return wpList.map((wp) => {
    const wpReports = (reportsList || []).filter((r) => r.water_point_id === wp.id);
    const active = wpReports.find((r) => r.status === 'reported_unavailable');
    const latestResolved = wpReports
      .filter((r) => r.status === 'staff_confirmed_resolved')
      .sort((a, b) => new Date(b.resolved_at || b.reported_at) - new Date(a.resolved_at || a.reported_at))[0];

    let computedStatus = 'no_recent_report';
    let lastUpdated = null;
    let resolvedInfo = null;

    if (active) {
      computedStatus = 'reported_unavailable';
      lastUpdated = active.reported_at;
    } else if (latestResolved) {
      computedStatus = 'staff_confirmed_resolved';
      lastUpdated = latestResolved.resolved_at || latestResolved.reported_at;
      resolvedInfo = {
        resolved_at: latestResolved.resolved_at,
        resolved_by: latestResolved.resolved_by || 'Facilities Staff',
      };
    }

    return {
      id: wp.id,
      name: wp.name,
      location: wp.location,
      building: wp.location.split(',')[0] || 'Campus',
      floor: wp.name.includes('Floor')
        ? wp.name.match(/\d+(?:st|nd|rd|th)?\s+Floor/i)?.[0] || 'Campus'
        : 'Ground Floor',
      status: computedStatus,
      last_updated: lastUpdated,
      active_report: active || null,
      resolved_info: resolvedInfo,
    };
  });
}

export function AppProvider({ children }) {
  const [waterPoints, setWaterPoints] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback to initial seed
    }
    return INITIAL_WATER_POINTS;
  });

  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);
  const [toast, setToast] = useState(null);
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(() => {
    return localStorage.getItem('water_harbor_staff') === 'true';
  });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(waterPoints));
    } catch (e) {
      console.warn('Could not persist to localStorage', e);
    }
  }, [waterPoints]);

  const syncWithBackend = useCallback(async () => {
    try {
      const [wpList, reportsList] = await Promise.all([
        fetchWaterPoints(0, 100),
        fetchIssueReports({ limit: 200 }),
      ]);

      if (Array.isArray(wpList) && wpList.length > 0) {
        setWaterPoints(mergeData(wpList, reportsList));
        setBackendOnline(true);
      } else {
        setBackendOnline(true);
      }
    } catch {
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchWaterPoints(0, 100),
      fetchIssueReports({ limit: 200 }),
    ])
      .then(([wpList, reportsList]) => {
        if (!active) return;
        if (Array.isArray(wpList) && wpList.length > 0) {
          setWaterPoints(mergeData(wpList, reportsList));
          setBackendOnline(true);
        } else {
          setBackendOnline(true);
        }
      })
      .catch(() => {
        if (active) setBackendOnline(false);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Report issue handler
  const reportUnavailable = async ({ waterPointId, description }) => {
    const wpId = Number(waterPointId);
    const existing = waterPoints.find((wp) => wp.id === wpId);
    if (!existing) {
      throw new Error('Water point not found');
    }

    if (existing.status === 'reported_unavailable') {
      const err = new Error(
        `An active report is already pending for this water point (reported ${
          existing.last_updated ? new Date(existing.last_updated).toLocaleTimeString() : 'recently'
        }).`
      );
      err.isDuplicate = true;
      throw err;
    }

    if (backendOnline) {
      try {
        await submitIssueReport({ water_point_id: wpId, description });
        await syncWithBackend();
        showToast(`Report submitted for ${existing.name}. Status marked Reported Unavailable.`, 'success');
        return;
      } catch (err) {
        if (err?.status === 409 || err?.message?.includes('already exists')) {
          const duplicateErr = new Error('An active unresolved report already exists for this water point.');
          duplicateErr.isDuplicate = true;
          throw duplicateErr;
        }
        console.warn('Backend submit failed, falling back to local state:', err);
      }
    }

    const now = new Date().toISOString();
    setWaterPoints((prev) =>
      prev.map((wp) => {
        if (wp.id === wpId) {
          return {
            ...wp,
            status: 'reported_unavailable',
            last_updated: now,
            active_report: {
              id: Date.now(),
              description,
              reported_at: now,
            },
          };
        }
        return wp;
      })
    );

    showToast(`Report submitted for ${existing.name}. Marked as Reported Unavailable.`, 'success');
  };

  const confirmResolution = async ({ waterPointId, resolvedBy, notes }) => {
    const wpId = Number(waterPointId);
    const target = waterPoints.find((wp) => wp.id === wpId);

    if (backendOnline && target?.active_report?.id) {
      try {
        await resolveIssueReport(target.active_report.id, resolvedBy || 'Staff');
        await syncWithBackend();
        showToast(`Resolution confirmed for ${target.name}.`, 'success');
        return;
      } catch (err) {
        console.warn('Backend resolve failed, falling back to local update:', err);
      }
    }

    const now = new Date().toISOString();
    setWaterPoints((prev) =>
      prev.map((wp) => {
        if (wp.id === wpId) {
          return {
            ...wp,
            status: 'staff_confirmed_resolved',
            last_updated: now,
            active_report: null,
            resolved_info: {
              resolved_at: now,
              resolved_by: resolvedBy || 'Staff - Facilities Team',
              notes: notes || 'Inspected dispenser, restored service and verified water flow.',
            },
          };
        }
        return wp;
      })
    );

    showToast(`Resolution confirmed for ${target?.name || 'water point'}. Status updated.`, 'success');
  };

  const resetToSeed = () => {
    setWaterPoints(INITIAL_WATER_POINTS);
    localStorage.removeItem(STORAGE_KEY);
    showToast('Reset to original campus demonstration data.', 'info');
  };

  const loginStaff = () => {
    setIsStaffLoggedIn(true);
    localStorage.setItem('water_harbor_staff', 'true');
    showToast('Logged in as Facilities Staff.', 'success');
  };

  const logoutStaff = () => {
    setIsStaffLoggedIn(false);
    localStorage.removeItem('water_harbor_staff');
    showToast('Logged out from Staff Dashboard.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        waterPoints,
        loading,
        backendOnline,
        toast,
        showToast,
        reportUnavailable,
        confirmResolution,
        resetToSeed,
        syncWithBackend,
        isStaffLoggedIn,
        loginStaff,
        logoutStaff,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
