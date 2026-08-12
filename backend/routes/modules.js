import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateToken);

// GET /api/projects/:projectId/modules - Get modules for a project
router.get('/projects/:projectId/modules', async (req, res) => {
  const { projectId } = req.params;
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects/:projectId/modules - Create a module
router.post('/projects/:projectId/modules', async (req, res) => {
  const { projectId } = req.params;
  const { name, description } = req.body;

  if (!name) return res.status(400).json({ message: 'Module name is required.' });

  try {
    const { data: countData } = await supabase
      .from('modules')
      .select('id', { count: 'exact' })
      .eq('project_id', projectId);

    const order_index = (countData?.length || 0) + 1;

    const { data, error } = await supabase
      .from('modules')
      .insert([{
        project_id: projectId,
        name,
        description,
        order_index,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/modules/:id - Delete a module
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('modules').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
