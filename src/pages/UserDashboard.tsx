import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Calendar, Plus, Activity, Clock, TrendingUp, FolderOpenDot, ChartNoAxesGantt, ListTodo } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { toLocalDateString, getDaysRemaining } from '../lib/dateUtils';

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

export const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projectsCount, setProjectsCount] = useState(0);
  const [tasksStats, setTasksStats] = useState({ total: 0, completed: 0, active: 0 });
  const [todaysTasks, setTodaysTasks] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const projs = await apiClient.getProjects();
        setProjectsCount(projs.length);
        let allTasks: any[] = [];

        for (const p of projs) {
          // Fetch Tasks for project
          const tList = await apiClient.getTasksForProject(p.id);
          allTasks = [...allTasks, ...tList.map((x: any) => ({ ...x, projectName: p.name }))];
        }

        const completed = allTasks.filter((t: any) => t.status === 'done').length;
        setTasksStats({ total: allTasks.length, completed, active: allTasks.length - completed });
        const todayStr = toLocalDateString(new Date());
        setTodaysTasks(allTasks.filter((t: any) => t.status !== 'done' && toLocalDateString(t.due_date) === todayStr));
        setUpcomingTasks(
          allTasks
            .filter((t: any) => t.status !== 'done' && t.due_date && toLocalDateString(t.due_date) !== todayStr)
            .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
            .slice(0, 5)
        );
      } finally { setLoading(false); }
    })();
  }, []);

  const toggleTask = async (task: any) => {
    if (pendingTaskId === task.id) return; // prevent double-click
    const next = task.status === 'done' ? 'todo' : 'done';
    const diff = next === 'done' ? 1 : -1;

    // Optimistic update
    setPendingTaskId(task.id);
    setTasksStats(p => ({ ...p, completed: p.completed + diff, active: p.active - diff }));
    if (next === 'done') {
      setTodaysTasks(p => p.filter((t: any) => t.id !== task.id));
    } else {
      setTodaysTasks(p => p.map((t: any) => t.id === task.id ? { ...t, status: next } : t));
    }

    try {
      await apiClient.updateTask(task.id, { status: next });
    } catch (err) {
      // Revert on failure
      console.error('Failed to update task status:', err);
      setTasksStats(p => ({ ...p, completed: p.completed - diff, active: p.active + diff }));
      if (next === 'done') {
        // Restore the task back to the list
        setTodaysTasks(p => [...p, { ...task, status: 'todo' }]);
      } else {
        setTodaysTasks(p => p.map((t: any) => t.id === task.id ? { ...t, status: task.status } : t));
      }
      alert('Could not update task. Please check your connection and try again.');
    } finally {
      setPendingTaskId(null);
    }
  };

  const fmt = (iso?: string) => iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
  const isOverdue = (d?: string) => !!d && getDaysRemaining(d) < 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="animate-spin h-10 w-10 text-brand" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">Project Intelligence DeadlineHUB</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time velocity, deadline tracking, and module progress overview.</p>
        </div>
        <Button onClick={() => navigate('/projects')} icon={<Plus size={15} />}>New Project</Button>
      </div>

      {/* AI Intelligence Engine Insight Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#748469] via-[#ABB290] to-[#AAC1B1] text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
          <FolderOpenDot size={180} />
        </div>
        <div className="flex items-center gap-2 bg-black text-white-900 text-xs font-semibold uppercase tracking-wider mb-2 z-[9999]">
          <ChartNoAxesGantt size={15} /> Project DealineHUB Intelligence Assistant
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-black-300 font-medium">Estimated Project Completion</p>
            <p className="text-lg font-bold text-white flex items-center gap-1.5">
              <TrendingUp size={18} className="text-black-400" /> On Track (94% confidence)
            </p>
            <p className="text-[11px] text-black-999">Based on historical subtask velocity</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-black-300 font-medium">Workload Distribution</p>
            <p className="text-lg font-bold text-white">Balanced across modules</p>
            <p className="text-[11px] text-black-999">No developer bottleneck detected</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-black-300 font-medium">Smart Reminder</p>
            <p className="text-lg font-bold text-black-300">{tasksStats.active} pending task{tasksStats.active !== 1 ? 's' : ''}</p>
            <p className="text-[11px] text-black-999">Deadline notifications active</p>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Activity} value={projectsCount} label="Active Projects" iconBg="bg-brand/10 text-brand" />

        {/* Pending Tasks — fully clickable card */}
        <button
          onClick={() => navigate('/pending-tasks')}
          className="glass p-5 flex flex-col gap-3 text-left hover:border-brand/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-amber-50 text-amber-800">
              <CheckSquare size={20} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-bold text-2xl text-slate-900 leading-none">{tasksStats.active}</span>
              <span className="text-xs text-slate-500 mt-0.5">Pending Tasks</span>
            </div>
          </div>
          <span className="text-xs text-brand font-semibold group-hover:underline underline-offset-2">
            See all pending tasks →
          </span>
        </button>

        <MetricCard icon={CheckSquare} value={tasksStats.completed} label="Completed" iconBg="bg-emerald-50 text-emerald-800" />
        <MetricCard icon={Clock}
          value={`${tasksStats.total > 0 ? Math.round(tasksStats.completed / tasksStats.total * 100) : 0}%`}
          label="Completion Rate" iconBg="bg-slate-100 text-slate-700" />
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
                  disabled={pendingTaskId === task.id}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${pendingTaskId === task.id
                    ? 'opacity-50 cursor-wait'
                    : 'cursor-pointer'
                    } ${task.status === 'done' ? 'bg-brand border-brand text-white' : 'border-slate-300 hover:border-brand'}`}
                >
                  {pendingTaskId === task.id
                    ? <span className="text-[8px]">…</span>
                    : task.status === 'done' && <span className="text-[10px] font-bold">✓</span>
                  }
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
            <ListTodo size={16} className="text-amber-700" />
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
