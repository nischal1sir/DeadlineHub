import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateToken);

// GET /api/notification-reads — fetch user's read & cleared notification keys
router.get('/', async (req, res) => {
  const userId = req.user.id;
  try {
    const { data, error } = await supabase
      .from('user_notification_reads')
      .select('notification_key, is_read, is_cleared')
      .eq('user_id', userId);

    if (error) throw error;

    const readIds = data.filter(r => r.is_read).map(r => r.notification_key);
    const clearedIds = data.filter(r => r.is_cleared).map(r => r.notification_key);
    res.json({ readIds, clearedIds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch notification reads' });
  }
});

// PUT /api/notification-reads/mark-read — mark one or more notifications as read
router.put('/mark-read', async (req, res) => {
  const userId = req.user.id;
  const { ids } = req.body; // array of notification_key strings

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'ids must be a non-empty array' });
  }

  try {
    const upserts = ids.map(key => ({
      user_id: userId,
      notification_key: key,
      is_read: true,
    }));

    const { error } = await supabase
      .from('user_notification_reads')
      .upsert(upserts, { onConflict: 'user_id,notification_key' });

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
});

// PUT /api/notification-reads/mark-cleared — clear (dismiss) one or more notifications
router.put('/mark-cleared', async (req, res) => {
  const userId = req.user.id;
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'ids must be a non-empty array' });
  }

  try {
    const upserts = ids.map(key => ({
      user_id: userId,
      notification_key: key,
      is_cleared: true,
    }));

    const { error } = await supabase
      .from('user_notification_reads')
      .upsert(upserts, { onConflict: 'user_id,notification_key' });

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to clear notifications' });
  }
});

// PUT /api/notification-reads/restore — unset cleared for a user (restore all)
router.put('/restore', async (req, res) => {
  const userId = req.user.id;
  try {
    const { error } = await supabase
      .from('user_notification_reads')
      .update({ is_cleared: false })
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to restore notifications' });
  }
});

export default router;
