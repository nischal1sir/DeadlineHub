import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, Shield, FolderKanban, CheckSquare,
  UserPlus, ArrowRight, History
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
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
      <div className="p-6 rounded-2xl bg-white-500 text-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand text-xs font-bold uppercase tracking-wider mb-1">
            <img src={logoImg} alt="Logo" className="w-4 h-4" /> Platform Administration & Control Center
          </div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">Platform Health Overview</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Real-time monitoring of registered users, platform projects, administrative actions, and system health status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            Manage Users <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/admin/users')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-brand/50 transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</span>
            <div className="w-9 h-9 rounded-xl bg-brand-light text-brand flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 group-hover:text-brand transition">{stats.totalUsers}</p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <UserPlus size={12} className="text-brand" /> +{stats.newUsersThisMonth} new this month
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/users')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-brand/50 transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Accounts</span>
            <div className="w-9 h-9 rounded-xl bg-brand-light text-brand flex items-center justify-center">
              <UserCheck size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 group-hover:text-brand transition">{stats.activeUsers}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.inactiveUsers} inactive / suspended
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/statistics')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-brand/50 transition cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform Projects</span>
            <div className="w-9 h-9 rounded-xl bg-brand-light   text-brand flex items-center justify-center">
              <FolderKanban size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 group-hover:text-brand transition">{stats.totalProjects}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.completedProjects} completed • {stats.pendingProjects} active
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/statistics')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-brand/50 transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</span>
            <div className="w-9 h-9 rounded-xl bg-brand-light text-brand flex items-center justify-center">
              <CheckSquare size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 group-hover:text-brand transition">{stats.totalTasks}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.completedTasks} completed ({stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%)
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield size={16} className="text-brand" /> Platform Management Shortcuts
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
                className="w-full p-3 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-brand/40 hover:bg-white text-left transition flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-brand flex items-center gap-2">
                    <item.icon size={14} className="text-brand" /> {item.title}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-brand transition shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <History size={16} className="text-brand" /> Recent Platform Activity Logs
            </h2>
            <button
              onClick={() => navigate('/admin/activity-logs')}
              className="text-xs text-brand font-semibold hover:underline"
            >
              View All Logs
            </button>
          </div>

          <div className="space-y-2">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">No recent activity logged.</p>
            ) : (
              recentLogs.map(log => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-800 truncate">{log.details}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="text-brand font-medium">{log.user_name}</span> • <span>{log.action}</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
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
