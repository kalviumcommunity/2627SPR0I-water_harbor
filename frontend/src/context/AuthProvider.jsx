import { useState } from 'react';
import { AuthContext } from './AuthContext';
import authService from '../services/authService';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser());

  const login = async (email, password) => {
    const staffUser = await authService.login(email, password);
    setUser(staffUser);
    return staffUser;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        loading: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
