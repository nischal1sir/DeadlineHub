import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateToken);
router.use(requireAdmin);

// Helper function to validate UUID string format
const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

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

// PUT /api/admin/users/:id/profile - Admin update user profile (full_name, timezone)
router.put('/users/:id/profile', async (req, res) => {
  const { id } = req.params;
  const { full_name, timezone } = req.body;

  if (!isUUID(id)) {
    return res.status(400).json({ message: 'Invalid user ID specified.' });
  }

  if (!full_name || !full_name.trim()) {
    return res.status(400).json({ message: 'Full name cannot be empty.' });
  }

  try {
    const { data: target } = await supabase.from('profiles').select('full_name, role').eq('id', id).single();

    if (req.user.role !== 'super_admin' && target?.role !== 'user' && id !== req.user.id) {
      return res.status(403).json({ message: 'Regular Admins cannot edit profile details of other Admins or Super Admins.' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: full_name.trim(),
        ...(timezone && { timezone }),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Sync full_name, name, and display_name with Supabase Auth user_metadata
    try {
      await supabase.auth.admin.updateUserById(id, {
        user_metadata: {
          full_name: full_name.trim(),
          name: full_name.trim(),
          display_name: full_name.trim()
        }
      });
    } catch (authSyncErr) {
      console.warn('Supabase Auth user_metadata sync warning:', authSyncErr.message);
    }

    await logAdminActivity(req.user.id, 'UPDATE_USER_PROFILE', 'admin', `Updated profile name for ${target?.full_name || id} to "${full_name.trim()}"`);

    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id/role - Update user role (Super Admin only)
router.put('/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Only Super Admins have permission to modify user roles.' });
  }

  if (!isUUID(id)) {
    return res.status(400).json({ message: 'Invalid user ID specified.' });
  }

  if (!['user', 'admin', 'super_admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified.' });
  }

  try {
    const { data: target } = await supabase.from('profiles').select('full_name, email').eq('id', id).single();

    // Single Super Admin rule: if promoting to super_admin, demote current super_admin first
    if (role === 'super_admin') {
      await supabase
        .from('profiles')
        .update({ role: 'admin', updated_at: new Date().toISOString() })
        .eq('role', 'super_admin');
    }

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

  if (!isUUID(id)) {
    return res.status(400).json({ message: 'Invalid user ID specified.' });
  }

  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Status must be active or inactive.' });
  }

  try {
    const { data: target } = await supabase.from('profiles').select('full_name, role').eq('id', id).single();

    if (req.user.role !== 'super_admin' && target?.role !== 'user') {
      return res.status(403).json({ message: 'Regular Admins cannot modify the status of other Admins or Super Admins.' });
    }

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

  if (!isUUID(id)) {
    return res.status(400).json({ message: 'Invalid user ID specified.' });
  }

  if (!password) return res.status(400).json({ message: 'New password is required.' });

  try {
    const { data: target } = await supabase.from('profiles').select('role, full_name').eq('id', id).single();

    if (req.user.role !== 'super_admin' && target?.role !== 'user') {
      return res.status(403).json({ message: 'Regular Admins can only reset passwords for standard users.' });
    }

    // Preserve existing user metadata
    let existingMeta = {};
    try {
      const { data: userRes } = await supabase.auth.admin.getUserById(id);
      if (userRes?.user) existingMeta = userRes.user.user_metadata || {};
    } catch (e) {}

    // Update user password directly in Supabase Auth via Admin API
    const { error } = await supabase.auth.admin.updateUserById(id, {
      password,
      user_metadata: {
        ...existingMeta,
        password_changed_by_admin: true,
        admin_password_updated_at: new Date().toISOString()
      }
    });

    if (error) throw error;

    // Revoke active sessions for the user so they must re-authenticate with the new password
    try {
      await supabase.auth.admin.signOut(id, 'global');
    } catch (signOutErr) {
      console.warn('Admin reset global signOut warning:', signOutErr.message);
    }

    await logAdminActivity(req.user.id, 'ADMIN_RESET_PASSWORD', 'admin', `Reset password for user ID ${id}`);

    res.json({
      success: true,
      message: 'Password updated directly in Supabase Auth. The user will be notified upon login that their password was changed by an administrator.'
    });
  } catch (err) {
    console.error('Failed to reset user password in Supabase:', err);
    res.status(400).json({ message: err.message || 'Failed to update password in Supabase.' });
  }
});

// POST /api/admin/create-admin - Create new Admin user (Super Admin only)
router.post('/create-admin', async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Only Super Admins can create new Admin accounts.' });
  }

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

// GET /api/admin/users/:id/activity - Full activity timeline for a user (Super Admin only)
router.get('/users/:id/activity', async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const offset = (page - 1) * limit;
  const category = req.query.category;

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Only Super Admins can view full user activity.' });
  }

  try {
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, avatar_url, status, created_at')
      .eq('id', id)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    let query = supabase
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', id)
      .not('category', 'in', '("project","task")')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: logs, error: logError, count } = await query;
    if (logError) throw logError;

    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, status, created_at')
      .eq('owner_id', id)
      .order('created_at', { ascending: false });

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, project_id, created_at')
      .eq('owner_id', id);

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;

    res.json({
      user: targetUser,
      activity: logs || [],
      totalLogs: count || 0,
      page,
      limit,
      summary: {
        totalProjects: projects?.length || 0,
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        lastActivity: logs?.[0]?.created_at || null,
        memberSince: targetUser.created_at,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id - Delete user account (Super Admin only)
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  // Only Super Admin can delete user accounts
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      message: 'Only Super Admins have permission to delete user accounts.'
    });
  }

  // Prevent super admin from deleting their own account
  if (id === req.user.id) {
    return res.status(403).json({
      message: 'Super Admin cannot delete their own account. Transfer the Super Admin role to another admin first.'
    });
  }

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

// POST /api/admin/transfer-super-admin — Transfer super_admin to another admin
router.post('/transfer-super-admin', async (req, res) => {
  const { targetUserId } = req.body;

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Only the current Super Admin can transfer this role.' });
  }

  if (!targetUserId) {
    return res.status(400).json({ message: 'Target user ID is required.' });
  }

  if (targetUserId === req.user.id) {
    return res.status(400).json({ message: 'You are already the Super Admin.' });
  }

  try {
    const { data: target, error: targetError } = await supabase
      .from('profiles')
      .select('id, full_name, role, status')
      .eq('id', targetUserId)
      .single();

    if (targetError || !target) {
      return res.status(404).json({ message: 'Target user not found.' });
    }

    if (target.status === 'inactive') {
      return res.status(400).json({ message: 'Cannot transfer Super Admin role to an inactive user.' });
    }

    if (target.role !== 'admin') {
      return res.status(400).json({ message: 'Target user must be an Admin before receiving Super Admin role.' });
    }

    const now = new Date().toISOString();

    const { error: promoteErr } = await supabase
      .from('profiles')
      .update({ role: 'super_admin', updated_at: now })
      .eq('id', targetUserId);
    if (promoteErr) throw promoteErr;

    const { error: demoteErr } = await supabase
      .from('profiles')
      .update({ role: 'admin', updated_at: now })
      .eq('id', req.user.id);
    if (demoteErr) throw demoteErr;

    await logAdminActivity(
      req.user.id,
      'TRANSFER_SUPER_ADMIN',
      'admin',
      `Transferred Super Admin role to ${target.full_name}`
    );

    const { data: updatedSelf } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    res.json({
      success: true,
      message: `Super Admin role transferred to ${target.full_name}. You are now an Admin.`,
      updatedProfile: updatedSelf
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
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

// PUT /api/admin/settings - Update System Settings (Super Admin only)
router.put('/settings', async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Only Super Admins can modify system configuration settings.' });
  }

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

// POST /api/admin/users/:id/revoke-sessions - Force logout / revoke sessions (Super Admin only)
router.post('/users/:id/revoke-sessions', async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Only Super Admins can force session revocation.' });
  }

  try {
    const { data: target } = await supabase.from('profiles').select('full_name, email').eq('id', id).single();

    // Revoke user refresh tokens in Supabase Auth
    try {
      await supabase.auth.admin.signOut(id, 'global');
    } catch (e) {
      console.warn('Supabase global signOut warning:', e.message);
    }

    await logAdminActivity(
      req.user.id,
      'FORCE_REVOKE_SESSIONS',
      'admin',
      `Force revoked active sessions for user ${target?.full_name || id} (${target?.email || ''})`
    );

    res.json({ success: true, message: `Active sessions revoked for ${target?.full_name || 'user'}. User will be prompted to log in again.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/activity-logs/purge - Purge historical logs older than X days (Super Admin only)
router.delete('/activity-logs/purge', async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Only Super Admins can purge historical activity logs.' });
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffIso = cutoffDate.toISOString();

    const { error } = await supabase
      .from('activity_logs')
      .delete()
      .lt('created_at', cutoffIso);

    if (error) throw error;

    await logAdminActivity(
      req.user.id,
      'PURGE_ACTIVITY_LOGS',
      'system',
      `Purged activity logs older than ${days} days (before ${cutoffDate.toLocaleDateString()})`
    );

    res.json({ success: true, message: `Successfully purged activity logs older than ${days} days.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
