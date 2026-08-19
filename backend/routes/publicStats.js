import { Router } from 'express';
import { supabase } from '../supabaseClient.js';

const router = Router();

// GET /api/public/stats - Public platform statistics (no auth required)
router.get('/stats', async (req, res) => {
  try {
    const [
      { data: users },
      { data: projects },
      { data: tasks }
    ] = await Promise.all([
      supabase.from('profiles').select('id, status, created_at'),
      supabase.from('projects').select('id, status, due_date'),
      supabase.from('tasks').select('id, status')
    ]);

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalUsers = users?.length || 0;
    const activeUsers = users?.filter(u => u.status !== 'inactive').length || 0;
    const newUsersThisMonth = users?.filter(u => new Date(u.created_at) >= firstOfMonth).length || 0;

    const totalProjects = projects?.length || 0;
    const activeProjects = projects?.filter(p => p.status === 'active' || p.status === 'pending').length || 0;
    const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
    const activeTasks = tasks?.filter(t => t.status !== 'done').length || 0;

    res.json({
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      activeTasks
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;