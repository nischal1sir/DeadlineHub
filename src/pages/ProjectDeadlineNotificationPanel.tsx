import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, Clock, X, CheckCircle2, ShieldAlert, ChevronRight, Layers, ListTodo } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

export interface DeadlineNotification {
  id: string;
  type: 'project' | 'subtask' | 'task';
  title: string;
  subtitle: string;
  projectName: string;
  projectId: string;
  dueDate: string;
  daysRemaining: number; // < 0 means overdue, 0 means today, 1..7 means upcoming
  priority?: string;
}

interface NotificationPanelProps {
  notifications: DeadlineNotification[];
  onNotificationClick?: (projectId: string) => void;
  className?: string;
}

const STORAGE_KEY = 'deadlinehub_cleared_notifications';

export const ProjectDeadlineNotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onNotificationClick,
  className = ''
}) => {
  const navigate = useNavigate();
  const [clearedIds, setClearedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<'all' | 'project' | 'subtask'>('all');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clearedIds));
    } catch (e) {
      console.error('Failed to save cleared notifications to localStorage', e);
    }
  }, [clearedIds]);

  // Filter out notifications cleared by user
  const visibleNotifications = notifications.filter(n => !clearedIds.includes(n.id));

  // Tab filtering
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

  const handleCardClick = (projectId: string) => {
    if (onNotificationClick) {
      onNotificationClick(projectId);
    } else {
      navigate(`/projects/${projectId}`);
    }
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
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
          <ShieldAlert size={12} /> Overdue by {Math.abs(days)}d
        </span>
      );
    }
    if (days === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
          <Clock size={12} /> Due Today!
        </span>
      );
    }
    if (days <= 2) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 border border-orange-200">
          <Clock size={12} /> Due in {days}d
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
        <Calendar size={12} /> In {days} days
      </span>
    );
  };

  return (
    <div className={`rounded-2xl border border-slate-200/90 bg-white/90 shadow-sm backdrop-blur-md overflow-hidden ${className}`}>
      {/* Panel Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/80 to-brand-light/20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <Bell size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-slate-900 text-base">7-Day Deadline Notifications</h3>
              {visibleNotifications.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand text-white shadow-2xs">
                  {visibleNotifications.length}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Projects and subtasks due within 7 days
            </p>
          </div>
        </div>

        {/* Clear All & Filters */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {filteredNotifications.length > 0 && (
            <button
              onClick={clearAllVisible}
              className="text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 transition cursor-pointer flex items-center gap-1"
              title="Clear all displayed notifications"
            >
              <X size={13} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-2 border-b border-slate-100 text-xs font-medium bg-slate-50/40">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
            activeTab === 'all'
              ? 'bg-brand text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({visibleNotifications.length})
        </button>
        <button
          onClick={() => setActiveTab('project')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
            activeTab === 'project'
              ? 'bg-brand text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers size={13} /> Projects ({visibleNotifications.filter(n => n.type === 'project').length})
        </button>
        <button
          onClick={() => setActiveTab('subtask')}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
            activeTab === 'subtask'
              ? 'bg-brand text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ListTodo size={13} /> Subtasks & Tasks ({visibleNotifications.filter(n => n.type !== 'project').length})
        </button>
      </div>

      {/* List Body */}
      <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <CheckCircle2 size={36} className="text-emerald-500 mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-800">All clear!</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              {clearedIds.length > 0 && visibleNotifications.length === 0
                ? 'All 7-day notifications have been cleared.'
                : 'No projects or subtasks are due within the next 7 days.'}
            </p>
            {clearedIds.length > 0 && (
              <button
                onClick={() => setClearedIds([])}
                className="mt-3 text-xs font-semibold text-brand hover:underline cursor-pointer"
              >
                Restore cleared notifications
              </button>
            )}
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => handleCardClick(notification.projectId)}
              className="p-3.5 sm:p-4 hover:bg-slate-50/80 transition cursor-pointer group flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {/* Icon badge */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    notification.type === 'project'
                      ? 'bg-blue-100 text-blue-700'
                      : notification.type === 'subtask'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {notification.type === 'project' ? (
                    <Layers size={16} />
                  ) : (
                    <ListTodo size={16} />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {notification.type === 'project' ? 'Project Deadline' : notification.type === 'subtask' ? 'Subtask Deadline' : 'Task Deadline'}
                    </span>
                    {notification.priority && (
                      <Badge type="priority" value={notification.priority} />
                    )}
                    {getUrgencyBadge(notification.daysRemaining)}
                  </div>

                  <p className="text-sm font-semibold text-slate-900 group-hover:text-brand transition truncate">
                    {notification.title}
                  </p>

                  <p className="text-xs text-slate-500 line-clamp-1">
                    {notification.subtitle} • Project: <span className="font-medium text-slate-700">{notification.projectName}</span>
                  </p>

                  <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-0.5">
                    <Calendar size={11} /> Due: {fmtDate(notification.dueDate)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0 self-center">
                <button
                  onClick={(e) => clearSingleNotification(e, notification.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Clear notification"
                >
                  <X size={15} />
                </button>
                <div className="p-1.5 text-slate-300 group-hover:text-slate-600 transition">
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
