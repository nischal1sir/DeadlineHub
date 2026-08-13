import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/notifications — Paginated activity logs with read/clear state
router.get('/', async (req, res) => {
  const adminId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const offset = (page - 1) * limit;

  try {
    // Get activity logs with user profiles (excluding task and project logs for admin feed)
    const { data: logs, error: logError, count } = await supabase
      .from('activity_logs')
      .select(`
        id, user_id, action, category, details, created_at,
        profiles (full_name, email, avatar_url)
      `, { count: 'exact' })
      .not('category', 'in', '("project","task")')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (logError) throw logError;

    // Get this admin's read and clear states
    const logIds = (logs || []).map(l => l.id);
    let readMap = {};

    if (logIds.length > 0) {
      const { data: readStates } = await supabase
        .from('admin_notification_reads')
        .select('log_id, is_read, is_cleared')
        .eq('admin_id', adminId)
        .in('log_id', logIds);

      (readStates || []).forEach(r => {
        readMap[r.log_id] = r;
      });
    }

    const notifications = (logs || [])
      .map(l => ({
        id: l.id,
        user_id: l.user_id,
        user_name: l.profiles?.full_name || 'System',
        user_email: l.profiles?.email || '',
        user_avatar: l.profiles?.avatar_url || null,
        action: l.action,
        category: l.category || 'system',
        details: l.details || '',
        created_at: l.created_at,
        is_read: readMap[l.id]?.is_read || false,
        is_cleared: readMap[l.id]?.is_cleared || false,
      }))
      .filter(n => !n.is_cleared); // Exclude cleared notifications from feed view

    res.json({ notifications, total: count || 0, page, limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/notifications/count — Unread count for badge
router.get('/count', async (req, res) => {
  const adminId = req.user.id;
  try {
    // Count total activity logs
    const { count: totalLogs } = await supabase
      .from('activity_logs')
      .select('id', { count: 'exact', head: true });

    // Count read or cleared logs for this admin
    const { count: readCount } = await supabase
      .from('admin_notification_reads')
      .select('id', { count: 'exact', head: true })
      .eq('admin_id', adminId)
      .or('is_read.eq.true,is_cleared.eq.true');

    const unread = Math.max(0, (totalLogs || 0) - (readCount || 0));

    res.json({ unread });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/notifications/read — Mark specific notification(s) as read
router.put('/read', async (req, res) => {
  const adminId = req.user.id;
  const { ids } = req.body; // array of log_ids

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'ids array is required' });
  }

  try {
    const upserts = ids.map(logId => ({
      admin_id: adminId,
      log_id: logId,
      is_read: true,
    }));

    const { error } = await supabase
      .from('admin_notification_reads')
      .upsert(upserts, { onConflict: 'admin_id,log_id' });

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/notifications/clear — Clear/dismiss specific notification(s)
router.put('/clear', async (req, res) => {
  const adminId = req.user.id;
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'ids array is required' });
  }

  try {
    const upserts = ids.map(logId => ({
      admin_id: adminId,
      log_id: logId,
      is_read: true,
      is_cleared: true,
    }));

    const { error } = await supabase
      .from('admin_notification_reads')
      .upsert(upserts, { onConflict: 'admin_id,log_id' });

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/notifications/mark-all-read — Mark all existing activity log notifications as read
router.put('/mark-all-read', async (req, res) => {
  const adminId = req.user.id;

  try {
    // Get all activity log IDs
    const { data: allLogs, error: fetchErr } = await supabase
      .from('activity_logs')
      .select('id');

    if (fetchErr) throw fetchErr;

    if (!allLogs || allLogs.length === 0) return res.json({ success: true });

    const upserts = allLogs.map(l => ({
      admin_id: adminId,
      log_id: l.id,
      is_read: true,
    }));

    // Batch upsert in chunks of 100
    for (let i = 0; i < upserts.length; i += 100) {
      const chunk = upserts.slice(i, i + 100);
      const { error: batchErr } = await supabase
        .from('admin_notification_reads')
        .upsert(chunk, { onConflict: 'admin_id,log_id' });
      if (batchErr) throw batchErr;
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
