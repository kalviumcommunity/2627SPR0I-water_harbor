import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useNotification } from '../hooks/useNotification';
import { APP_CONFIG } from '../utils/constants';

export function MainLayout() {
  const { notifications, dismissNotification } = useNotification();

  return (
    <div className="app-layout">
      <Header />

      <main className="main-content">
        <div className="disclaimer-banner" role="note">
          <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
          <span>{APP_CONFIG.DISCLAIMER}</span>
        </div>

        <Outlet />
      </main>

      <Footer />

      {/* Toast Notifications */}
      {notifications.length > 0 && (
        <div className="toast-container" aria-live="polite">
          {notifications.map((n) => (
            <div key={n.id} className={`toast toast-${n.type}`}>
              <span>{n.message}</span>
              <button
                type="button"
                onClick={() => dismissNotification(n.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  lineHeight: 1,
                }}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MainLayout;
