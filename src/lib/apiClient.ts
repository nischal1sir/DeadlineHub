// API Client with Dual Mode: Mock LocalStorage (Out-of-the-box offline mode) & Backend REST Connection

const USE_MOCK = true; // Set to false when connecting to Node/Express server
const BASE_URL = 'http://localhost:5000/api';

// Helper to generate UUIDs
const generateUuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Initial Data Seeds
const seedDatabase = () => {
  if (!localStorage.getItem('tracker_users')) {
    const adminUser = {
      id: 'admin-uuid-1111',
      email: 'admin@tracker.com',
      password: 'password123', // Raw for mock mode only
      full_name: 'Alex Johnson',
      avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin',
      timezone: 'UTC',
      created_at: new Date().toISOString()
    };
    localStorage.setItem('tracker_users', JSON.stringify([adminUser]));
    localStorage.setItem('tracker_auth_user', JSON.stringify(adminUser));
  }

  if (!localStorage.getItem('tracker_projects')) {
    const mockProjects = [
      {
        id: 'project-uuid-1',
        owner_id: 'admin-uuid-1111',
        name: 'Website Redesign',
        description: 'Overhaul corporate landing page, matching custom brand styling.',
        status: 'active',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'project-uuid-2',
        owner_id: 'admin-uuid-1111',
        name: 'Mobile App API Integration',
        description: 'Build backend routes for processing push updates.',
        status: 'active',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    localStorage.setItem('tracker_projects', JSON.stringify(mockProjects));
  }

  if (!localStorage.getItem('tracker_tasks')) {
    const mockTasks = [
      {
        id: 'task-uuid-1',
        project_id: 'project-uuid-1',
        owner_id: 'admin-uuid-1111',
        title: 'Draft landing site wireframes',
        description: 'Incorporate new font Outfit and layout guidelines.',
        status: 'done',
        priority: 'high',
        due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'task-uuid-2',
        project_id: 'project-uuid-1',
        owner_id: 'admin-uuid-1111',
        title: 'Define brand color variables',
        description: 'Variables matching color palette from design.',
        status: 'in_progress',
        priority: 'high',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'task-uuid-3',
        project_id: 'project-uuid-1',
        owner_id: 'admin-uuid-1111',
        title: 'Review user interface responsive layouts',
        description: 'Verify navigation bar collapse on mobile.',
        status: 'todo',
        priority: 'medium',
        due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'task-uuid-4',
        project_id: 'project-uuid-2',
        owner_id: 'admin-uuid-1111',
        title: 'Setup API Express skeleton',
        description: 'Build core endpoints mapping Supabase handlers.',
        status: 'todo',
        priority: 'low',
        due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    localStorage.setItem('tracker_tasks', JSON.stringify(mockTasks));
  }
};

// Seed db immediately on client load
seedDatabase();

// Get items from storage
const getStorageList = (key: string): any[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

// Set items in storage
const setStorageList = (key: string, list: any[]) => {
  localStorage.setItem(key, JSON.stringify(list));
};

// Axios/Fetch Wrapper pointed at Express
async function request(endpoint: string, method = 'GET', body?: any) {
  if (!USE_MOCK) {
    const token = localStorage.getItem('tracker_jwt');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Something went wrong');
    }
    return response.json();
  }
  return null;
}

export const apiClient = {
  // A U T H
  register: async (email: string, password: string, fullName: string) => {
    if (USE_MOCK) {
      const users = getStorageList('tracker_users');
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('User already exists with this email.');
      }
      const newUser = {
        id: generateUuid(),
        email,
        password,
        full_name: fullName,
        avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${fullName}`,
        timezone: 'UTC',
        created_at: new Date().toISOString()
      };
      users.push(newUser);
      setStorageList('tracker_users', users);
      
      const sessionUser = { ...newUser };
      delete (sessionUser as any).password;
      localStorage.setItem('tracker_auth_user', JSON.stringify(sessionUser));
      localStorage.setItem('tracker_jwt', 'mock-jwt-token-' + generateUuid());
      return sessionUser;
    }
    return request('/auth/register', 'POST', { email, password, fullName });
  },

  login: async (email: string, password: string) => {
    if (USE_MOCK) {
      const users = getStorageList('tracker_users');
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (!user) {
        throw new Error('Invalid email or password.');
      }
      const sessionUser = { ...user };
      delete (sessionUser as any).password;
      localStorage.setItem('tracker_auth_user', JSON.stringify(sessionUser));
      localStorage.setItem('tracker_jwt', 'mock-jwt-token-' + generateUuid());
      return sessionUser;
    }
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
    if (USE_MOCK) {
      const users = getStorageList('tracker_users');
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        throw new Error('User email not found.');
      }
      return { message: 'Reset token emailed successfully.' };
    }
    return request('/auth/forgot-password', 'POST', { email });
  },

  resetPassword: async (password: string) => {
    if (USE_MOCK) {
      const user = JSON.parse(localStorage.getItem('tracker_auth_user') || '{}');
      if (!user.id) throw new Error('Unassigned user token.');
      const users = getStorageList('tracker_users');
      const userIdx = users.findIndex(u => u.id === user.id);
      if (userIdx !== -1) {
        users[userIdx].password = password;
        setStorageList('tracker_users', users);
      }
      return { message: 'Password updated successfully.' };
    }
    return request('/auth/reset-password', 'POST', { password });
  },

  // P R O J E C T S
  getProjects: async () => {
    if (USE_MOCK) {
      const user = JSON.parse(localStorage.getItem('tracker_auth_user') || '{}');
      const projects = getStorageList('tracker_projects');
      return projects.filter(p => p.owner_id === user.id);
    }
    return request('/projects');
  },

  createProject: async (name: string, description: string) => {
    if (USE_MOCK) {
      const user = JSON.parse(localStorage.getItem('tracker_auth_user') || '{}');
      const projects = getStorageList('tracker_projects');
      const newProj = {
        id: generateUuid(),
        owner_id: user.id,
        name,
        description,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      projects.push(newProj);
      setStorageList('tracker_projects', projects);
      return newProj;
    }
    return request('/projects', 'POST', { name, description });
  },

  updateProject: async (id: string, updates: { name?: string, description?: string, status?: string }) => {
    if (USE_MOCK) {
      const projects = getStorageList('tracker_projects');
      const idx = projects.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Project not found');
      projects[idx] = {
        ...projects[idx],
        ...updates,
        updated_at: new Date().toISOString()
      };
      setStorageList('tracker_projects', projects);
      return projects[idx];
    }
    return request(`/projects/${id}`, 'PUT', updates);
  },

  deleteProject: async (id: string) => {
    if (USE_MOCK) {
      // business logic validation: can't delete project with active tasks
      const tasks = getStorageList('tracker_tasks').filter(t => t.project_id === id);
      const activeTasks = tasks.filter(t => t.status !== 'done');
      if (activeTasks.length > 0) {
        throw new Error("Cannot delete a project that still carries active (incomplete) tasks.");
      }
      
      const projects = getStorageList('tracker_projects');
      const filtered = projects.filter(p => p.id !== id);
      setStorageList('tracker_projects', filtered);
      
      // Cascade delete tasks if any (though we verified activeTasks = 0, we can clear completed ones too)
      const allTasks = getStorageList('tracker_tasks');
      const filteredTasks = allTasks.filter(t => t.project_id !== id);
      setStorageList('tracker_tasks', filteredTasks);
      return { success: true };
    }
    return request(`/projects/${id}`, 'DELETE');
  },

  // T A S K S
  getTasksForProject: async (projectId: string) => {
    if (USE_MOCK) {
      const tasks = getStorageList('tracker_tasks');
      return tasks.filter(t => t.project_id === projectId);
    }
    return request(`/projects/${projectId}/tasks`);
  },

  createTask: async (projectId: string, task: { title: string; description: string; priority: string; due_date?: string }) => {
    if (USE_MOCK) {
      const user = JSON.parse(localStorage.getItem('tracker_auth_user') || '{}');
      const tasks = getStorageList('tracker_tasks');
      const newTask = {
        id: generateUuid(),
        project_id: projectId,
        owner_id: user.id,
        title: task.title,
        description: task.description,
        status: 'todo', // todo | in_progress | done
        priority: task.priority,
        due_date: task.due_date ? new Date(task.due_date).toISOString() : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      tasks.push(newTask);
      setStorageList('tracker_tasks', tasks);
      return newTask;
    }
    return request(`/projects/${projectId}/tasks`, 'POST', task);
  },

  updateTask: async (id: string, updates: { title?: string; description?: string; status?: string; priority?: string; due_date?: string; completed_at?: string | null }) => {
    if (USE_MOCK) {
      const tasks = getStorageList('tracker_tasks');
      const idx = tasks.findIndex(t => t.id === id);
      if (idx === -1) throw new Error('Task not found');
      
      let completed_at = tasks[idx].completed_at;
      if (updates.status === 'done' && tasks[idx].status !== 'done') {
        completed_at = new Date().toISOString();
      } else if (updates.status && updates.status !== 'done') {
        completed_at = null;
      }

      tasks[idx] = {
        ...tasks[idx],
        ...updates,
        completed_at,
        updated_at: new Date().toISOString()
      };
      setStorageList('tracker_tasks', tasks);
      return tasks[idx];
    }
    return request(`/tasks/${id}`, 'PUT', updates);
  },

  deleteTask: async (id: string) => {
    if (USE_MOCK) {
      const tasks = getStorageList('tracker_tasks');
      const filtered = tasks.filter(t => t.id !== id);
      setStorageList('tracker_tasks', filtered);
      return { success: true };
    }
    return request(`/tasks/${id}`, 'DELETE');
  },

  // P R O F I L E
  getProfile: async () => {
    if (USE_MOCK) {
      return JSON.parse(localStorage.getItem('tracker_auth_user') || '{}');
    }
    return request('/profile');
  },

  updateProfile: async (updates: { full_name: string; timezone: string; avatar_url?: string }) => {
    if (USE_MOCK) {
      const user = JSON.parse(localStorage.getItem('tracker_auth_user') || '{}');
      const users = getStorageList('tracker_users');
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        users[idx] = {
          ...users[idx],
          ...updates
        };
        setStorageList('tracker_users', users);
        
        const updatedUser = { ...users[idx] };
        delete (updatedUser as any).password;
        localStorage.setItem('tracker_auth_user', JSON.stringify(updatedUser));
        return updatedUser;
      }
      throw new Error('Profile user session broken');
    }
    return request('/profile', 'PUT', updates);
  },

  // Daily alert notification routine checker (Emulating backend node-cron emails)
  checkDueTasksAndSendReminders: () => {
    const tasks = getStorageList('tracker_tasks');
    const user = JSON.parse(localStorage.getItem('tracker_auth_user') || '{}');
    if (!user.id) return [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Filter tasks due today or overdue, which are not done
    const dueTasks = tasks.filter(t => {
      if (t.owner_id !== user.id || t.status === 'done' || !t.due_date) return false;
      const dueStr = t.due_date.split('T')[0];
      return dueStr <= todayStr;
    });

    if (dueTasks.length > 0) {
      console.info(
        `%c [Node-Cron Reminder Service] `,
        'background: #FFA300; color: #000; padding: 2px 5px; font-weight: bold;',
        `Found ${dueTasks.length} task(s) due or overdue for user ${user.full_name || user.email}. Simulated reminder email sent via Resend/SendGrid!`
      );
    }
    return dueTasks;
  }
};
