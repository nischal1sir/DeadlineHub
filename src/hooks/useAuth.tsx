import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';
import { supabase } from '../lib/supabaseClient';

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
  setSessionUser: (user: UserProfile, token: string) => void;
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

  const setSessionUser = (userProfile: UserProfile, token: string) => {
    localStorage.setItem('tracker_jwt', token);
    localStorage.setItem('tracker_auth_user', JSON.stringify(userProfile));
    setUser(userProfile);
  };

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      let resUser: any = null;
      try {
        resUser = await apiClient.login(email, pass);
      } catch (backendErr: any) {
        // Fallback to direct Supabase Auth client login if backend server is unreachable or throwing 5xx
        const isConnErr = !backendErr.status || backendErr.message?.includes('Cannot connect') ||
                          backendErr.message?.includes('Failed to fetch') || backendErr.message?.includes('fetch') ||
                          backendErr.message?.includes('NetworkError') || backendErr.status >= 500;

        if (isConnErr) {
          const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: pass
          });

          if (authErr) {
            if (authErr.message.includes('Invalid login credentials')) {
              throw new Error('Invalid email or password. Please check your credentials and try again.');
            }
            if (authErr.message.includes('Failed to fetch') || authErr.name === 'TypeError') {
              throw new Error('Unable to connect to authentication server. Please check your network connection.');
            }
            throw new Error(authErr.message || 'Login failed.');
          }

          if (authData.user) {
            const { data: dbProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authData.user.id)
              .maybeSingle();

            if (dbProfile) {
              if (dbProfile.status === 'inactive') {
                await supabase.auth.signOut();
                throw new Error('Your account is currently inactive. Please contact an administrator.');
              }
              resUser = dbProfile;
            } else {
              const cleanEmail = email.trim().toLowerCase();
              const fullName = authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || cleanEmail.split('@')[0];
              const newProf = {
                id: authData.user.id,
                email: authData.user.email || email,
                full_name: fullName,
                avatar_url: authData.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanEmail}`,
                role: 'user' as const,
                status: 'active' as const,
                timezone: 'UTC',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              await supabase.from('profiles').upsert(newProf, { onConflict: 'id' });
              resUser = newProf;
            }

            setSessionUser(resUser, authData.session?.access_token || '');
            return;
          }
        }
        throw backendErr;
      }

      setUser(resUser);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pass: string, name: string, phone?: string) => {
    setLoading(true);
    try {
      let resUser = null;
      try {
        resUser = await apiClient.register(email, pass, name, phone);
      } catch (backendErr: any) {
        const isConnErr = !backendErr.status || backendErr.message?.includes('Cannot connect') ||
                          backendErr.message?.includes('Failed to fetch') || backendErr.message?.includes('fetch') ||
                          backendErr.message?.includes('NetworkError') || backendErr.status >= 500;

        if (isConnErr) {
          const { data: authData, error: authErr } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password: pass,
            options: {
              data: {
                full_name: name,
                phone: phone || ''
              }
            }
          });

          if (authErr) {
            if (authErr.message.includes('already registered') || authErr.message.includes('already exists')) {
              throw new Error('An account with this email address already exists. Please sign in instead.');
            }
            throw new Error(authErr.message || 'Registration failed.');
          }

          if (authData.user && (!authData.user.identities || authData.user.identities.length === 0)) {
            throw new Error('An account with this email address already exists. Please sign in instead.');
          }

          if (authData.user) {
            const newProf = {
              id: authData.user.id,
              email: authData.user.email || email,
              full_name: name,
              avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`,
              role: 'user' as const,
              status: 'active' as const,
              timezone: 'UTC',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            await supabase.from('profiles').upsert(newProf, { onConflict: 'id' });
            resUser = newProf;

            if (authData.session) {
              setSessionUser(resUser, authData.session.access_token);
            } else {
              setUser(resUser);
            }
            return;
          }
        }
        throw backendErr;
      }
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
    try {
      const updated = await apiClient.updateProfile({
        full_name: name,
        timezone,
        avatar_url: avatarUrl
      });
      setUser(updated);
    } catch (backendErr: any) {
      // Fallback: Direct Supabase DB update if Express backend server is offline
      if (user?.id) {
        const updates: any = {
          full_name: name,
          timezone: timezone || 'UTC',
          updated_at: new Date().toISOString()
        };
        if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

        const { data: updatedProfile, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
          .select()
          .maybeSingle();

        if (error) throw new Error(error.message || 'Failed to update profile');

        const newUser = { ...user, ...updates, ...(updatedProfile || {}) };
        localStorage.setItem('tracker_auth_user', JSON.stringify(newUser));
        setUser(newUser);
        return;
      }
      throw backendErr;
    }
  };

  const updateAvatar = async (file: Blob) => {
    try {
      const updated = await apiClient.uploadAvatar(file);
      setUser(updated);
    } catch (err) {
      // Fallback to Supabase Storage or Base64 Data URL if backend endpoint fails
      try {
        if (user?.id) {
          const fileName = `${user.id}-${Date.now()}.png`;
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, { contentType: 'image/png', upsert: true });

          if (!uploadErr && uploadData?.path) {
            const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
            if (publicUrlData?.publicUrl) {
              await updateProfile(user.full_name, user.timezone || 'UTC', publicUrlData.publicUrl);
              return;
            }
          }
        }
      } catch (storageErr) {
        // Fallthrough to Base64
      }

      // Base64 Data URL fallback
      const base64Url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await updateProfile(user?.full_name || '', user?.timezone || 'UTC', base64Url);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setSessionUser, login, register, logout, forgotPassword, resetPassword, updateProfile, updateAvatar }}>
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
