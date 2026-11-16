import { APP_CONFIG } from '../../utils/constants';

export function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <p style={{ fontWeight: 600, color: 'var(--slate-700)', marginBottom: 4 }}>
          {APP_CONFIG.UNIVERSITY_NAME} — {APP_CONFIG.CAMPUS_NAME}
        </p>
        <p style={{ maxWidth: 700, margin: '0 auto', fontSize: '0.8rem', color: 'var(--slate-500)' }}>
          {APP_CONFIG.DISCLAIMER}
        </p>
        <p style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--slate-400)' }}>
          Sprint {APP_CONFIG.SPRINT} | Campus WaterPoint Board
        </p>
      </div>
    </footer>
  );
}

export default Footer;
