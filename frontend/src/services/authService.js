import { DEMO_STAFF_CREDENTIALS } from '../utils/constants';

const STORAGE_KEY = 'waterpoint_staff_session';

export const authService = {
  /**
   * Demo facilities staff login.
   * Compares against demo credentials or valid facilities login format.
   */
  async login(email, password) {
    const trimmedEmail = (email || '').trim().toLowerCase();
    const demoEmail = DEMO_STAFF_CREDENTIALS.email.toLowerCase();

    // Check credentials against demo account or staff format
    if (
      (trimmedEmail === demoEmail && password === DEMO_STAFF_CREDENTIALS.password) ||
      (trimmedEmail.includes('facilities') && password.length >= 6)
    ) {
      const user = {
        email: trimmedEmail,
        name: DEMO_STAFF_CREDENTIALS.name,
        role: DEMO_STAFF_CREDENTIALS.role,
        token: `demo-staff-token-${Date.now()}`,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return user;
    }

    throw new Error('Invalid facilities credentials. Check your email and password.');
  },

  logout() {
    localStorage.removeItem(STORAGE_KEY);
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};

export default authService;
