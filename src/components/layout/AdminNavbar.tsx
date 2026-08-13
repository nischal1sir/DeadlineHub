import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, Bell, User as UserIcon, X, CheckCheck, RefreshCw, Filter, Shield, KeyRound, Server, } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiClient, type AdminNotification } from '../../lib/apiClient';

interface AdminNavbarProps {
  onToggleSidebar: () => void;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const [resNotifs, resCount] = await Promise.all([
        apiClient.getAdminNotifications(1, 30),
        apiClient.getAdminNotificationCount()
      ]);
      setNotifications(resNotifs.notifications || []);
      setUnreadCount(resCount.unread || 0);
    } catch {
      // Ignore background fetch errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleMarkRead = async (id: string) => {
    try {
      await apiClient.markAdminNotificationsRead([id]);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const handleClear = async (id: string) => {
    try {
      await apiClient.clearAdminNotifications([id]);
      const target = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (target && !target.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.markAllAdminNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  // Filter notifications (excluding task and project actions for admin)
  const filteredNotifications = notifications.filter(n => {
    if (n.category === 'project' || n.category === 'task') return false;
    if (activeCategory === 'all') return true;
    return n.category === activeCategory;
  });

  const getCategoryBadge = (category: AdminNotification['category']) => {
    switch (category) {
      case 'auth':
        return { label: 'Auth', icon: KeyRound, bg: 'bg-brand-light text-brand border-brand/20' };
      case 'user':
        return { label: 'User', icon: UserIcon, bg: 'bg-accent-light text-slate-700 border-accent/30' };
      case 'admin':
        return { label: 'Admin', icon: Shield, bg: 'bg-cream text-slate-800 border-cream-hover' };
      default:
        return { label: 'System', icon: Server, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'auth', label: 'Auth' },
    { id: 'user', label: 'Users' },
    { id: 'admin', label: 'Admin' },
    { id: 'system', label: 'System' },
  ];

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

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'A';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b border-slate-200 bg-white text-slate-800">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light border border-brand/20 text-brand text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            System Status: Operational
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Floating Notification Panel Toggle */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              if (!notifOpen) fetchNotifications();
            }}
            className={`relative p-2 rounded-xl transition cursor-pointer ${notifOpen ? 'bg-brand/10 text-brand' : 'text-slate-600 hover:text-brand hover:bg-slate-100'
              }`}
            title={unreadCount > 0 ? `${unreadCount} unread notification(s)` : 'System Notifications'}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Floating Notification Panel Drawer */}
          {notifOpen && (
            <div className="fixed inset-x-2 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[420px] bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 overflow-hidden animate-pop-in max-h-[85vh] sm:max-h-[560px] flex flex-col">
              {/* Header */}
              <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <Bell size={15} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold text-slate-900 text-xs sm:text-sm truncate">System Notifications</h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">Platform activity feed</p>
                  </div>
                  {unreadCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand text-white shrink-0">
                      {unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] sm:text-[11px] font-semibold text-slate-600 hover:text-brand hover:bg-brand/5 px-2 py-1 rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1"
                      title="Mark all as read"
                    >
                      <CheckCheck size={11} /> All read
                    </button>
                  )}
                  <button
                    onClick={() => fetchNotifications()}
                    className="p-1 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/5 transition cursor-pointer"
                    title="Refresh"
                  >
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 text-xs font-medium bg-slate-50/40 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0">
                <Filter size={12} className="text-slate-400 mr-1 shrink-0" />
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0 ${activeCategory === cat.id
                        ? 'bg-brand text-white font-semibold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Notification List */}
              <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
                {loading && notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">Loading notifications...</div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="p-6 text-center flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center text-brand mb-2">
                      <Bell size={22} />
                    </div>
                    <p className="text-xs font-semibold text-slate-800">No Notifications</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 max-w-[220px]">
                      {activeCategory === 'all'
                        ? 'No system notifications at this time.'
                        : `No notifications in the "${activeCategory}" category.`}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.slice(0, 20).map(n => {
                    const badge = getCategoryBadge(n.category);
                    const CategoryIcon = badge.icon;
                    const itemInitials = n.user_name
                      ? n.user_name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
                      : 'S';

                    return (
                      <div
                        key={n.id}
                        className={`p-3 transition group flex items-start justify-between gap-2.5 ${!n.is_read
                            ? 'bg-gradient-to-r from-brand-light/30 via-white to-white hover:from-brand-light/50'
                            : 'bg-slate-50/60 hover:bg-slate-100/70'
                          }`}
                      >
                        {/* User Avatar */}
                        <div className="relative shrink-0 mt-0.5">
                          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white text-[10px] font-bold shadow-xs overflow-hidden">
                            {n.user_avatar ? (
                              <img src={n.user_avatar} alt={n.user_name} className="w-full h-full rounded-lg object-cover" />
                            ) : (
                              itemInitials
                            )}
                          </div>
                          {!n.is_read && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand border-2 border-white" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900">{n.user_name}</span>
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${badge.bg}`}>
                              <CategoryIcon size={9} />
                              {badge.label}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-auto shrink-0">
                              {formatTimestamp(n.created_at)}
                            </span>
                          </div>

                          <p className={`text-xs font-semibold truncate ${!n.is_read ? 'text-slate-900' : 'text-slate-500'
                            }`}>{n.action}</p>
                          {n.details && (
                            <p className="text-[11px] text-slate-400 truncate leading-relaxed">{n.details}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-center gap-0.5 shrink-0 self-center">
                          {!n.is_read && (
                            <button
                              onClick={() => handleMarkRead(n.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-brand hover:bg-brand/10 transition cursor-pointer"
                              title="Mark as read"
                            >
                              <CheckCheck size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => handleClear(n.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Dismiss"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition border border-slate-200"
          >
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800">{user?.full_name?.split(' ')[0]}</span>
              <span className="text-[10px] text-brand font-semibold uppercase">{user?.role?.replace('_', ' ')}</span>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 shadow-xl rounded-xl py-1 text-slate-700 animate-pop-in z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-brand-light text-brand border border-brand/20 uppercase">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/admin/profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition font-medium"
                >
                  <UserIcon size={14} className="text-brand" /> My Profile
                </button>
              </div>

              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition font-medium"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
