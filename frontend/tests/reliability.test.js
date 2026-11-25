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
  startDashboardPolling,
} from '../src/lib/reliability.js';

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

test('formatBackendError reports clear offline errors without claiming success', () => {
  const networkError = new Error('Network Error');

  assert.match(formatBackendError(networkError, 'load'), /unable to reach the backend server/i);
  assert.match(formatBackendError(networkError, 'submit'), /your report was not saved/i);
  assert.match(formatBackendError(networkError, 'resolve'), /resolution was not saved/i);

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
