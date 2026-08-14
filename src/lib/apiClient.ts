import { supabase } from './supabaseClient';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ActivityLog {
  id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  action: string;
  category: 'auth' | 'user' | 'project' | 'task' | 'admin' | 'system';
  details: string;
  created_at: string;
}

export interface AdminNotification {
  id: string;
  user_id?: string;
  user_name: string;
  user_email: string;
  user_avatar?: string | null;
  action: string;
  category: 'auth' | 'user' | 'project' | 'task' | 'admin' | 'system';
  details: string;
  created_at: string;
  is_read: boolean;
  is_cleared: boolean;
}

// ── Token helpers ─────────────────────────────────────────────────────────────
const getAccessToken  = () => localStorage.getItem('tracker_jwt');
const setAccessToken  = (t: string) => localStorage.setItem('tracker_jwt', t);
const clearAccessToken = () => localStorage.removeItem('tracker_jwt');

let refreshPromise: Promise<{ token: string; user: any } | null> | null = null;

async function refreshAccessToken(): Promise<{ token: string; user: any } | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',   // send the httpOnly refresh-token cookie
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        clearAccessToken();
        localStorage.removeItem('tracker_auth_user');
        return null;
      }

      const data = await res.json();
      setAccessToken(data.token);
      localStorage.setItem('tracker_auth_user', JSON.stringify(data.user));
      return { token: data.token as string, user: data.user };
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ── Core request with auto-refresh ───────────────────────────────────────────
async function request(endpoint: string, method = 'GET', body?: any, isRetry = false): Promise<any> {
  const token = getAccessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config: RequestInit = {
    method,
    headers,
    credentials: 'include'   // always send cookies so /auth/refresh works
  };
  if (body) config.body = JSON.stringify(body);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // If access token expired and we haven't retried yet, try to refresh
    if (response.status === 401 && !isRetry) {
      const refreshed = await refreshAccessToken();
      if (refreshed?.token) {
        // Retry original request with the new access token
        return request(endpoint, method, body, true);
      } else {
        // No valid refresh token — surface the 401 so UI can redirect to login
        throw new Error('Session expired. Please log in again.');
      }
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Something went wrong');
    }

    return await response.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && (err.message === 'Failed to fetch' || err.message.includes('fetch'))) {
      throw new Error(
        `Cannot connect to backend API server at ${BASE_URL}. Ensure the backend is deployed and VITE_API_URL environment variable is set.`
      );
    }
    throw err;
  }
}

