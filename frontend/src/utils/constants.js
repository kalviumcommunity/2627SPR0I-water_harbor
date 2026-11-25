/**
 * Campus WaterPoint Board - Application Constants
 * Campus: CHRIST (Deemed to be University), Bengaluru
 */

export const APP_CONFIG = {
  UNIVERSITY_NAME: 'CHRIST (Deemed to be University)',
  CAMPUS_NAME: 'Bangalore Central Campus',
  APP_TITLE: 'Campus WaterPoint Board',
  SPRINT: '2627SPR0I',
  DISCLAIMER:
    'Human-reported status board for campus dispensers. This system does not use IoT sensors or provide real-time sensor verification.',
};

export const REPORT_STATUS = {
  REPORTED_UNAVAILABLE: 'reported_unavailable',
  STAFF_CONFIRMED_RESOLVED: 'staff_confirmed_resolved',
};

export const DISPLAY_STATUS = {
  UNAVAILABLE: 'Reported Unavailable',
  RESOLVED: 'Staff-Confirmed Resolved',
  UNKNOWN: 'No Recent Report / Unknown',
};

export const STATUS_COLORS = {
  [REPORT_STATUS.REPORTED_UNAVAILABLE]: {
    bg: '#fef2f2',
    text: '#991b1b',
    border: '#fca5a5',
    badge: 'badge-unavailable',
  },
  [REPORT_STATUS.STAFF_CONFIRMED_RESOLVED]: {
    bg: '#f0fdf4',
    text: '#166534',
    border: '#86efac',
    badge: 'badge-resolved',
  },
  unknown: {
    bg: '#f8fafc',
    text: '#475569',
    border: '#cbd5e1',
    badge: 'badge-unknown',
  },
};
