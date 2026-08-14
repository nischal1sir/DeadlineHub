import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, Shield, FolderKanban, CheckSquare,
  UserPlus, ArrowRight, History
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [stats, setStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  useEffect(() => {
    const notice = sessionStorage.getItem('admin_password_reset_notice');
    if (notice) {
      setAdminNotice(notice);
      sessionStorage.removeItem('admin_password_reset_notice');
    }
  }, []);

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
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {adminNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-amber-600 shrink-0" />
            <span>{adminNotice}</span>
          </div>
          <button onClick={() => setAdminNotice(null)} className="text-amber-700 hover:text-amber-950 text-xs font-bold px-2 py-1 rounded bg-amber-100/60 cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white text-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-brand text-xs font-bold uppercase tracking-wider mb-1">
            <img src={logoImg} alt="Logo" className="w-4 h-4 shrink-0" />
            <span className="truncate">Platform Administration & Control Center</span>
          </div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-slate-900">Platform Health Overview</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            Real-time monitoring of registered users, platform projects, administrative actions, and system health status.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/admin/users')}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            Manage Users <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => navigate('/admin/users')}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-brand/50 transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
              <Users size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 group-hover:text-brand transition">{stats.totalUsers}</p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <UserPlus size={12} className="text-brand shrink-0" /> +{stats.newUsersThisMonth} new this month
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/users')}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-brand/50 transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Accounts</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
              <UserCheck size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 group-hover:text-brand transition">{stats.activeUsers}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.inactiveUsers} inactive / suspended
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/statistics')}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-brand/50 transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform Projects</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
              <FolderKanban size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 group-hover:text-brand transition">{stats.totalProjects}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.completedProjects} completed • {stats.pendingProjects} active
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/statistics')}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-brand/50 transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
              <CheckSquare size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 group-hover:text-brand transition">{stats.totalTasks}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.completedTasks} completed ({stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%)
          </p>
        </div>
      </div>

      {/* Main Content Grid: Shortcuts + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Platform Management Shortcuts */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield size={16} className="text-brand shrink-0" /> Platform Management Shortcuts
          </h2>

          <div className="space-y-2">
            {[
              { title: 'User Management', desc: 'Activate, deactivate, reset passwords, or delete users', path: '/admin/users', icon: Users },
              ...(isSuperAdmin ? [{ title: 'Admin & Role Management', desc: 'Create new admins and manage Super Admin privileges', path: '/admin/admins', icon: Shield }] : []),
              { title: 'Platform Statistics', desc: 'Inspect project completion & user metrics', path: '/admin/statistics', icon: FolderKanban },
              ...(isSuperAdmin ? [{ title: 'Activity Audit Logs', desc: 'Monitor registrations, logins, and system events', path: '/admin/activity-logs', icon: History }] : []),
            ].map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full p-3 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-brand/40 hover:bg-white text-left transition flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 group-hover:text-brand flex items-center gap-2">
                    <item.icon size={14} className="text-brand shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{item.desc}</p>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-brand transition shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Platform Activity Logs */}
        <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 min-w-0">
              <History size={16} className="text-brand shrink-0" />
              <span className="truncate">Recent Platform Activity Logs</span>
            </h2>
            {/* View All Logs link only for Super Admin */}
            {isSuperAdmin && (
              <button
                onClick={() => navigate('/admin/activity-logs')}
                className="text-xs text-brand font-semibold hover:underline cursor-pointer shrink-0"
              >
                View All Logs
              </button>
            )}
          </div>

          <div className="space-y-2">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">No recent activity logged.</p>
            ) : (
              recentLogs.map(log => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 text-xs leading-snug break-words">{log.details}</p>
                    <p className="text-[10px] text-slate-500 flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-brand font-medium truncate max-w-[160px] sm:max-w-none">{log.user_name}</span>
                      <span className="text-slate-300">•</span>
                      <span className="truncate max-w-[160px] sm:max-w-none">{log.action}</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 self-start sm:self-auto font-mono bg-slate-100 sm:bg-transparent px-1.5 sm:px-0 py-0.5 sm:py-0 rounded">
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
