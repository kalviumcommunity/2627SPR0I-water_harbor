import { useState } from 'react';
import Alert from '../common/Alert';
import { validateLoginForm } from '../../utils/validators';

export function StaffLoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const { isValid, errors } = validateLoginForm({ email, password });
    if (!isValid) {
      setError(Object.values(errors)[0]);
      return;
    }

    setSubmitting(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 420,
        margin: '40px auto',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--slate-200)',
        padding: '32px 24px',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔐</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy-900)' }}>
          Facilities Staff Login
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: 4 }}>
          Access unresolved dispenser reports and record resolutions
        </p>
      </div>

      {error && <Alert type="error" onClose={() => setError(null)}>{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="staff-email"
            style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: 6 }}
          >
            Staff Email or ID
          </label>
          <input
            id="staff-email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your staff email"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--slate-300)',
              fontSize: '0.9rem',
            }}
            disabled={submitting}
            required
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            htmlFor="staff-password"
            style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: 6 }}
          >
            Password
          </label>
          <input
            id="staff-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--slate-300)',
              fontSize: '0.9rem',
            }}
            disabled={submitting}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', padding: '10px' }}
          disabled={submitting}
        >
          {submitting ? 'Authenticating...' : 'Sign In as Staff'}
        </button>
      </form>
    </div>
  );
}

export default StaffLoginForm;
