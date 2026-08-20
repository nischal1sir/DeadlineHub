import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient, type AdminNotification } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { ContentLoader } from '../../components/ui/ContentLoader';
import {
  ArrowLeft, User, Mail, Shield, Clock, FolderKanban, CheckSquare,
  Activity, KeyRound, Server, Filter, ChevronLeft, ChevronRight, AlertCircle, RefreshCw
} from 'lucide-react';

export const UserActivityPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [activities, setActivities] = useState<AdminNotification[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [summary, setSummary] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [activeCategory, setActiveCategory] = useState('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchUserTimeline = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiClient.getUserActivityTimeline(userId, page, limit, activeCategory);
      setUserData(data.user);
      setActivities(data.activity || []);
      setTotalLogs(data.totalLogs || 0);
      setSummary(data.summary);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load user activity timeline');
    } finally {
      setLoading(false);
    }
  }, [userId, page, limit, activeCategory]);

  useEffect(() => {
    fetchUserTimeline();
  }, [fetchUserTimeline]);

  const categories = [
    { id: 'all', label: 'All Activities' },
    { id: 'auth', label: 'Auth' },
    { id: 'user', label: 'User' },
    { id: 'admin', label: 'Admin' },
    { id: 'system', label: 'System' },
  ];

  const getActivityIcon = (category: string, action: string) => {
    if (action.includes('LOGIN') || action.includes('LOGOUT') || category === 'auth') {
      return <KeyRound size={16} className="text-blue-600" />;
    }
    if (category === 'admin') {
      return <Shield size={16} className="text-rose-600" />;
    }
    if (category === 'system') {
      return <Server size={16} className="text-slate-600" />;
    }
    return <User size={16} className="text-emerald-600" />;
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'auth': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'user': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'admin': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(totalLogs / limit) || 1;

  if (loading && !userData) {
    return <ContentLoader text="Loading user activity timeline..." />;
  }

  if (errorMsg && !userData) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Button variant="outline" onClick={() => navigate('/admin/users')} className="flex items-center gap-2">
          <ArrowLeft size={16} /> Back to User Management
        </Button>
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
          <AlertCircle size={24} className="text-rose-600 shrink-0" />
          <div>
            <h3 className="font-bold text-base">Error Loading Activity</h3>
            <p className="text-sm mt-0.5">{errorMsg}</p>
          </div>
        </div>
      </div>
    );
  }

  const initials = userData?.full_name
    ? userData.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in space-y-6">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 text-xs"
        >
          <ArrowLeft size={15} /> Back to User Management
        </Button>

        <Button
          variant="outline"
          onClick={fetchUserTimeline}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Timeline
        </Button>
      </div>

      {/* User Header Profile Card */}
      {userData && (
        <div className="rounded-2xl bg-gradient-to-r from-brand-light via-white to-surface border border-brand/20 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-xs">
          <div className="w-20 h-20 rounded-2xl bg-brand flex items-center justify-center text-white text-2xl font-bold shadow-md overflow-hidden shrink-0 ring-4 ring-white">
            {userData.avatar_url ? (
              <img src={userData.avatar_url} alt={userData.full_name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="font-heading font-bold text-2xl text-slate-900">{userData.full_name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                userData.role === 'super_admin'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : userData.role === 'admin'
                  ? 'bg-brand-light text-brand border border-brand/20'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {userData.role.replace('_', ' ')}
              </span>

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                userData.status === 'inactive'
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}>
                {userData.status === 'inactive' ? 'Inactive' : 'Active'}
              </span>
            </div>

            <p className="text-sm text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail size={14} className="text-brand" />
              {userData.email}
            </p>

            <p className="text-xs text-slate-400">
              User ID: <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">{userData.id}</code>
            </p>
          </div>
        </div>
      )}

      {/* Summary Statistics Grid */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FolderKanban size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Owned Projects</p>
                <p className="font-heading font-bold text-xl text-slate-900">{summary.totalProjects}</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <CheckSquare size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Tasks</p>
                <p className="font-heading font-bold text-xl text-slate-900">
                  {summary.completedTasks} <span className="text-xs font-normal text-slate-400">/ {summary.totalTasks}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Task Completion</p>
                <p className="font-heading font-bold text-xl text-slate-900">{summary.completionRate}%</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Last Active</p>
                <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]" title={formatTimestamp(summary.lastActivity)}>
                  {summary.lastActivity ? new Date(summary.lastActivity).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-100">
        <Filter size={15} className="text-slate-400 mr-2 shrink-0" />
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
              activeCategory === cat.id
                ? 'bg-brand text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Activity Timeline List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
          <Activity size={20} className="text-brand" /> Full Activity History ({totalLogs} events)
        </h2>

        {loading ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Activity size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No activity records found for this category</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-6 py-2">
            {activities.map((log) => {
              const categoryClass = getCategoryBadgeClass(log.category);
              return (
                <div key={log.id} className="relative group">
                  {/* Icon Circle Bullet */}
                  <div className="absolute -left-[37px] top-0 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center">
                    {getActivityIcon(log.category, log.action)}
                  </div>

                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 transition group-hover:bg-brand-light/20 group-hover:border-brand/30">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{log.action}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${categoryClass}`}>
                          {log.category}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        {formatTimestamp(log.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {log.details || 'System event recorded'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
            <span className="text-xs text-slate-500 font-medium">
              Page {page} of {totalPages} ({totalLogs} total events)
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="flex items-center gap-1 text-xs"
              >
                <ChevronLeft size={14} /> Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="flex items-center gap-1 text-xs"
              >
                Next <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
