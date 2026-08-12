// API Client — Production Mode (Express + Supabase Backend)

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

async function request(endpoint: string, method = 'GET', body?: any) {
  const token = localStorage.getItem('tracker_jwt');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config: RequestInit = { method, headers };
  if (body) config.body = JSON.stringify(body);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
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

export const apiClient = {
  // A U T H
  register: async (email: string, password: string, fullName: string) => {
    const res = await request('/auth/register', 'POST', { email, password, fullName });
    localStorage.setItem('tracker_jwt', res.token);
    localStorage.setItem('tracker_auth_user', JSON.stringify(res.user));
    return res.user;
  },

  login: async (email: string, password: string) => {
    const res = await request('/auth/login', 'POST', { email, password });
    localStorage.setItem('tracker_jwt', res.token);
    localStorage.setItem('tracker_auth_user', JSON.stringify(res.user));
    return res.user;
  },

  logout: async () => {
    localStorage.removeItem('tracker_auth_user');
    localStorage.removeItem('tracker_jwt');
  },

  forgotPassword: async (email: string) => {
    return request('/auth/forgot-password', 'POST', { email });
  },

  resetPassword: async (password: string) => {
    return request('/auth/reset-password', 'POST', { password });
  },

  // P R O J E C T S
  getProjects: async () => {
    return request('/projects');
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
    return request(`/projects/${projectId}/tasks`);
  },

  createTask: async (projectId: string, task: { title: string; description: string; priority: string; due_date?: string; module_id?: string }) => {
    return request(`/projects/${projectId}/tasks`, 'POST', task);
  },

  updateTask: async (id: string, updates: any) => {
    return request(`/tasks/${id}`, 'PUT', updates);
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
    return request('/admin/users');
  },

  updateUserRole: async (userId: string, role: 'super_admin' | 'admin' | 'user') => {
    return request(`/admin/users/${userId}/role`, 'PUT', { role });
  },

  updateUserStatus: async (userId: string, status: 'active' | 'inactive') => {
    return request(`/admin/users/${userId}/status`, 'PUT', { status });
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
    return request('/admin/stats');
  },

  // A C T I V I T Y  L O G S
  getActivityLogs: async (): Promise<ActivityLog[]> => {
    return request('/admin/activity-logs');
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

  // P R O F I L E
  getProfile: async () => {
    return request('/profile');
  },

  updateProfile: async (updates: { full_name: string; timezone: string; avatar_url?: string }) => {
    const updated = await request('/profile', 'PUT', updates);
    localStorage.setItem('tracker_auth_user', JSON.stringify(updated));
    return updated;
  },

  checkDueTasksAndSendReminders: () => {
    // Handled server-side in production
    return [];
  },

  // N O T I F I C A T I O N  R E A D S  (server-side, per-user)
  getNotificationReads: async (): Promise<{ readIds: string[]; clearedIds: string[] }> => {
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
};
