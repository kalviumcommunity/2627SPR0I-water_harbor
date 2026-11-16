import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import StaffLoginForm from '../../components/staff/StaffLoginForm';

export function StaffLoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { notifySuccess } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/staff/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleLogin = async (email, password) => {
    const user = await login(email, password);
    notifySuccess(`Welcome, ${user.name}!`);
    navigate(from, { replace: true });
  };

  return (
    <div>
      <StaffLoginForm onLogin={handleLogin} />
    </div>
  );
}

export default StaffLoginPage;
