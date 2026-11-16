import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { NotificationProvider } from './context/NotificationProvider';
import { useAuth } from './hooks/useAuth';
import MainLayout from './layouts/MainLayout';
import StudentDashboardPage from './pages/student/StudentDashboardPage';
import StaffLoginPage from './pages/staff/StaffLoginPage';
import StaffDashboardPage from './pages/staff/StaffDashboardPage';

/**
 * Route guard ensuring only authenticated facilities staff can access protected pages.
 */
function ProtectedStaffRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/staff/login" replace />;
  }

  return children;
}

/**
 * App component responsible solely for route composition and provider wrapping.
 */
export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              {/* Public Student Routes */}
              <Route index element={<StudentDashboardPage />} />

              {/* Staff Authentication */}
              <Route path="staff/login" element={<StaffLoginPage />} />

              {/* Protected Staff Dashboard */}
              <Route
                path="staff/dashboard"
                element={
                  <ProtectedStaffRoute>
                    <StaffDashboardPage />
                  </ProtectedStaffRoute>
                }
              />

              {/* Catch-all navigation fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
