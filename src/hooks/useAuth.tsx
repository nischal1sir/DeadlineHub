import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
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
  register: (email: string, pass: string, name: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  updateProfile: (name: string, timezone: string, avatarUrl?: string) => Promise<void>;
  updateAvatar: (blob: Blob) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedUser = localStorage.getItem('tracker_auth_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {}
        }

        const refreshed = await apiClient.tryRefreshSession();
        if (refreshed?.user) {
          if (refreshed.user.status === 'inactive') {
            await apiClient.logout();
            setUser(null);
          } else {
            setUser(refreshed.user);
          }
        } else if (!storedUser) {
          setUser(null);
        }
      } catch (err) {
        // Keep existing session if offline or network error
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
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

  const register = async (email: string, pass: string, name: string, phone?: string) => {
    setLoading(true);
    try {
      const resUser = await apiClient.register(email, pass, name, phone);
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

  const updateAvatar = async (file: Blob) => {
    try {
      const updated = await apiClient.uploadAvatar(file);
      setUser(updated);
    } catch (err) {
      // Fallback to base64 Data URL if multipart upload endpoint fails
      const base64Url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const updated = await apiClient.updateProfile({
        full_name: user?.full_name || '',
        timezone: user?.timezone || 'UTC',
        avatar_url: base64Url
      });
      setUser(updated);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, forgotPassword, resetPassword, updateProfile, updateAvatar }}>
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
