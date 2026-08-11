import React, { useEffect, useState } from 'react';
import { GanttChartSquare, FolderKanban, Calendar } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

export const TimelinePage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const projs = await apiClient.getProjects();
        setProjects(projs);
        let allTasks: any[] = [];
        for (const p of projs) {
          const t = await apiClient.getTasksForProject(p.id);
          allTasks = [...allTasks, ...t.map((x: any) => ({ ...x, projectName: p.name }))];
        }
        setTasks(allTasks);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading font-bold text-2xl text-slate-900 flex items-center gap-2">
          <GanttChartSquare className="text-brand" size={24} /> Timeline & Gantt Schedule
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Project progress roadmap and timeline dependencies.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading timeline...</div>
      ) : projects.length === 0 ? (
        <div className="glass p-12 text-center text-slate-500">No projects available for timeline visualization.</div>
      ) : (
        <div className="space-y-6">
          {projects.map(proj => {
            const projTasks = tasks.filter(t => t.project_id === proj.id);
            const completedCount = projTasks.filter(t => t.status === 'done').length;
            const progress = projTasks.length > 0 ? Math.round((completedCount / projTasks.length) * 100) : 0;

            return (
              <div key={proj.id} className="glass p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <FolderKanban size={18} className="text-brand" />
                      <h2 className="font-bold text-slate-900 text-base">{proj.name}</h2>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-light text-brand uppercase">
                        {proj.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{proj.description}</p>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-sm font-bold text-slate-800">{progress}% Completed</span>
                    <p className="text-[11px] text-slate-400">{completedCount} of {projTasks.length} tasks done</p>
                  </div>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>

                <div className="space-y-2 pt-2">
                  {projTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No tasks created in this project yet.</p>
                  ) : (
                    projTasks.map((t, idx) => (
                      <div
                        key={t.id}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80"
                      >
                        <div className="flex items-center gap-3 min-w-0 md:w-1/3">
                          <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-500 flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className={`text-xs font-semibold truncate ${t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {t.title}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 px-2">
                          <div className="relative w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${t.status === 'done' ? 'bg-emerald-500' : t.status === 'in_progress' ? 'bg-amber-500' : 'bg-brand'}`}
                              style={{ width: t.status === 'done' ? '100%' : t.status === 'in_progress' ? '50%' : '20%' }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 shrink-0">
                          <Calendar size={12} />
                          <span>{t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No deadline'}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${t.priority === 'urgent' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'}`}>
                            {t.priority}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
