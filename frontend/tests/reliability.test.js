import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { initialSeedWaterPoints, initialSeedReports } from '../src/data/seedData.js';
import {
  STAFF_REFRESH_INTERVAL_MS,
  formatBackendError,
  executeSingleFlight,
  executeKeyedSingleFlight,
  fetchDashboardData,
  performStaffLogout,
  startDashboardPolling,
} from '../src/lib/reliability.js';
import { setCsrfToken, getCsrfToken, staffLogout } from '../src/lib/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '../src');

test('seedData contains no fictional water points or reports', () => {
  assert.deepEqual(initialSeedWaterPoints, []);
  assert.deepEqual(initialSeedReports, []);
});

test('AppContext does not import seedData or use localStorage fallback', () => {
  const appContextSource = fs.readFileSync(
    path.join(srcDir, 'context/AppContext.jsx'),
    'utf8'
  );
  assert.equal(appContextSource.includes('seedData'), false);
  assert.equal(appContextSource.includes('localStorage'), false);
  assert.equal(appContextSource.includes('isFallback'), false);
});

test('AppContext safely handles staff logout, session restoration, and 401 expiry', () => {
  const appContextSource = fs.readFileSync(
    path.join(srcDir, 'context/AppContext.jsx'),
    'utf8'
  );
  // Must not silently fall back to public fetchReports when fetchStaffReports fails
  assert.equal(appContextSource.includes('fetchStaffReports().catch'), false);
  // Must wait for initial session check before loading data
  assert.equal(appContextSource.includes('if (!staffAuthLoading)'), true);
  // Must handle 401 by clearing staff session and CSRF token
  assert.equal(appContextSource.includes('err?.response?.status === 401'), true);
  // Must use performStaffLogout instead of clearing session in finally
  assert.equal(appContextSource.includes('performStaffLogout'), true);
});

test('frontend files do not expose hardcoded demo credentials or keys', () => {
  const filesToCheck = [
    'pages/StaffDashboard.jsx',
    'components/Navbar.jsx',
    'components/RepairDialog.jsx',
    'components/staff/StaffLoginForm.jsx',
    'utils/constants.js',
    'lib/api.js',
  ];

  for (const relPath of filesToCheck) {
    const fullPath = path.join(srcDir, relPath);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');

    assert.equal(
      content.includes('campus-staff-key-2026'),
      false,
      `${relPath} must not contain campus-staff-key-2026`
    );
    assert.equal(
      content.includes('qwerth'),
      false,
      `${relPath} must not contain qwerth`
    );
    assert.equal(
      content.includes('Password123!'),
      false,
      `${relPath} must not contain Password123!`
    );
    assert.equal(
      content.includes('X-Staff-Key'),
      false,
      `${relPath} must not use legacy X-Staff-Key`
    );
    assert.equal(
      content.includes("sessionStorage.getItem('staff_access_key')"),
      false,
      `${relPath} must not store access key in sessionStorage`
    );
  }
});

test('in-memory CSRF token getter and setter operate correctly', () => {
  assert.equal(getCsrfToken(), null);
  setCsrfToken('test-csrf-token-xyz');
  assert.equal(getCsrfToken(), 'test-csrf-token-xyz');
  setCsrfToken(null);
  assert.equal(getCsrfToken(), null);
});

test('staffLogout retains CSRF token when backend request fails and clears on success', async () => {
  setCsrfToken('active-csrf-token');

  const failingClient = {
    async post() {
      throw new Error('Network Error');
    },
  };

  await assert.rejects(() => staffLogout(failingClient), /Network Error/);
  assert.equal(getCsrfToken(), 'active-csrf-token');

  const succeedingClient = {
    async post(url) {
      assert.equal(url, '/api/staff/logout');
      return { data: { message: 'Signed out successfully.' } };
    },
  };

  const res = await staffLogout(succeedingClient);
  assert.equal(res.message, 'Signed out successfully.');
  assert.equal(getCsrfToken(), null);
});

test('performStaffLogout retains session on failure and clears only on confirmed logout', async () => {
  let session = { authenticated: true, staff: { display_name: 'Staff' } };
  let errorNotified = null;

  await assert.rejects(
    () =>
      performStaffLogout({
        apiStaffLogout: async () => {
          throw new Error('Server unreachable');
        },
        onSuccess: () => {
          session = null;
        },
        onError: (err) => {
          errorNotified = formatBackendError(err, 'logout');
        },
      }),
    /Server unreachable/
  );

  assert.notEqual(session, null);
  assert.match(errorNotified, /logout failed.*still active/i);

  const result = await performStaffLogout({
    apiStaffLogout: async () => ({ message: 'Signed out' }),
    onSuccess: () => {
      session = null;
    },
    onError: () => {
      assert.fail('onError should not be called on success');
    },
  });

  assert.equal(result.ok, true);
  assert.equal(session, null);
});

