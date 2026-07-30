import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

// A previous session can leave localStorage in a bad state (e.g. a failed
// login writing the literal string "undefined"). Parsing that with
// JSON.parse throws and — since this runs inside a useState initializer at
// the very top of the component tree — crashes the entire app before
// anything can render. Guard against that here.
function readStoredUser() {
  const raw = localStorage.getItem('wihg_user');
  if (!raw || raw === 'undefined' || raw === 'null') return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('wihg_user');
    localStorage.removeItem('wihg_token');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (!data?.user || !data?.token) throw new Error('Unexpected response from server.');
    localStorage.setItem('wihg_token', data.token);
    localStorage.setItem('wihg_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    if (!data?.user || !data?.token) throw new Error('Unexpected response from server.');
    localStorage.setItem('wihg_token', data.token);
    localStorage.setItem('wihg_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('wihg_token');
    localStorage.removeItem('wihg_user');
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
