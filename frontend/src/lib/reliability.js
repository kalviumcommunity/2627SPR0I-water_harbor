export const STAFF_REFRESH_INTERVAL_MS = 30000;

/**
 * Formats API/network errors into clear user-facing messages without
 * claiming success or masking backend unavailability.
 */
export function formatBackendError(err, action = 'load') {
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
