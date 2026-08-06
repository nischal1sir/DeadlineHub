import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin' | 'super_admin';
  status?: 'active' | 'inactive';
  avatar_url: string;
  timezone: string;
  created_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  updateProfile: (name: string, timezone: string, avatarUrl?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = () => {
      try {
        const stored = localStorage.getItem('tracker_auth_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.status === 'inactive') {
            localStorage.removeItem('tracker_auth_user');
            localStorage.removeItem('tracker_jwt');
            setUser(null);
          } else {
            setUser(parsed);
          }
        }
      } catch (err) {
        console.error('Failed reading user session', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const resUser = await apiClient.login(email, pass);
      setUser(resUser);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const resUser = await apiClient.register(email, pass, name);
      setUser(resUser);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiClient.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    await apiClient.forgotPassword(email);
  };

  const resetPassword = async (password: string) => {
    await apiClient.resetPassword(password);
  };

  const updateProfile = async (name: string, timezone: string, avatarUrl?: string) => {
    const updated = await apiClient.updateProfile({
      full_name: name,
      timezone,
      avatar_url: avatarUrl
    });
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, forgotPassword, resetPassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be called inside an AuthProvider component');
  }
  return context;
};
