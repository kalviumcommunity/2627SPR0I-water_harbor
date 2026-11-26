import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  WATER_POINT_TYPE_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  formatWaterPointType,
  formatLocationPath,
  filterWaterPointsStructured,
} from '../src/lib/locationFilters.js';
import { getReportPhotoUrl } from '../src/lib/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '../src');

test('structured location and category filters filter hierarchical water points accurately', () => {
  const campusLocations = [
    { id: 1, parent_id: null, location_type: 'campus', name: 'Main Campus', is_active: true },
    { id: 2, parent_id: 1, location_type: 'block', name: 'Block A', is_active: true },
    { id: 3, parent_id: 2, location_type: 'floor', name: 'Floor 1', is_active: true },
    { id: 4, parent_id: 3, location_type: 'indoor_area', name: 'East Wing', is_active: true },
    { id: 5, parent_id: 1, location_type: 'facility', name: 'Sports Complex', is_active: true },
  ];

  const waterPoints = [
    {
      id: 10,
      name: 'East Cooler',
      location: 'Near Lab 101',
      building: 'Block A',
      type: 'water_cooler',
      campus_location_id: 4,
      location_path: [
        { id: 1, name: 'Main Campus', location_type: 'campus' },
        { id: 2, name: 'Block A', location_type: 'block' },
        { id: 3, name: 'Floor 1', location_type: 'floor' },
        { id: 4, name: 'East Wing', location_type: 'indoor_area' },
      ],
      is_active: true,
    },
    {
      id: 11,
      name: 'Sports Purifier',
      location: 'Lobby',
      building: 'Sports Complex',
      type: 'purifier',
      campus_location_id: 5,
      location_path: [
        { id: 1, name: 'Main Campus', location_type: 'campus' },
        { id: 5, name: 'Sports Complex', location_type: 'facility' },
      ],
      is_active: true,
    },
    {
      id: 12,
      name: 'Deactivated Tap',
      location: 'Old Yard',
      building: 'Sports Complex',
      type: 'tap',
      campus_location_id: 5,
      is_active: false,
    },
  ];

  // Active-only excludes deactivated station
  const activeOnly = filterWaterPointsStructured({ waterPoints, campusLocations });
  assert.deepEqual(activeOnly.map((w) => w.id), [10, 11]);

  // Filter by block (ancestor of indoor_area #4)
  const inBlockA = filterWaterPointsStructured({
    waterPoints,
    campusLocations,
    selectedBlockId: '2',
  });
  assert.deepEqual(inBlockA.map((w) => w.id), [10]);

  // Filter by standalone facility
  const inSports = filterWaterPointsStructured({
    waterPoints,
    campusLocations,
    selectedBuildingId: '5',
  });
  assert.deepEqual(inSports.map((w) => w.id), [11]);

  // Filter by category/type
  const purifiers = filterWaterPointsStructured({
    waterPoints,
    campusLocations,
    selectedType: 'purifier',
  });
  assert.deepEqual(purifiers.map((w) => w.id), [11]);

  // Formatting helpers
  assert.equal(formatWaterPointType('water_cooler'), 'Water Cooler');
  assert.equal(formatLocationPath(waterPoints[0]), 'Main Campus › Block A › Floor 1 › East Wing');
  assert.equal(WATER_POINT_TYPE_OPTIONS.length >= 6, true);
  assert.equal(LOCATION_TYPE_OPTIONS.length, 7);
});

test('getReportPhotoUrl resolves relative API photo paths safely', () => {
  assert.equal(getReportPhotoUrl(null), null);
  assert.equal(
    getReportPhotoUrl('/api/reports/7/photo').endsWith('/api/reports/7/photo'),
    true
  );
});

test('Phase B UI components preserve security boundaries and have no demo credentials', () => {
  const files = [
    'pages/DirectoryPage.jsx',
    'pages/ReportPage.jsx',
    'pages/StaffDashboard.jsx',
    'components/WaterPointCard.jsx',
    'components/staff/WaterPointManager.jsx',
    'components/staff/CampusLocationManager.jsx',
    'context/AppContext.jsx',
    'lib/api.js',
  ];

  for (const rel of files) {
    const content = fs.readFileSync(path.join(srcDir, rel), 'utf8');
    assert.equal(content.includes('campus-staff-key-2026'), false, `${rel} must not contain demo key`);
    assert.equal(/\blocalStorage\s*\./.test(content), false, `${rel} must not use localStorage`);
    assert.equal(content.includes('X-Staff-Key'), false, `${rel} must not use legacy X-Staff-Key`);
  }

  const staffDash = fs.readFileSync(path.join(srcDir, 'pages/StaffDashboard.jsx'), 'utf8');
  assert.equal(staffDash.includes('WaterPointManager'), true);
  assert.equal(staffDash.includes('CampusLocationManager'), true);
  assert.equal(staffDash.includes('claimReportAction'), true);
  assert.equal(staffDash.includes('getReportPhotoUrl'), true);
  assert.equal(staffDash.includes('isAssignedToMe'), true);

  const card = fs.readFileSync(path.join(srcDir, 'components/WaterPointCard.jsx'), 'utf8');
  assert.equal(card.includes("I've noticed this too"), true);
  // Student-facing card must not render private report photos or photo URLs
  assert.equal(card.includes('getReportPhotoUrl'), false);
  assert.equal(card.includes('photo_url'), false);
  assert.equal(card.includes('<img'), false);

  const reportPage = fs.readFileSync(path.join(srcDir, 'pages/ReportPage.jsx'), 'utf8');
  assert.equal(reportPage.includes('type="file"'), true);
  assert.equal(reportPage.includes('Optional: only authenticated facilities staff can view submitted photos'), true);
  assert.equal(reportPage.includes('faces or personal information'), true);
});