// ── API Client ────────────────────────────────────────────────────────────────
export const apiClient = {
  // A U T H
  register: async (email: string, password: string, fullName: string) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Registration failed');
      }
      const data = await res.json();
      setAccessToken(data.token);
      localStorage.setItem('tracker_auth_user', JSON.stringify(data.user));
      return data.user;
    } catch (err: any) {
      if (err.name === 'TypeError' || err.message === 'Failed to fetch' || err.message?.includes('fetch')) {
        throw new Error(`Cannot connect to backend server at ${BASE_URL}. Verify backend service is running and VITE_API_URL is configured.`);
      }
      throw err;
    }
  },

  login: async (email: string, password: string) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',   // lets the server set the httpOnly cookie
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Login failed');
      }
      const data = await res.json();
      setAccessToken(data.token);
      localStorage.setItem('tracker_auth_user', JSON.stringify(data.user));
      if (data.notice) {
        return { ...data.user, _notice: data.notice };
      }
      return data.user;
    } catch (err: any) {
      if (err.name === 'TypeError' || err.message === 'Failed to fetch' || err.message?.includes('fetch')) {
        throw new Error(`Cannot connect to backend server at ${BASE_URL}. Verify backend service is running and VITE_API_URL is configured.`);
      }
      throw err;
    }
  },

  logout: async () => {
    // Tell the server to clear the httpOnly refresh-token cookie
    await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    }).catch(() => {});
    clearAccessToken();
    localStorage.removeItem('tracker_auth_user');
  },

  // Attempt a silent refresh on app startup (restores session 100% server-side via cookie)
  tryRefreshSession: async (): Promise<{ token: string; user: any } | null> => {
    return refreshAccessToken();
  },

  forgotPassword: async (email: string) => {
    return request('/auth/forgot-password', 'POST', { email });
  },

  resetPassword: async (password: string) => {
    return request('/auth/reset-password', 'POST', { password });
  },

  // P R O J E C T S
  getProjects: async () => {
    try {
      return await request('/projects');
    } catch (err: any) {
      if (err.message?.includes('Cannot connect')) {
        const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      }
      throw err;
    }
  },

  createProject: async (name: string, description: string, due_date?: string) => {
    return request('/projects', 'POST', { name, description, due_date });
  },

  updateProject: async (id: string, updates: { name?: string; description?: string; status?: string; due_date?: string }) => {
    return request(`/projects/${id}`, 'PUT', updates);
  },

  deleteProject: async (id: string) => {
    return request(`/projects/${id}`, 'DELETE');
  },

  // M O D U L E S
  getModulesForProject: async (projectId: string) => {
    return request(`/projects/${projectId}/modules`);
  },

  createModule: async (projectId: string, name: string, description: string) => {
    return request(`/projects/${projectId}/modules`, 'POST', { name, description });
  },

  deleteModule: async (id: string) => {
    return request(`/modules/${id}`, 'DELETE');
  },

  // T A S K S
  getTasksForProject: async (projectId: string) => {
    try {
      return await request(`/projects/${projectId}/tasks`);
    } catch (err: any) {
      if (err.message?.includes('Cannot connect')) {
        const { data, error } = await supabase.from('tasks').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      }
      throw err;
    }
  },

  createTask: async (projectId: string, task: { title: string; description: string; priority: string; due_date?: string; module_id?: string }) => {
    return request(`/projects/${projectId}/tasks`, 'POST', task);
  },

  updateTask: async (id: string, updates: any) => {
    return request(`/tasks/${id}`, 'PUT', updates);
  },

  getPendingTasks: async (): Promise<any[]> => {
    return request('/tasks/pending');
  },

  deleteTask: async (id: string) => {
    return request(`/tasks/${id}`, 'DELETE');
  },

  // S U B T A S K S
  getSubtasksForTask: async (taskId: string) => {
    return request(`/tasks/${taskId}/subtasks`);
  },

  createSubtask: async (taskId: string, title: string, due_date?: string) => {
    return request(`/tasks/${taskId}/subtasks`, 'POST', { title, due_date });
  },

  toggleSubtask: async (id: string) => {
    return request(`/subtasks/${id}/toggle`, 'PUT');
  },

  deleteSubtask: async (id: string) => {
    return request(`/subtasks/${id}`, 'DELETE');
  },

  // A D M I N  &  U S E R  M A N A G E M E N T
  getAllUsers: async () => {
    try {
      return await request('/admin/users');
    } catch (err: any) {
      if (err.message?.includes('Cannot connect')) {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      }
      throw err;
    }
  },

  updateUserRole: async (userId: string, role: 'super_admin' | 'admin' | 'user') => {
    try {
      return await request(`/admin/users/${userId}/role`, 'PUT', { role });
    } catch (err: any) {
      if (err.message?.includes('Cannot connect')) {
        if (role === 'super_admin') {
          await supabase.from('profiles').update({ role: 'admin', updated_at: new Date().toISOString() }).eq('role', 'super_admin');
        }
        const { data, error } = await supabase.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', userId).select().single();
        if (error) throw error;
        return data;
      }
      throw err;
    }
  },

  updateUserStatus: async (userId: string, status: 'active' | 'inactive') => {
    try {
      return await request(`/admin/users/${userId}/status`, 'PUT', { status });
    } catch (err: any) {
      if (err.message?.includes('Cannot connect')) {
        const { data, error } = await supabase.from('profiles').update({ status, updated_at: new Date().toISOString() }).eq('id', userId).select().single();
        if (error) throw error;
        return data;
      }
      throw err;
    }
  },

  adminResetPassword: async (userId: string, newPass: string) => {
    return request(`/admin/users/${userId}/reset-password`, 'POST', { password: newPass });
  },

  createAdminUser: async (data: { full_name: string; email: string; password?: string; role?: string }) => {
    return request('/admin/create-admin', 'POST', data);
  },

  deleteUser: async (userId: string) => {
    return request(`/admin/users/${userId}`, 'DELETE');
  },

  // P L A T F O R M  S T A T I S T I C S
  getPlatformStats: async () => {
    try {
      return await request('/admin/stats');
    } catch (err: any) {
      if (err.message?.includes('Cannot connect')) {
        const [
          { data: users },
          { data: projects },
          { data: tasks }
        ] = await Promise.all([
          supabase.from('profiles').select('id, status, created_at'),
          supabase.from('projects').select('id, status, due_date'),
          supabase.from('tasks').select('id, status')
        ]);

        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const todayStr = now.toISOString().split('T')[0];

        const totalUsers = users?.length || 0;
        const activeUsers = users?.filter(u => u.status !== 'inactive').length || 0;
        const inactiveUsers = users?.filter(u => u.status === 'inactive').length || 0;
        const newUsersThisMonth = users?.filter(u => new Date(u.created_at) >= firstOfMonth).length || 0;

        const totalProjects = projects?.length || 0;
        const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;
        const pendingProjects = projects?.filter(p => p.status === 'active' || p.status === 'pending').length || 0;
        const overdueProjects = projects?.filter(p => p.status !== 'completed' && p.due_date && p.due_date.split('T')[0] < todayStr).length || 0;

        const totalTasks = tasks?.length || 0;
        const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;

        return {
          totalUsers, activeUsers, inactiveUsers, newUsersThisMonth,
          totalProjects, completedProjects, pendingProjects, overdueProjects,
          totalTasks, completedTasks
        };
      }
      throw err;
    }
  },

  // A C T I V I T Y  L O G S
  getActivityLogs: async (): Promise<ActivityLog[]> => {
    try {
      return await request('/admin/activity-logs');
    } catch (err: any) {
      if (err.message?.includes('Cannot connect')) {
        const { data: logs } = await supabase
          .from('activity_logs')
          .select('id, user_id, action, category, details, created_at')
          .order('created_at', { ascending: false })
          .limit(200);

        return (logs || []).map((l: any) => ({
          id: l.id,
          user_id: l.user_id,
          user_name: 'System User',
          user_email: '—',
          action: l.action,
          category: l.category,
          details: typeof l.details === 'string' ? l.details : JSON.stringify(l.details),
          created_at: l.created_at
        }));
      }
      throw err;
    }
  },

  logActivity: (_action: string, _category: ActivityLog['category'], _details: string, _user?: any) => {
    // Activity logging is handled server-side in production
  },

  // S Y S T E M  S E T T I N G S
  getSystemSettings: async () => {
    return request('/admin/settings');
  },

  updateSystemSettings: async (updates: any) => {
    return request('/admin/settings', 'PUT', updates);
  },

  updateUserProfile: async (userId: string, updates: { full_name: string; timezone?: string }) => {
    try {
      return await request(`/admin/users/${userId}/profile`, 'PUT', updates);
    } catch (err: any) {
      if (err.message?.includes('Cannot connect')) {
        const { data, error } = await supabase.from('profiles').update({ full_name: updates.full_name, ...(updates.timezone && { timezone: updates.timezone }), updated_at: new Date().toISOString() }).eq('id', userId).select().single();
        if (error) throw error;
        return data;
      }
      throw err;
    }
  },

  // P R O F I L E
  getProfile: async () => {
    return request('/profile');
  },

  updateProfile: async (updates: { full_name: string; timezone: string; avatar_url?: string }) => {
    let updated;
    try {
      updated = await request('/profile', 'PUT', updates);
    } catch (err: any) {
      updated = await request('/admin/profile', 'PUT', updates);
    }
    localStorage.setItem('tracker_auth_user', JSON.stringify(updated));
    return updated;
  },

  checkDueTasksAndSendReminders: () => {
    // Handled server-side in production
    return [];
  },

  // N O T I F I C A T I O N S  (server-side, per-user)
  getNotifications: async (): Promise<{
    deadlines: any[];
    readIds: string[];
    clearedIds: string[];
  }> => {
    return request('/notification-reads');
  },

  markNotificationsRead: async (ids: string[]) => {
    return request('/notification-reads/mark-read', 'PUT', { ids });
  },

  markNotificationsCleared: async (ids: string[]) => {
    return request('/notification-reads/mark-cleared', 'PUT', { ids });
  },

  restoreNotifications: async () => {
    return request('/notification-reads/restore', 'PUT');
  },

  // A D M I N  N O T I F I C A T I O N S
  getAdminNotifications: async (page = 1, limit = 50): Promise<{
    notifications: AdminNotification[];
    total: number;
    page: number;
    limit: number;
  }> => {
    return request(`/admin/notifications?page=${page}&limit=${limit}`);
  },

  getAdminNotificationCount: async (): Promise<{ unread: number }> => {
    return request('/admin/notifications/count');
  },

  markAdminNotificationsRead: async (ids: string[]) => {
    return request('/admin/notifications/read', 'PUT', { ids });
  },

  clearAdminNotifications: async (ids: string[]) => {
    return request('/admin/notifications/clear', 'PUT', { ids });
  },

  markAllAdminNotificationsRead: async () => {
    return request('/admin/notifications/mark-all-read', 'PUT');
  },

  // A V A T A R  U P L O A D
  uploadAvatar: async (file: Blob): Promise<any> => {
    const token = localStorage.getItem('tracker_jwt');
    const formData = new FormData();
    formData.append('avatar', file, 'avatar.jpg');

    const res = await fetch(`${BASE_URL}/upload/avatar`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to upload avatar');
    }

    const updated = await res.json();
    localStorage.setItem('tracker_auth_user', JSON.stringify(updated));
    return updated;
  },

  // S U P E R  A D M I N  —  U S E R  A C T I V I T Y & T R A N S F E R
  getUserActivityTimeline: async (userId: string, page = 1, limit = 100, category?: string): Promise<{
    user: any;
    activity: AdminNotification[];
    totalLogs: number;
    page: number;
    limit: number;
    summary: {
      totalProjects: number;
      totalTasks: number;
      completedTasks: number;
      completionRate: number;
      lastActivity: string | null;
      memberSince: string;
    };
  }> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (category && category !== 'all') params.set('category', category);
    return request(`/admin/users/${userId}/activity?${params}`);
  },

  transferSuperAdmin: async (targetUserId: string): Promise<{
    success: boolean;
    message: string;
    updatedProfile: any;
  }> => {
    return request('/admin/transfer-super-admin', 'POST', { targetUserId });
  },

  revokeUserSessions: async (userId: string): Promise<{ success: boolean; message: string }> => {
    return request(`/admin/users/${userId}/revoke-sessions`, 'POST');
  },

  purgeActivityLogs: async (days = 30): Promise<{ success: boolean; message: string }> => {
    return request(`/admin/activity-logs/purge?days=${days}`, 'DELETE');
  },
};
