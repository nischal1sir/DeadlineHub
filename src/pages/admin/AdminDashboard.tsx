import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, Shield, FolderKanban, CheckSquare,
  UserPlus, ArrowRight, ShieldCheck, History
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [s, logs] = await Promise.all([
          apiClient.getPlatformStats(),
          apiClient.getActivityLogs()
        ]);
        setStats(s);
        setRecentLogs(logs.slice(0, 5));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <svg className="animate-spin h-8 w-8 text-emerald-500 mb-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-xs">Loading platform administration overview...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck size={16} /> Platform Administration & Control Center
          </div>
          <h1 className="font-heading font-bold text-2xl text-white">Platform Health Overview</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Real-time monitoring of registered users, platform projects, administrative actions, and system health status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
          >
            Manage Users <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/admin/users')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold text-white group-hover:text-emerald-400 transition">{stats.totalUsers}</p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <UserPlus size={12} className="text-emerald-400" /> +{stats.newUsersThisMonth} new this month
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/users')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Accounts</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <UserCheck size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold text-white group-hover:text-emerald-400 transition">{stats.activeUsers}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.inactiveUsers} inactive / suspended
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/statistics')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Platform Projects</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FolderKanban size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold text-white group-hover:text-blue-400 transition">{stats.totalProjects}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.completedProjects} completed • {stats.pendingProjects} active
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/statistics')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tasks</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CheckSquare size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold text-white group-hover:text-purple-400 transition">{stats.totalTasks}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.completedTasks} completed ({stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%)
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
            <Shield size={16} className="text-emerald-400" /> Platform Management Shortcuts
          </h2>

          <div className="space-y-2">
            {[
              { title: 'User Management', desc: 'Activate, deactivate, reset passwords, or delete users', path: '/admin/users', icon: Users },
              { title: 'Admin & Role Management', desc: 'Create new admins and manage Super Admin privileges', path: '/admin/admins', icon: Shield },
              { title: 'Platform Statistics', desc: 'Inspect project completion & user metrics', path: '/admin/statistics', icon: FolderKanban },
              { title: 'Activity Audit Logs', desc: 'Monitor registrations, logins, and system events', path: '/admin/activity-logs', icon: History }
            ].map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left transition flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 flex items-center gap-2">
                    <item.icon size={14} className="text-emerald-400" /> {item.title}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <ArrowRight size={14} className="text-slate-600 group-hover:text-emerald-400 transition shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <History size={16} className="text-emerald-400" /> Recent Platform Activity Logs
            </h2>
            <button
              onClick={() => navigate('/admin/activity-logs')}
              className="text-xs text-emerald-400 font-semibold hover:underline"
            >
              View All Logs
            </button>
          </div>

          <div className="space-y-2">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">No recent activity logged.</p>
            ) : (
              recentLogs.map(log => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-200 truncate">{log.details}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="text-emerald-400 font-medium">{log.user_name}</span> • <span>{log.action}</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
