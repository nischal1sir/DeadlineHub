import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateToken);

// GET /api/profile - Get current user profile
router.get('/', async (req, res) => {
  res.json(req.user);
});

// PUT /api/profile - Update current user profile
router.put('/', async (req, res) => {
  const { full_name, timezone, avatar_url } = req.body;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...(full_name && { full_name }),
        ...(timezone && { timezone }),
        ...(avatar_url !== undefined && { avatar_url }),
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
