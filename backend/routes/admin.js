import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateToken);
router.use(requireAdmin);

// Helper function to log administrative activity
const logAdminActivity = async (adminId, action, category, details) => {
  try {
    await supabase.from('activity_logs').insert([{
      user_id: adminId,
      action,
      category,
      details,
      created_at: new Date().toISOString()
    }]);
  } catch (err) {
    console.error('Failed to log admin activity:', err);
  }
};

// GET /api/admin/users - Get all users
router.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id/role - Update user role
router.put('/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['user', 'admin', 'super_admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified.' });
  }

  try {
    const { data: target } = await supabase.from('profiles').select('full_name, email').eq('id', id).single();

    const { data, error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity(req.user.id, 'UPDATE_USER_ROLE', 'admin', `Changed role for ${target?.full_name || id} to ${role.toUpperCase()}`);

    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id/status - Activate or Deactivate user
router.put('/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Status must be active or inactive.' });
  }

  try {
    const { data: target } = await supabase.from('profiles').select('full_name').eq('id', id).single();

    const { data, error } = await supabase
      .from('profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity(req.user.id, 'UPDATE_USER_STATUS', 'user', `Account status for ${target?.full_name || id} set to ${status.toUpperCase()}`);

    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/admin/users/:id/reset-password - Admin reset password
router.post('/users/:id/reset-password', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) return res.status(400).json({ message: 'New password is required.' });

  try {
    const { error } = await supabase.auth.admin.updateUserById(id, { password });
    if (error) throw error;

    await logAdminActivity(req.user.id, 'ADMIN_RESET_PASSWORD', 'admin', `Reset password for user ID ${id}`);

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/admin/create-admin - Create new Admin user
router.post('/create-admin', async (req, res) => {
  const { email, password, full_name, role } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ message: 'Email, password, and full name are required.' });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: role || 'admin'
      }
    });

    if (authError) throw authError;

    // Ensure profile entry has correct role
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .update({ role: role || 'admin', status: 'active' })
      .eq('id', authData.user.id)
      .select()
      .single();

    await logAdminActivity(req.user.id, 'CREATE_ADMIN_ACCOUNT', 'admin', `Created new Admin account for ${full_name} (${email})`);

    res.status(201).json(profile || authData.user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id - Delete user account
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { data: target } = await supabase.from('profiles').select('full_name, email').eq('id', id).single();

    const { error: authErr } = await supabase.auth.admin.deleteUser(id);
    if (authErr) throw authErr;

    await logAdminActivity(req.user.id, 'DELETE_USER_ACCOUNT', 'admin', `Deleted user account ${target?.full_name || id} (${target?.email || ''})`);

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/admin/stats - Platform Statistics
router.get('/stats', async (req, res) => {
  try {
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

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      newUsersThisMonth,
      totalProjects,
      completedProjects,
      pendingProjects,
      overdueProjects,
      totalTasks,
      completedTasks
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/activity-logs - Activity Logs
router.get('/activity-logs', async (req, res) => {
  try {
    const { data: logs, error } = await supabase
      .from('activity_logs')
      .select(`
        id,
        user_id,
        action,
        category,
        details,
        created_at,
        profiles (full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    const formatted = logs.map(l => ({
      id: l.id,
      user_id: l.user_id,
      user_name: l.profiles?.full_name || 'System',
      user_email: l.profiles?.email || '—',
      action: l.action,
      category: l.category,
      details: typeof l.details === 'string' ? l.details : JSON.stringify(l.details),
      created_at: l.created_at
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/settings - System Settings
router.get('/settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json(data || {
      platform_name: 'DeadlineHub Platform',
      maintenance_mode: false,
      allow_public_registration: true,
      default_user_role: 'user',
      session_timeout_minutes: 60
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/settings - Update System Settings
router.put('/settings', async (req, res) => {
  const updates = req.body;

  try {
    const { data: existing } = await supabase.from('system_settings').select('id').single();

    let result;
    if (existing?.id) {
      const { data, error } = await supabase
        .from('system_settings')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('system_settings')
        .insert([updates])
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    await logAdminActivity(req.user.id, 'UPDATE_SYSTEM_SETTINGS', 'system', 'Updated global platform settings');

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
