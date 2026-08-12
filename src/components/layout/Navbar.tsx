import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, User, LogOut, Menu, X, CheckCircle2, ShieldAlert, Calendar, Clock, Layers, ListTodo, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../lib/apiClient';
import { Badge } from '../ui/Badge';
import type { DeadlineNotification } from '../dashboard/ProjectDeadlineNotificationPanel';

interface NavbarProps {
  onToggleSidebar: () => void;
}

const STORAGE_KEY = 'deadlinehub_cleared_notifications';

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<DeadlineNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'project' | 'subtask'>('all');

  const [clearedIds, setClearedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const projs = await apiClient.getProjects();
      const list: DeadlineNotification[] = [];
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      for (const p of projs) {
        // Project deadline
        if (p.status !== 'completed' && (p.due_date || p.deadline)) {
          const pDateStr = p.due_date || p.deadline;
          const pDate = new Date(pDateStr);
          pDate.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((pDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 7) {
            list.push({
              id: `proj-${p.id}`,
              type: 'project',
              title: p.name,
              subtitle: p.description || 'Project deadline approaching',
              projectName: p.name,
              projectId: p.id,
              dueDate: pDateStr,
              daysRemaining: diffDays
            });
          }
        }

        // Tasks & Subtasks
        const tList = await apiClient.getTasksForProject(p.id);
        for (const task of tList) {
          if (task.status !== 'done' && task.due_date) {
            const tDate = new Date(task.due_date);
            tDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((tDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays <= 7) {
              list.push({
                id: `task-${task.id}`,
                type: 'task',
                title: task.title,
                subtitle: `Task in project "${p.name}"`,
                projectName: p.name,
                projectId: p.id,
                dueDate: task.due_date,
                daysRemaining: diffDays,
                priority: task.priority
              });
            }
          }

          if (task.subtasks && Array.isArray(task.subtasks)) {
            for (const sub of task.subtasks) {
              if (!sub.is_completed) {
                const subDueDate = sub.due_date || task.due_date;
                if (subDueDate) {
                  const sDate = new Date(subDueDate);
                  sDate.setHours(0, 0, 0, 0);
                  const diffDays = Math.ceil((sDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  if (diffDays <= 7) {
                    list.push({
                      id: `subtask-${sub.id}`,
                      type: 'subtask',
                      title: sub.title,
                      subtitle: `Subtask under "${task.title}"`,
                      projectName: p.name,
                      projectId: p.id,
                      dueDate: subDueDate,
                      daysRemaining: diffDays,
                      priority: task.priority
                    });
                  }
                }
              }
            }
          }
        }
      }

      list.sort((a, b) => a.daysRemaining - b.daysRemaining);
      setNotifications(list);
    } catch (err) {
      console.error('Failed loading notifications in Navbar', err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clearedIds));
    } catch (e) {
      console.error(e);
    }
  }, [clearedIds]);

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
  const unreadCount = visibleNotifications.length;

  const filteredNotifications = visibleNotifications.filter(n => {
    if (activeTab === 'project') return n.type === 'project';
    if (activeTab === 'subtask') return n.type === 'subtask' || n.type === 'task';
    return true;
  });

  const clearSingleNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setClearedIds(prev => [...prev, id]);
  };

  const clearAllVisible = () => {
    const idsToClear = filteredNotifications.map(n => n.id);
    setClearedIds(prev => Array.from(new Set([...prev, ...idsToClear])));
  };

  const handleItemClick = (projectId: string) => {
    setNotifOpen(false);
    navigate(`/projects/${projectId}`);
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
              if (!notifOpen) loadNotifications();
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
                  {filteredNotifications.length > 0 && (
                    <button
                      onClick={clearAllVisible}
                      className="text-[10px] sm:text-[11px] font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1"
                    >
                      Clear all
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
              <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="p-6 text-center flex flex-col items-center justify-center">
                    <CheckCircle2 size={32} className="text-emerald-500 mb-1.5 opacity-80" />
                    <p className="text-xs font-semibold text-slate-800">All caught up!</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 max-w-[220px]">
                      {clearedIds.length > 0 && visibleNotifications.length === 0
                        ? 'All 7-day notifications have been cleared.'
                        : 'No project or subtask deadlines due within the next 7 days.'}
                    </p>
                    {clearedIds.length > 0 && (
                      <button
                        onClick={() => setClearedIds([])}
                        className="mt-2 text-[11px] font-semibold text-brand hover:underline cursor-pointer"
                      >
                        Restore cleared notifications
                      </button>
                    )}
                  </div>
                ) : (
                  filteredNotifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleItemClick(n.projectId)}
                      className="p-3 hover:bg-slate-50 transition cursor-pointer group flex items-start justify-between gap-2.5"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            n.type === 'project'
                              ? 'bg-blue-100 text-blue-700'
                              : n.type === 'subtask'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {n.type === 'project' ? <Layers size={14} /> : <ListTodo size={14} />}
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              {n.type === 'project' ? 'Project' : n.type === 'subtask' ? 'Subtask' : 'Task'}
                            </span>
                            {n.priority && <Badge type="priority" value={n.priority} />}
                            {getUrgencyBadge(n.daysRemaining)}
                          </div>

                          <p className="text-xs font-semibold text-slate-900 group-hover:text-brand transition truncate">
                            {n.title}
                          </p>

                          <p className="text-[11px] text-slate-500 truncate">
                            {n.subtitle} • <span className="font-medium text-slate-700">{n.projectName}</span>
                          </p>

                          <p className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                            <Calendar size={10} /> Due: {fmtDate(n.dueDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0 self-center">
                        <button
                          onClick={e => clearSingleNotification(e, n.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Clear notification"
                        >
                          <X size={14} />
                        </button>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition" />
                      </div>
                    </div>
                  ))
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
