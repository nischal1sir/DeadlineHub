import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateToken);

// GET /api/projects - Get all projects accessible by current user
router.get('/', async (req, res) => {
  try {
    let query = supabase.from('projects').select('*').order('created_at', { ascending: false });

    // Non-admin users only see projects they own
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      query = query.eq('owner_id', req.user.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects - Create a project
router.post('/', async (req, res) => {
  const { name, description, due_date } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ message: 'Project name is required.' });

  try {
    // 1. Validate and format due_date
    let formattedDueDate = null;
    if (due_date && String(due_date).trim()) {
      const parsedDate = new Date(due_date);
      if (!isNaN(parsedDate.getTime())) {
        formattedDueDate = parsedDate.toISOString();
      }
    }

    // 2. Ensure owner profile exists in public.profiles table to prevent FK constraint error
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', req.user.id)
      .maybeSingle();

    if (!existingProfile) {
      console.log(`[PROJECTS] Profile missing for user ${req.user.id}. Auto-creating profile...`);
      await supabase
        .from('profiles')
        .upsert({
          id: req.user.id,
          email: req.user.email || '',
          full_name: req.user.email ? req.user.email.split('@')[0] : 'User',
          avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${req.user.email || req.user.id}`,
          role: req.user.role || 'user',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([{
        owner_id: req.user.id,
        name: name.trim(),
        description: description ? description.trim() : null,
        due_date: formattedDueDate,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Log Activity
    await supabase.from('activity_logs').insert([{
      user_id: req.user.id,
      action: 'CREATE_PROJECT',
      category: 'project',
      details: `Created project "${name.trim()}"`
    }]);

    res.status(201).json(data);
  } catch (err) {
    console.error('[PROJECTS] Creation error:', err.message);
    res.status(400).json({ message: err.message || 'Failed to create project.' });
  }
});

// PUT /api/projects/:id - Update a project
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, status, due_date } = req.body;

  try {
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(due_date !== undefined && { due_date }),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/projects/:id - Delete a project
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
