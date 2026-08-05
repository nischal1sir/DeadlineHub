import React, { useEffect, useState } from 'react';
import {
  BarChart3, Users, UserCheck, UserX, FolderKanban, CheckSquare,
  Clock, AlertTriangle, TrendingUp, Sparkles, PieChart
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

export const PlatformStatisticsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const s = await apiClient.getPlatformStats();
        setStats(s);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !stats) {
    return <div className="p-12 text-center text-slate-400 text-xs">Loading platform statistics...</div>;
  }

  const projectCompletionRate = stats.totalProjects > 0 ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0;
  const taskCompletionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
          <BarChart3 size={14} /> Analytics & System Metrics
        </div>
        <h1 className="font-heading font-bold text-2xl text-white">Platform Statistics</h1>
        <p className="text-xs text-slate-400 mt-1">
          Comprehensive real-time analytics across all user accounts, projects, task completion rates, and platform activity.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.totalUsers, sub: `${stats.newUsersThisMonth} new this month`, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Active Users', value: stats.activeUsers, sub: `${stats.inactiveUsers} inactive`, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Inactive Users', value: stats.inactiveUsers, sub: 'Suspended / Deactivated', icon: UserX, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          { label: 'New Users (Month)', value: stats.newUsersThisMonth, sub: 'Joined this month', icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10' },

          { label: 'Total Projects', value: stats.totalProjects, sub: `${stats.completedProjects} completed`, icon: FolderKanban, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Completed Projects', value: stats.completedProjects, sub: `${projectCompletionRate}% rate`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Pending Projects', value: stats.pendingProjects, sub: 'In progress', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Overdue Projects', value: stats.overdueProjects, sub: 'Past deadline', icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        ].map(item => (
          <div key={item.label} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.label}</span>
              <div className={`w-8 h-8 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                <item.icon size={16} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{item.value}</p>
            <p className="text-[11px] text-slate-500">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="font-bold text-white text-sm flex items-center gap-2">
            <PieChart size={16} className="text-emerald-400" /> Project Completion Velocity
          </h2>
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Completed Projects ({stats.completedProjects})</span>
            <span className="font-bold text-emerald-400">{projectCompletionRate}%</span>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${projectCompletionRate}%` }} />
          </div>
          <p className="text-[11px] text-slate-500">{stats.pendingProjects} projects currently in progress across the platform.</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="font-bold text-white text-sm flex items-center gap-2">
            <CheckSquare size={16} className="text-purple-400" /> Task Completion Rate
          </h2>
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Completed Tasks ({stats.completedTasks} / {stats.totalTasks})</span>
            <span className="font-bold text-purple-400">{taskCompletionRate}%</span>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
            <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${taskCompletionRate}%` }} />
          </div>
          <p className="text-[11px] text-slate-500">Tasks assigned to platform users.</p>
        </div>
      </div>
    </div>
  );
};
