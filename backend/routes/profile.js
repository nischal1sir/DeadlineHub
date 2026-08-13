import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateToken);

// GET /api/profile - Get current user profile from Supabase DB
router.get('/', async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/profile - Update current user profile
router.put('/', async (req, res) => {
  const { full_name, timezone, avatar_url } = req.body;

  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User session invalid.' });
    }

    const updates = {};
    if (full_name !== undefined && full_name.trim() !== '') {
      updates.full_name = full_name.trim();
    }
    if (timezone !== undefined) {
      updates.timezone = timezone;
    }
    if (avatar_url !== undefined) {
      updates.avatar_url = avatar_url;
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    // Sync full_name, name, and display_name with Supabase Auth user_metadata
    if (data.full_name) {
      try {
        await supabase.auth.admin.updateUserById(req.user.id, {
          user_metadata: {
            full_name: data.full_name,
            name: data.full_name,
            display_name: data.full_name
          }
        });
      } catch (authSyncErr) {
        console.warn('Supabase Auth user_metadata sync warning:', authSyncErr.message);
      }
    }

    // Log profile update activity
    try {
      await supabase.from('activity_logs').insert([{
        user_id: req.user.id,
        action: 'UPDATE_PROFILE',
        category: 'user',
        details: `Updated profile details: Name = "${data.full_name}"`,
        created_at: new Date().toISOString()
      }]);
    } catch (logErr) {
      console.error('Failed to log profile activity:', logErr);
    }

    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
