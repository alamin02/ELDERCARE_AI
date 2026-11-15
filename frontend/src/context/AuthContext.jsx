import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('eldercare_token'));
  const [role, setRole] = useState(localStorage.getItem('eldercare_role'));
  const [elderlyId, setElderlyId] = useState(localStorage.getItem('eldercare_elderly_id'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          if (profile.elderly_id) {
            setElderlyId(profile.elderly_id);
            localStorage.setItem('eldercare_elderly_id', profile.elderly_id);
          }
        } catch (err) {
          console.error("Token verification failed:", err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = (authData) => {
    localStorage.setItem('eldercare_token', authData.access_token);
    localStorage.setItem('eldercare_role', authData.role);
    if (authData.elderly_id) {
      localStorage.setItem('eldercare_elderly_id', authData.elderly_id);
      setElderlyId(authData.elderly_id);
    } else {
      localStorage.removeItem('eldercare_elderly_id');
      setElderlyId(null);
    }
    setToken(authData.access_token);
    setRole(authData.role);
    setUser({
      id: authData.user_id,
      full_name: authData.full_name,
      role: authData.role,
      elderly_id: authData.elderly_id,
      preferred_language: authData.preferred_language || 'en'
    });
  };

  const logout = () => {
    localStorage.removeItem('eldercare_token');
    localStorage.removeItem('eldercare_role');
    localStorage.removeItem('eldercare_elderly_id');
    setToken(null);
    setRole(null);
    setElderlyId(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        elderlyId,
        setElderlyId,
        loading,
        login,
        logout,
        isAuthenticated: !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
