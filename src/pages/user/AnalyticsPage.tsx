import React, { useEffect, useState } from 'react';
import { BarChart2, TrendingUp, CheckSquare, FolderKanban, Clock, Target } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

export const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState({
    projectsCount: 0,
    tasksCount: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0
  });

  useEffect(() => {
    (async () => {
      try {
        const projs = await apiClient.getProjects();
        let allTasks: any[] = [];
        for (const p of projs) {
          const t = await apiClient.getTasksForProject(p.id);
          allTasks = [...allTasks, ...t];
        }
        const completed = allTasks.filter(t => t.status === 'done').length;
        const rate = allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0;
        setStats({
          projectsCount: projs.length,
          tasksCount: allTasks.length,
          completedTasks: completed,
          pendingTasks: allTasks.length - completed,
          completionRate: rate
        });
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading font-bold text-2xl text-slate-900 flex items-center gap-2">
          <BarChart2 className="text-brand" size={24} /> Productivity Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Metrics and velocity overview of your projects and task deliverables.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <FolderKanban size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</p>
            <p className="text-2xl font-bold text-slate-900">{stats.projectsCount}</p>
          </div>
        </div>

        <div className="glass p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Tasks</p>
            <p className="text-2xl font-bold text-slate-900">{stats.pendingTasks}</p>
          </div>
        </div>

        <div className="glass p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckSquare size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Tasks</p>
            <p className="text-2xl font-bold text-slate-900">{stats.completedTasks}</p>
          </div>
        </div>

        <div className="glass p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completion Rate</p>
            <p className="text-2xl font-bold text-slate-900">{stats.completionRate}%</p>
          </div>
        </div>
      </div>

      <div className="glass p-6 space-y-4">
        <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <Target className="text-brand" size={18} /> Overall Progress Velocity
        </h2>
        <p className="text-xs text-slate-500">Your task completion rate across active modules.</p>
        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
          <div className="bg-brand h-full rounded-full transition-all duration-500" style={{ width: `${stats.completionRate}%` }} />
        </div>
      </div>
    </div>
  );
};
