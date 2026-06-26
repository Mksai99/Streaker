import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('streakify_dark') === 'true');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('streakify_dark', darkMode);
  }, [darkMode]);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('streakify_token');
    if (!token) { setLoading(false); return; }
    try {
      const res = await authApi.getProfile();
      setUser(res.data);
    } catch {
      localStorage.removeItem('streakify_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const loginWithEmail = async ({ email, password, role }) => {
    const res = await authApi.login({ email, password, role });
    localStorage.setItem('streakify_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const registerWithEmail = async ({ email, password, displayName, role }) => {
    const res = await authApi.register({ email, password, displayName, role });
    localStorage.setItem('streakify_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const loginWithGoogle = async ({ uid, email, displayName, avatar, role }) => {
    const res = await authApi.googleLogin({ uid, email, displayName, avatar, role });
    localStorage.setItem('streakify_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('streakify_token');
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithEmail, registerWithEmail, loginWithGoogle, logout, updateUser, darkMode, toggleDarkMode, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
