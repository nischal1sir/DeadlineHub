import React, { useState, useEffect, useCallback } from 'react';
import { apiClient, type AdminNotification } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import {
  Bell, CheckCheck, Trash2, Filter, RefreshCw, ChevronLeft, ChevronRight,
  Shield, User, KeyRound, Server, AlertCircle
} from 'lucide-react';

export const AdminNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [resNotifs, resCount] = await Promise.all([
        apiClient.getAdminNotifications(page, limit),
        apiClient.getAdminNotificationCount()
      ]);
      setNotifications(resNotifs.notifications || []);
      setTotal(resNotifs.total || 0);
      setUnreadCount(resCount.unread || 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch admin notifications');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await apiClient.markAdminNotificationsRead([id]);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      alert(err.message || 'Failed to mark as read');
    }
  };

  const handleClear = async (id: string) => {
    try {
      await apiClient.clearAdminNotifications([id]);
      const target = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotal(prev => Math.max(0, prev - 1));
      if (target && !target.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to clear notification');
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      await apiClient.markAllAdminNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      alert(err.message || 'Failed to mark all as read');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter notifications by category tab (excluding task and project actions for admin)
  const filteredNotifications = notifications.filter(n => {
    if (n.category === 'project' || n.category === 'task') return false;
    if (activeCategory === 'all') return true;
    return n.category === activeCategory;
  });

  const getCategoryBadge = (category: AdminNotification['category']) => {
    switch (category) {
      case 'auth':
        return { label: 'Auth', icon: KeyRound, bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'user':
        return { label: 'User', icon: User, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'admin':
        return { label: 'Admin', icon: Shield, bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: 'System', icon: Server, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const categories = [
    { id: 'all', label: 'All Activities' },
    { id: 'auth', label: 'Authentication' },
    { id: 'user', label: 'Users' },
    { id: 'admin', label: 'Admin Actions' },
    { id: 'system', label: 'System' },
  ];

  const totalPages = Math.ceil(total / limit) || 1;

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading font-bold text-2xl text-slate-900 flex items-center gap-2">
              <Bell size={24} className="text-brand" /> System Notifications Feed
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand text-white shadow-xs">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time feed of all system user registrations, project updates, security events, and role changes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchNotifications}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="primary"
              onClick={handleMarkAllRead}
              disabled={actionLoading}
              className="flex items-center gap-1.5 text-xs"
            >
              <CheckCheck size={16} /> Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-100">
        <Filter size={15} className="text-slate-400 mr-2 shrink-0" />
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
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

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Notifications List Feed */}
      {loading ? (
        <div className="space-y-3 py-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-slate-200 rounded-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-light flex items-center justify-center text-brand mb-3">
            <Bell size={28} />
          </div>
          <h3 className="font-heading font-bold text-slate-800 text-base">No Notifications Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            {activeCategory === 'all'
              ? 'There are no active notification activity logs in the system.'
              : `No activity logs matched the "${activeCategory}" filter category.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(n => {
            const badge = getCategoryBadge(n.category);
            const CategoryIcon = badge.icon;
            const initials = n.user_name
              ? n.user_name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
              : 'S';

            return (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all duration-150 flex items-start gap-4 ${
                  !n.is_read
                    ? 'bg-gradient-to-r from-brand-light/30 via-white to-white border-brand/30 shadow-xs'
                    : 'bg-white border-slate-200 opacity-90'
                }`}
              >
                {/* User Avatar */}
                <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
                  {n.user_avatar ? (
                    <img src={n.user_avatar} alt={n.user_name} className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    initials
                  )}
                </div>

                {/* Content Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-900">{n.user_name}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                      <CategoryIcon size={11} />
                      {badge.label}
                    </span>

                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-brand animate-pulse" title="Unread" />
                    )}

                    <span className="text-xs text-slate-400 ml-auto shrink-0">
                      {formatTimestamp(n.created_at)}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-800">{n.action}</p>
                  {n.details && (
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.details}</p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-center">
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-brand hover:bg-brand-light transition"
                      title="Mark as read"
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}

                  <button
                    onClick={() => handleClear(n.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Dismiss and remove notification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <span className="text-xs text-slate-500 font-medium">
            Page {page} of {totalPages} ({total} total logs)
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
  );
};