test('fetchDashboardData does not fall back to public reports when authenticated staff request fails', async () => {
  let publicReportsCalled = 0;

  await assert.rejects(
    () =>
      fetchDashboardData({
        isAuthenticated: true,
        fetchWaterPoints: async () => [{ id: 1, name: 'WP 1' }],
        fetchReports: async () => {
          publicReportsCalled += 1;
          return [];
        },
        fetchStaffReports: async () => {
          const err = new Error('Server Error');
          err.response = { status: 500, data: { detail: 'Database error' } };
          throw err;
        },
      }),
    /Server Error/
  );

  assert.equal(publicReportsCalled, 0);

  const staffResult = await fetchDashboardData({
    isAuthenticated: true,
    fetchWaterPoints: async () => [{ id: 1, name: 'WP 1' }],
    fetchReports: async () => {
      publicReportsCalled += 1;
      return [];
    },
    fetchStaffReports: async () => [{ id: 10, resolved_by: 'Staff Officer' }],
  });

  assert.equal(publicReportsCalled, 0);
  assert.equal(staffResult.reports[0].resolved_by, 'Staff Officer');
});

test('executeKeyedSingleFlight deduplicates same-key calls but allows authenticated refresh to supersede public', async () => {
  const inFlightRef = { current: null };
  let resolvePublic;
  let publicCalls = 0;
  let staffCalls = 0;

  const publicPromise1 = executeKeyedSingleFlight(
    inFlightRef,
    { key: 'public', force: false },
    () =>
      new Promise((resolve) => {
        publicCalls += 1;
        resolvePublic = resolve;
      })
  );

  const publicPromise2 = executeKeyedSingleFlight(
    inFlightRef,
    { key: 'public', force: false },
    () => {
      publicCalls += 1;
      return Promise.resolve('should-not-run');
    }
  );

  assert.equal(publicPromise1, publicPromise2);
  await Promise.resolve();
  assert.equal(publicCalls, 1);

  // An authenticated refresh must NOT be suppressed by an in-flight public refresh
  const staffPromise = executeKeyedSingleFlight(
    inFlightRef,
    { key: 'staff', force: false },
    async () => {
      staffCalls += 1;
      return 'staff-reports';
    }
  );

  assert.notEqual(staffPromise, publicPromise1);
  assert.equal(await staffPromise, 'staff-reports');
  assert.equal(staffCalls, 1);

  resolvePublic('stale-public');
  assert.equal(await publicPromise1, 'stale-public');
  assert.equal(inFlightRef.current, null);
});

test('formatBackendError reports clear offline errors without claiming success', () => {
  const networkError = new Error('Network Error');

  assert.match(formatBackendError(networkError, 'load'), /unable to reach the backend server/i);
  assert.match(formatBackendError(networkError, 'submit'), /your report was not saved/i);
  assert.match(formatBackendError(networkError, 'resolve'), /resolution was not saved/i);
  assert.match(formatBackendError(networkError, 'logout'), /logout failed.*still active/i);

  const authError = { response: { status: 401, data: {} } };
  assert.match(formatBackendError(authError, 'resolve'), /authorization failed/i);

  const apiDetailError = { response: { status: 503, data: { detail: 'Database unavailable' } } };
  assert.equal(formatBackendError(apiDetailError, 'load'), 'Database unavailable');
});

test('executeSingleFlight prevents overlapping requests and recovers after completion or failure', async () => {
  const inFlightRef = { current: null };
  let callCount = 0;
  let resolveFirst;

  const firstPromise = executeSingleFlight(
    inFlightRef,
    () =>
      new Promise((resolve) => {
        callCount += 1;
        resolveFirst = resolve;
      })
  );

  const overlappingPromise = executeSingleFlight(inFlightRef, () => {
    callCount += 1;
    return Promise.resolve('should-not-run');
  });

  assert.equal(overlappingPromise, firstPromise);

  await Promise.resolve();
  assert.equal(callCount, 1);

  resolveFirst('first-result');
  assert.equal(await firstPromise, 'first-result');
  assert.equal(inFlightRef.current, null);

  // Subsequent failed call clears in-flight state so a retry can run
  await assert.rejects(
    () =>
      executeSingleFlight(inFlightRef, () => {
        callCount += 1;
        return Promise.reject(new Error('backend down'));
      }),
    /backend down/
  );
  assert.equal(inFlightRef.current, null);

  const retryResult = await executeSingleFlight(inFlightRef, () => {
    callCount += 1;
    return Promise.resolve('recovered');
  });
  assert.equal(retryResult, 'recovered');
  assert.equal(callCount, 3);
});

test('startDashboardPolling polls at 30s and cleans up on unmount', () => {
  assert.equal(STAFF_REFRESH_INTERVAL_MS, 30000);

  let registeredFn = null;
  let registeredDelay = null;
  let clearedId = null;
  const fakeTimerId = 42;

  const fakeTimers = {
    setInterval(fn, delay) {
      registeredFn = fn;
      registeredDelay = delay;
      return fakeTimerId;
    },
    clearInterval(id) {
      clearedId = id;
    },
  };

  let ticks = 0;
  const stopPolling = startDashboardPolling(
    () => {
      ticks += 1;
    },
    STAFF_REFRESH_INTERVAL_MS,
    fakeTimers
  );

  assert.equal(registeredDelay, 30000);
  registeredFn();
  registeredFn();
  assert.equal(ticks, 2);

  // Simulate component unmount cleanup
  stopPolling();
  assert.equal(clearedId, fakeTimerId);

  // Late callback after unmount must not invoke refresh
  registeredFn();
  assert.equal(ticks, 2);
});
