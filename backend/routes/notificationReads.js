import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateToken);

// GET /api/notification-reads — fetch user's upcoming deadlines along with read & cleared state
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const isUserAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
  try {
    // 1. Fetch user's read & cleared keys
    const { data: readStates, error: readsError } = await supabase
      .from('user_notification_reads')
      .select('notification_key, is_read, is_cleared')
      .eq('user_id', userId);

    if (readsError) throw readsError;

    const readIds = readStates.filter(r => r.is_read).map(r => r.notification_key);
    const clearedIds = readStates.filter(r => r.is_cleared).map(r => r.notification_key);

    // 2. Fetch Projects
    let projectsQuery = supabase.from('projects').select('*');
    if (!isUserAdmin) {
      projectsQuery = projectsQuery.eq('owner_id', userId);
    }
    const { data: projects, error: projError } = await projectsQuery;
    if (projError) throw projError;

    const projectIds = projects.map(p => p.id);
    let deadlines = [];

    // Filter project deadlines (excluding completed status)
    for (const p of projects) {
      if (p.status !== 'completed' && (p.due_date || p.deadline)) {
        const dueDate = p.due_date || p.deadline;
        deadlines.push({
          id: `proj-${p.id}`,
          type: 'project',
          title: p.name,
          subtitle: p.description || 'Project deadline approaching',
          projectName: p.name,
          projectId: p.id,
          dueDate
        });
      }
    }

    if (projectIds.length > 0) {
      // 3. Fetch Tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .in('project_id', projectIds);
      if (tasksError) throw tasksError;

      const taskIds = tasks.map(t => t.id);

      for (const t of tasks) {
        const proj = projects.find(p => p.id === t.project_id);
        if (t.status !== 'done' && t.due_date) {
          deadlines.push({
            id: `task-${t.id}`,
            type: 'task',
            title: t.title,
            subtitle: `Task in project "${proj ? proj.name : ''}"`,
            projectName: proj ? proj.name : '',
            projectId: t.project_id,
            dueDate: t.due_date,
            priority: t.priority
          });
        }
      }

      if (taskIds.length > 0) {
        // 4. Fetch Subtasks
        const { data: subtasks, error: subError } = await supabase
          .from('subtasks')
          .select('*')
          .in('task_id', taskIds);
        if (subError) throw subError;

        for (const sub of subtasks) {
          if (!sub.is_completed) {
            const task = tasks.find(t => t.id === sub.task_id);
            const proj = task ? projects.find(p => p.id === task.project_id) : null;
            const subDueDate = sub.due_date || (task ? task.due_date : null);
            if (subDueDate) {
              deadlines.push({
                id: `subtask-${sub.id}`,
                type: 'subtask',
                title: sub.title,
                subtitle: `Subtask under "${task ? task.title : ''}"`,
                projectName: proj ? proj.name : '',
                projectId: task ? task.project_id : '',
                dueDate: subDueDate,
                priority: task ? task.priority : 'medium'
              });
            }
          }
        }
      }
    }

    res.json({ deadlines, readIds, clearedIds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch notifications' });
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
