import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_PROFILES = [
  { role: 'station_admin', username: 'admin', name: 'Dr. R. K. Sharma', title: 'Station Expedition Commander', station: 'Maitri' },
  { role: 'logistics_officer', username: 'logistics', name: 'Lt. Col. Vikram Sen', title: 'Chief Logistics & Supply Officer', station: 'Maitri' },
  { role: 'expedition_officer', username: 'expedition', name: 'Dr. Sunita Rao', title: 'Scientific Traverse Leader', station: 'Bharati' },
  { role: 'maintenance_officer', username: 'maintenance', name: 'Er. A. K. Verma', title: 'Senior Station Engineer', station: 'Maitri' },
  { role: 'emergency_coordinator', username: 'emergency', name: 'Dr. M. S. Gill', title: 'Medical & Disaster Response Head', station: 'All Bases' }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('polar_token'));
  const [tokenClaims, setTokenClaims] = useState(null);
  const [loading, setLoading] = useState(true);

  // Decode JWT payload helper
  const parseJwt = (t) => {
    try {
      const base64Url = t.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('polar_token');
      if (storedToken) {
        try {
          const res = await api.verifyAuth();
          if (res.status === 'valid') {
            setUser(res.user);
            setToken(storedToken);
            setTokenClaims(parseJwt(storedToken));
          } else {
            logout();
          }
        } catch {
          // If backend offline, rely on claims
          const claims = parseJwt(storedToken);
          if (claims) {
            setUser({
              id: claims.sub,
              username: claims.username,
              role: claims.role,
              name: claims.name,
              station: claims.station,
              permissions: claims.permissions || []
            });
            setTokenClaims(claims);
          }
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.login({ username, password });
      if (res.token) {
        localStorage.setItem('polar_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setTokenClaims(parseJwt(res.token));
        return { success: true };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.register(userData);
      if (res.token) {
        localStorage.setItem('polar_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setTokenClaims(parseJwt(res.token));
        return { success: true };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const loginAsDemo = async (roleName) => {
    const profile = DEMO_PROFILES.find((p) => p.role === roleName) || DEMO_PROFILES[0];
    return await login(profile.username, 'polar2026');
  };

  const logout = () => {
    localStorage.removeItem('polar_token');
    setToken(null);
    setUser(null);
    setTokenClaims(null);
  };

  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes('*') || user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tokenClaims,
        loading,
        login,
        register,
        loginAsDemo,
        logout,
        hasPermission,
        demoProfiles: DEMO_PROFILES
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
