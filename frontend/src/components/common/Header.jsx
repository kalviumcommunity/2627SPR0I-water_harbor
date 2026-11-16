import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { APP_CONFIG } from '../../utils/constants';

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <NavLink to="/" className="brand-wrapper">
          <div className="brand-icon">💧</div>
          <div>
            <div className="brand-title">{APP_CONFIG.APP_TITLE}</div>
            <div className="brand-subtitle">{APP_CONFIG.UNIVERSITY_NAME}</div>
          </div>
        </NavLink>

        <nav className="nav-links">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
            end
          >
            Water Points Board
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink
                to="/staff/dashboard"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                Facilities Dashboard
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title={`Signed in as ${user?.name || 'Staff'}`}
              >
                Staff Logout
              </button>
            </>
          ) : (
            <NavLink
              to="/staff/login"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              Facilities Staff Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
