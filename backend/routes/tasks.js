import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateToken);

// GET /api/projects/:projectId/tasks - Get tasks for a project (with subtasks)
router.get('/projects/:projectId/tasks', async (req, res) => {
  const { projectId } = req.params;
  try {
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (tasksError) throw tasksError;

    // Fetch subtasks for these tasks
    const taskIds = tasks.map(t => t.id);
    let subtasksMap = {};
    if (taskIds.length > 0) {
      const { data: subtasks } = await supabase
        .from('subtasks')
        .select('*')
        .in('task_id', taskIds);

      if (subtasks) {
        subtasks.forEach(s => {
          if (!subtasksMap[s.task_id]) subtasksMap[s.task_id] = [];
          subtasksMap[s.task_id].push(s);
        });
      }
    }

    const enriched = tasks.map(t => ({
      ...t,
      subtasks: subtasksMap[t.id] || []
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects/:projectId/tasks - Create a task
router.post('/projects/:projectId/tasks', async (req, res) => {
  const { projectId } = req.params;
  const { title, description, priority, due_date, module_id } = req.body;

  if (!title) return res.status(400).json({ message: 'Task title is required.' });

  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        project_id: projectId,
        module_id: module_id || null,
        owner_id: req.user.id,
        title,
        description,
        status: 'todo',
        priority: priority || 'medium',
        due_date: due_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    await supabase.from('activity_logs').insert([{
      user_id: req.user.id,
      action: 'CREATE_TASK',
      category: 'task',
      details: `Created task "${title}"`
    }]);

    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/tasks/:id - Update task details or status
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, title, description, priority, due_date } = req.body;

  try {
    const updates = { updated_at: new Date().toISOString() };
    if (status) {
      updates.status = status;
      updates.completed_at = status === 'done' ? new Date().toISOString() : null;
    }
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority) updates.priority = priority;
    if (due_date !== undefined) updates.due_date = due_date;

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
