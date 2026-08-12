import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, BellOff, User, LogOut, Menu, X, CheckCircle2, Check, ShieldAlert, Calendar, Clock, Layers, ListTodo, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../lib/apiClient';
import { Badge } from '../ui/Badge';
import type { DeadlineNotification } from '../dashboard/ProjectDeadlineNotificationPanel';
import { getDaysRemaining } from '../../lib/dateUtils';

interface NavbarProps {
  onToggleSidebar: () => void;
}


export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<DeadlineNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'project' | 'subtask'>('all');
  const [readIds, setReadIds] = useState<string[]>([]);
  const [clearedIds, setClearedIds] = useState<string[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const loadNotificationState = async () => {
    if (!user) return;
    try {
      const { deadlines, readIds: r, clearedIds: c } = await apiClient.getNotifications();
      const processed: DeadlineNotification[] = deadlines
        .map(d => ({
          ...d,
          daysRemaining: getDaysRemaining(d.dueDate)
        }))
        .filter(d => d.daysRemaining <= 7);

      processed.sort((a, b) => a.daysRemaining - b.daysRemaining);
      setNotifications(processed);
      setReadIds(r);
      setClearedIds(c);
    } catch (err) {
      console.error('Failed loading notifications in Navbar', err);
    }
  };

  useEffect(() => {
    loadNotificationState();
  }, [user]);

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

  const visibleNotifications = notifications.filter(n => !clearedIds.includes(n.id));
  // Unread = visible and not yet read
  const unreadNotifications = visibleNotifications.filter(n => !readIds.includes(n.id));
  const unreadCount = unreadNotifications.length;

  const filteredNotifications = visibleNotifications.filter(n => {
    if (activeTab === 'project') return n.type === 'project';
    if (activeTab === 'subtask') return n.type === 'subtask' || n.type === 'task';
    return true;
  });

  const clearSingleNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setClearedIds(prev => [...prev, id]);
    setReadIds(prev => prev.filter(rid => rid !== id));
    // persist server-side
    apiClient.markNotificationsCleared([id]).catch(console.error);
  };

  const clearAllVisible = () => {
    const idsToClear = filteredNotifications.map(n => n.id);
    setClearedIds(prev => Array.from(new Set([...prev, ...idsToClear])));
    setReadIds(prev => prev.filter(rid => !idsToClear.includes(rid)));
    apiClient.markNotificationsCleared(idsToClear).catch(console.error);
  };

  const markAsRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setReadIds(prev => Array.from(new Set([...prev, id])));
    apiClient.markNotificationsRead([id]).catch(console.error);
  };

  const markAllAsRead = () => {
    const ids = filteredNotifications.map(n => n.id);
    setReadIds(prev => Array.from(new Set([...prev, ...ids])));
    apiClient.markNotificationsRead(ids).catch(console.error);
  };

  const handleItemClick = (n: DeadlineNotification) => {
    setReadIds(prev => Array.from(new Set([...prev, n.id])));
    apiClient.markNotificationsRead([n.id]).catch(console.error);
    setNotifOpen(false);
    navigate(`/projects/${n.projectId}`);
  };

  const fmtDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  const getUrgencyBadge = (days: number) => {
    if (days < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
          <ShieldAlert size={10} /> Overdue by {Math.abs(days)}d
        </span>
      );
    }
    if (days === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
          <Clock size={10} /> Due Today!
        </span>
      );
    }
    if (days <= 2) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
          <Clock size={10} /> Due in {days}d
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
        <Calendar size={10} /> In {days}d
      </span>
    );
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-14 px-5 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <span className="lg:hidden font-heading font-bold text-slate-900">
          Deadline<span className="text-brand">Hub</span>
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Bell Notification Toggle Button */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              if (!notifOpen) loadNotificationState();
            }}
            title={unreadCount > 0 ? `${unreadCount} deadline notification(s)` : 'Notifications'}
            className={`relative p-2 rounded-xl transition cursor-pointer ${
              notifOpen ? 'bg-brand/10 text-brand' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-bold leading-none shadow-2xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Popup Notification Panel Drawer */}
          {notifOpen && (
            <div className="fixed inset-x-2 top-14 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[400px] bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 overflow-hidden animate-pop-in max-h-[85vh] sm:max-h-[520px] flex flex-col">
              {/* Drawer Header */}
              <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <Bell size={15} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold text-slate-900 text-xs sm:text-sm truncate">Notifications</h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">Deadlines approaching within 7 days</p>
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
                      onClick={markAllAsRead}
                      className="text-[10px] sm:text-[11px] font-semibold text-slate-600 hover:text-brand hover:bg-brand/5 px-2 py-1 rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1"
                      title="Mark all as read"
                    >
                      <Check size={11} /> All read
                    </button>
                  )}
                  {filteredNotifications.length > 0 && (
                    <button
                      onClick={clearAllVisible}
                      className="text-[10px] sm:text-[11px] font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1"
                      title="Clear all"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 text-xs font-medium bg-slate-50/40 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0 ${
                    activeTab === 'all'
                      ? 'bg-brand text-white font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All ({visibleNotifications.length})
                </button>
                <button
                  onClick={() => setActiveTab('project')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 shrink-0 ${
                    activeTab === 'project'
                      ? 'bg-brand text-white font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Layers size={12} /> Projects ({visibleNotifications.filter(n => n.type === 'project').length})
                </button>
                <button
                  onClick={() => setActiveTab('subtask')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 shrink-0 ${
                    activeTab === 'subtask'
                      ? 'bg-brand text-white font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ListTodo size={12} /> Subtasks ({visibleNotifications.filter(n => n.type !== 'project').length})
                </button>
              </div>

              {/* Notification List */}
              <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="p-6 text-center flex flex-col items-center justify-center">
                    <CheckCircle2 size={32} className="text-emerald-500 mb-1.5 opacity-80" />
                    <p className="text-xs font-semibold text-slate-800">All caught up!</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 max-w-[220px]">
                      {clearedIds.length > 0 && visibleNotifications.length === 0
                        ? 'All 7-day notifications have been cleared.'
                        : 'No project or subtask deadlines due within the next 7 days.'}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map(n => {
                    const isRead = readIds.includes(n.id);
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleItemClick(n)}
                        className={`p-3 transition cursor-pointer group flex items-start justify-between gap-2.5 ${
                          isRead ? 'bg-slate-50/60 hover:bg-slate-100/70' : 'hover:bg-brand-light/30'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          {/* Unread indicator dot */}
                          <div className="relative shrink-0 mt-1.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                n.type === 'project'
                                  ? 'bg-blue-100 text-blue-700'
                                  : n.type === 'subtask'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-amber-100 text-amber-800'
                              } ${isRead ? 'opacity-60' : ''}`}
                            >
                              {n.type === 'project' ? <Layers size={14} /> : <ListTodo size={14} />}
                            </div>
                            {!isRead && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand border-2 border-white" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                {n.type === 'project' ? 'Project' : n.type === 'subtask' ? 'Subtask' : 'Task'}
                              </span>
                              {n.priority && <Badge type="priority" value={n.priority} />}
                              {getUrgencyBadge(n.daysRemaining)}
                              {isRead && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
                                  <BellOff size={9} /> Read
                                </span>
                              )}
                            </div>

                            <p className={`text-xs font-semibold transition truncate ${
                              isRead ? 'text-slate-400 group-hover:text-slate-500' : 'text-slate-900 group-hover:text-brand'
                            }`}>
                              {n.title}
                            </p>

                            <p className="text-[11px] text-slate-400 truncate">
                              {n.subtitle} • <span className="font-medium text-slate-500">{n.projectName}</span>
                            </p>

                            <p className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                              <Calendar size={10} /> Due: {fmtDate(n.dueDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-1 shrink-0 self-center">
                          {!isRead && (
                            <button
                              onClick={e => markAsRead(e, n.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-brand hover:bg-brand/10 transition cursor-pointer"
                              title="Mark as read"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button
                            onClick={e => clearSingleNotification(e, n.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Clear notification"
                          >
                            <X size={14} />
                          </button>
                          <ChevronRight size={13} className="text-slate-300 group-hover:text-slate-500 transition" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700">
              {user?.full_name?.split(' ')[0] ?? 'User'}
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-lg rounded-xl py-1 animate-pop-in z-50">
              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-brand-light transition"
              >
                <User size={14} /> My Profile
              </Link>
              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
