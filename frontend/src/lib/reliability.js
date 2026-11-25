export const STAFF_REFRESH_INTERVAL_MS = 30000;

/**
 * Formats API/network errors into clear user-facing messages without
 * claiming success or masking backend unavailability.
 */
export function formatBackendError(err, action = 'load') {
  if (action === 'logout') {
    const detail = err?.response?.data?.detail;
    if (!err?.response) {
      return 'Unable to reach the backend server. Logout failed and your staff session is still active.';
    }
    if (typeof detail === 'string' && detail.trim()) {
      return `Logout failed: ${detail}`;
    }
    return 'Failed to sign out on the server. Your staff session is still active.';
  }

  if (err?.response?.status === 401) {
    return 'Staff authorization failed. Check your staff key.';
  }

  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (!err?.response) {
    if (action === 'submit') {
      return 'Unable to reach the backend server. Your report was not saved.';
    }
    if (action === 'resolve') {
      return 'Unable to reach the backend server. Resolution was not saved.';
    }
    return 'Unable to reach the backend server. Live data could not be loaded.';
  }

  if (action === 'submit') {
    return 'Failed to submit report. Please try again.';
  }
  if (action === 'resolve') {
    return 'Failed to resolve report. Please try again.';
  }
  return 'Failed to load data from the backend server.';
}

/**
 * Ensures at most one refresh request runs at a time by sharing the
 * active promise stored in `inFlightRef`.
 */
export function executeSingleFlight(inFlightRef, fn) {
  if (inFlightRef.current) {
    return inFlightRef.current;
  }

  const promise = Promise.resolve()
    .then(fn)
    .finally(() => {
      if (inFlightRef.current === promise) {
        inFlightRef.current = null;
      }
    });

  inFlightRef.current = promise;
  return promise;
}

/**
 * Keyed single-flight coordinator: deduplicates concurrent requests only when
 * `key` matches and `force` is false. Allows an authenticated refresh to
 * supersede an in-flight unauthenticated refresh.
 */
export function executeKeyedSingleFlight(inFlightRef, { key, force = false }, fn) {
  const current = inFlightRef.current;
  if (current && !force && current.key === key) {
    return current.promise;
  }

  let entry;
  const promise = Promise.resolve()
    .then(fn)
    .finally(() => {
      if (inFlightRef.current === entry) {
        inFlightRef.current = null;
      }
    });

  entry = { key, promise };
  inFlightRef.current = entry;
  return promise;
}

/**
 * Fetches water points and either privileged staff reports (when authenticated)
 * or public reports. Never falls back to public reports when an authenticated
 * staff request fails.
 */
export async function fetchDashboardData({
  isAuthenticated,
  fetchWaterPoints,
  fetchReports,
  fetchStaffReports,
}) {
  const reportsPromise = isAuthenticated ? fetchStaffReports() : fetchReports();
  const [waterPoints, reports] = await Promise.all([
    fetchWaterPoints(),
    reportsPromise,
  ]);
  return { waterPoints, reports };
}

/**
 * Executes server-side logout and runs `onSuccess` only after the backend
 * confirms logout succeeded. On failure, retains session state and invokes `onError`.
 */
export async function performStaffLogout({ apiStaffLogout, onSuccess, onError }) {
  try {
    const result = await apiStaffLogout();
    await onSuccess(result);
    return { ok: true, result };
  } catch (err) {
    onError?.(err);
    throw err;
  }
}

/**
 * Starts interval polling and returns an unmount cleanup function that
 * stops the interval and prevents further ticks.
 */
export function startDashboardPolling(
  onTick,
  intervalMs = STAFF_REFRESH_INTERVAL_MS,
  timers = globalThis
) {
  let active = true;
  const intervalId = timers.setInterval(() => {
    if (!active) {
      return;
    }
    void onTick();
  }, intervalMs);

  return () => {
    active = false;
    timers.clearInterval(intervalId);
  };
}
