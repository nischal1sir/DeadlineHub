import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateToken);

// GET /api/tasks/:taskId/subtasks - Get subtasks for task
router.get('/tasks/:taskId/subtasks', async (req, res) => {
  const { taskId } = req.params;
  try {
    const { data, error } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks/:taskId/subtasks - Create subtask
router.post('/tasks/:taskId/subtasks', async (req, res) => {
  const { taskId } = req.params;
  const { title } = req.body;

  if (!title) return res.status(400).json({ message: 'Subtask title is required.' });

  try {
    const { data, error } = await supabase
      .from('subtasks')
      .insert([{
        task_id: taskId,
        title,
        is_completed: false,
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

// PUT /api/subtasks/:id/toggle - Toggle subtask status
router.put('/:id/toggle', async (req, res) => {
  const { id } = req.params;
  try {
    const { data: subtask, error: fetchErr } = await supabase
      .from('subtasks')
      .select('is_completed')
      .eq('id', id)
      .single();

    if (fetchErr || !subtask) return res.status(404).json({ message: 'Subtask not found' });

    const { data, error } = await supabase
      .from('subtasks')
      .update({ is_completed: !subtask.is_completed })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/subtasks/:id - Delete subtask
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('subtasks').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
