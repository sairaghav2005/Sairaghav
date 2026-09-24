import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({ username: 'admin', is_active: true });
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const autoLogin = async () => {
      let token = localStorage.getItem('token');
      if (!token) {
        try {
          const params = new URLSearchParams();
          params.append('username', 'admin');
          params.append('password', 'admin123');
          const res = await api.post('/auth/login', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });
          token = res.data.access_token;
          localStorage.setItem('token', token);
        } catch (err) {
          console.error('Auto-login error:', err);
        }
      }

      if (token) {
        try {
          const userRes = await api.get('/auth/me');
          setUser(userRes.data);
        } catch (err) {
          // If token expired, get new token
          try {
            const params = new URLSearchParams();
            params.append('username', 'admin');
            params.append('password', 'admin123');
            const res = await api.post('/auth/login', params, {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            localStorage.setItem('token', res.data.access_token);
            const userRes = await api.get('/auth/me');
            setUser(userRes.data);
          } catch (e) {
            console.error('Auto-login refresh failed', e);
          }
        }
      }

      setIsAuthenticated(true);
      setLoading(false);
    };

    autoLogin();
  }, []);

  const login = async (username, password) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const res = await api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    localStorage.setItem('token', res.data.access_token);
    setUser({ username, is_active: true });
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Keep user logged in automatically
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: true, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
