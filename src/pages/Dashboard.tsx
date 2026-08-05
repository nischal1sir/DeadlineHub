import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Calendar, AlertCircle, Plus, Activity, Clock } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const MetricCard = ({ icon: Icon, value, label, iconBg }: { icon: any; value: string | number; label: string; iconBg: string }) => (
  <div className="glass p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
      <Icon size={20} />
    </div>
    <div className="flex flex-col min-w-0">
      <span className="font-heading font-bold text-2xl text-slate-900 leading-none">{value}</span>
      <span className="text-xs text-slate-500 mt-0.5">{label}</span>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projectsCount, setProjectsCount] = useState(0);
  const [tasksStats, setTasksStats] = useState({ total: 0, completed: 0, active: 0 });
  const [todaysTasks, setTodaysTasks] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const projs = await apiClient.getProjects();
        setProjectsCount(projs.length);
        let allTasks: any[] = [];
        for (const p of projs) {
          const t = await apiClient.getTasksForProject(p.id);
          allTasks = [...allTasks, ...t.map((x: any) => ({ ...x, projectName: p.name }))];
        }
        const completed = allTasks.filter((t: any) => t.status === 'done').length;
        setTasksStats({ total: allTasks.length, completed, active: allTasks.length - completed });
        const todayStr = new Date().toISOString().split('T')[0];
        setTodaysTasks(allTasks.filter((t: any) => t.status !== 'done' && t.due_date?.split('T')[0] === todayStr));
        setUpcomingTasks(
          allTasks
            .filter((t: any) => t.status !== 'done' && t.due_date && t.due_date.split('T')[0] !== todayStr)
            .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
            .slice(0, 5)
        );
      } finally { setLoading(false); }
    })();
  }, []);

  const toggleTask = async (task: any) => {
    const next = task.status === 'done' ? 'todo' : 'done';
    await apiClient.updateTask(task.id, { status: next });
    const diff = next === 'done' ? 1 : -1;
    setTasksStats(p => ({ ...p, completed: p.completed + diff, active: p.active - diff }));
    setTodaysTasks(p => p.map((t: any) => t.id === task.id ? { ...t, status: next } : t));
  };

  const fmt = (iso?: string) => iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
  const isOverdue = (d?: string) => !!d && new Date(d) < new Date(new Date().toDateString());

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="animate-spin h-10 w-10 text-brand" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-0.5">Here's your project overview for today</p>
        </div>
        <Button onClick={() => navigate('/projects')} icon={<Plus size={15} />}>New Project</Button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={Activity}    value={projectsCount}    label="Active Projects"  iconBg="bg-brand/10 text-brand" />
        <MetricCard icon={CheckSquare} value={tasksStats.active} label="Pending Tasks"    iconBg="bg-cream text-amber-900" />
        <MetricCard icon={CheckSquare} value={tasksStats.completed} label="Completed"    iconBg="bg-accent/30 text-slate-800" />
        <MetricCard icon={Clock}
          value={`${tasksStats.total > 0 ? Math.round(tasksStats.completed / tasksStats.total * 100) : 0}%`}
          label="Completion Rate" iconBg="bg-secondary-light text-slate-700" />
      </div>

      {/* Widgets */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Due Today */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-brand" />
            <h2 className="font-semibold text-sm text-slate-800">Due Today</h2>
            <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{todaysTasks.length}</span>
          </div>
          <div className="glass p-4 space-y-2 min-h-[120px]">
            {todaysTasks.length === 0 ? (
              <div className="h-24 flex flex-col items-center justify-center text-center">
                <CheckSquare size={28} className="text-brand mb-2" />
                <p className="text-sm font-medium text-slate-700">All clear for today!</p>
                <p className="text-xs text-slate-400">No tasks due today</p>
              </div>
            ) : todaysTasks.map((task: any) => (
              <div key={task.id} className="flex items-center gap-3 py-1.5">
                <button
                  onClick={() => toggleTask(task)}
                  className={[
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer',
                    task.status === 'done'
                      ? 'bg-brand border-brand text-white'
                      : 'border-slate-300 hover:border-brand',
                  ].join(' ')}
                >
                  {task.status === 'done' && <span className="text-[10px] font-bold">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</p>
                  <p className="text-xs text-slate-400 truncate">{task.projectName}</p>
                </div>
                <Badge type="priority" value={task.priority} />
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-amber-700" />
            <h2 className="font-semibold text-sm text-slate-800">Upcoming Deadlines</h2>
          </div>
          <div className="glass p-4 space-y-2 min-h-[120px]">
            {upcomingTasks.length === 0 ? (
              <div className="h-24 flex flex-col items-center justify-center text-center">
                <CheckSquare size={28} className="text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-500">No upcoming deadlines</p>
              </div>
            ) : upcomingTasks.map((task: any) => (
              <div
                key={task.id}
                onClick={() => navigate(`/projects/${task.project_id}`)}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-200/80 hover:border-brand/40 hover:bg-brand-light/30 cursor-pointer transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                  <p className="text-xs text-slate-400 truncate">{task.projectName}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs ${isOverdue(task.due_date) ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                    {fmt(task.due_date)}{isOverdue(task.due_date) ? ' !' : ''}
                  </span>
                  <Badge type="priority" value={task.priority} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
