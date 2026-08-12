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
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Project name is required.' });

  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        owner_id: req.user.id,
        name,
        description,
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
      details: `Created project "${name}"`
    }]);

    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/projects/:id - Update a project
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;

  try {
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
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
