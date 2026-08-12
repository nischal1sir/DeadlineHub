import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckSquare, Clock, AlertTriangle, Search,
  Filter, ChevronDown, Loader2, FolderOpen
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { Badge } from '../components/ui/Badge';
import { toLocalDateString, getDaysRemaining } from '../lib/dateUtils';

type SortKey = 'due_date' | 'priority' | 'project';
type FilterPriority = 'all' | 'high' | 'medium' | 'low';

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export const PendingTasksPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('due_date');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // ── Single server-side fetch ─────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const data = await apiClient.getPendingTasks();
        setTasks(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load pending tasks.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Mark task done (optimistic) ─────────────────────────
  const markDone = async (task: any) => {
    if (pendingId === task.id) return;
    setPendingId(task.id);
    setTasks(prev => prev.filter(t => t.id !== task.id));
    try {
      await apiClient.updateTask(task.id, { status: 'done' });
    } catch {
      setTasks(prev => [task, ...prev]);
      alert('Could not update task. Please check your connection.');
    } finally {
      setPendingId(null);
    }
  };

  // ── Utils ───────────────────────────────────────────────
  const fmt = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString(undefined, {
          month: 'short', day: 'numeric', year: 'numeric',
        })
      : '—';

  const urgencyInfo = (d?: string) => {
    if (!d) return null;
    const days = getDaysRemaining(d);
    if (days < 0)  return { label: `${Math.abs(days)}d overdue`, cls: 'bg-rose-100 text-rose-700' };
    if (days === 0) return { label: 'Due today',                 cls: 'bg-amber-100 text-amber-700' };
    if (days <= 3)  return { label: `${days}d left`,             cls: 'bg-orange-100 text-orange-700' };
    return           { label: `${days}d left`,                   cls: 'bg-slate-100 text-slate-500' };
  };

  // ── Filter + Sort ────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = [...tasks];
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.projectName || '').toLowerCase().includes(q)
      );
    }
    if (filterPriority !== 'all') r = r.filter(t => t.priority === filterPriority);
    r.sort((a, b) => {
      if (sortBy === 'due_date') {
        const aD = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const bD = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return aD - bD;
      }
      if (sortBy === 'priority') {
        return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
      }
      return (a.projectName || '').localeCompare(b.projectName || '');
    });
    return r;
  }, [tasks, search, sortBy, filterPriority]);

  const todayStr = toLocalDateString(new Date());
  const overdueCount  = tasks.filter(t => t.due_date && getDaysRemaining(t.due_date) < 0).length;
  const dueTodayCount = tasks.filter(t => t.due_date && toLocalDateString(t.due_date) === todayStr).length;

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">

      {/* Back */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand font-medium transition-colors group"
        >
          <span className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center group-hover:border-brand/40 group-hover:bg-brand-light transition-all shadow-xs">
            <ArrowLeft size={15} />
          </span>
          Back to Dashboard
        </button>
      </div>

      {/* Title */}
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-slate-900">Pending Tasks</h1>
        <p className="text-sm text-slate-500 mt-0.5">All unfinished tasks across your projects.</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-center gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
          <button
            className="ml-auto text-xs underline"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary chips */}
      {!loading && !error && (
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-xs">
            <CheckSquare size={15} className="text-brand" />
            <span className="text-sm font-semibold text-slate-800">{tasks.length}</span>
            <span className="text-xs text-slate-500">total pending</span>
          </div>
          {dueTodayCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
              <Clock size={15} className="text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">{dueTodayCount}</span>
              <span className="text-xs text-amber-600">due today</span>
            </div>
          )}
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2">
              <AlertTriangle size={15} className="text-rose-600" />
              <span className="text-sm font-semibold text-rose-700">{overdueCount}</span>
              <span className="text-xs text-rose-600">overdue</span>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks or projects…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/10 transition placeholder:text-slate-400"
          />
        </div>

        {/* Sort */}
        <div className="relative">
          <button
            onClick={() => { setShowSortMenu(s => !s); setShowFilterMenu(false); }}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white hover:border-brand/40 transition font-medium text-slate-700"
          >
            <Clock size={14} />
            Sort: {sortBy === 'due_date' ? 'Due Date' : sortBy === 'priority' ? 'Priority' : 'Project'}
            <ChevronDown size={13} className={`transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
          </button>
          {showSortMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
              {(['due_date', 'priority', 'project'] as SortKey[]).map(k => (
                <button
                  key={k}
                  onClick={() => { setSortBy(k); setShowSortMenu(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-brand-light transition ${sortBy === k ? 'font-semibold text-brand' : 'text-slate-700'}`}
                >
                  {k === 'due_date' ? 'Due Date' : k === 'priority' ? 'Priority' : 'Project'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority filter */}
        <div className="relative">
          <button
            onClick={() => { setShowFilterMenu(s => !s); setShowSortMenu(false); }}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-xl border transition font-medium ${
              filterPriority !== 'all'
                ? 'border-brand bg-brand-light text-brand'
                : 'border-slate-200 bg-white text-slate-700 hover:border-brand/40'
            }`}
          >
            <Filter size={14} />
            {filterPriority === 'all' ? 'All priorities' : `${filterPriority.charAt(0).toUpperCase() + filterPriority.slice(1)} only`}
            <ChevronDown size={13} className={`transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
          </button>
          {showFilterMenu && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
              {(['all', 'high', 'medium', 'low'] as FilterPriority[]).map(p => (
                <button
                  key={p}
                  onClick={() => { setFilterPriority(p); setShowFilterMenu(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-brand-light transition flex items-center gap-2 ${filterPriority === p ? 'font-semibold text-brand' : 'text-slate-700'}`}
                >
                  {p !== 'all' && (
                    <span className={`w-2 h-2 rounded-full ${p === 'high' ? 'bg-rose-500' : p === 'medium' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                  )}
                  {p === 'all' ? 'All priorities' : `${p.charAt(0).toUpperCase() + p.slice(1)} priority`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <Loader2 size={28} className="animate-spin text-brand" />
          <p className="text-sm text-slate-400">Loading pending tasks…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass p-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-light flex items-center justify-center mb-4">
            {tasks.length === 0
              ? <CheckSquare size={24} className="text-brand" />
              : <Search size={24} className="text-brand" />
            }
          </div>
          <p className="font-semibold text-slate-700 text-base">
            {tasks.length === 0 ? 'All done! No pending tasks.' : 'No matching tasks found.'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {tasks.length === 0
              ? 'Great work keeping up with your deadlines.'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="glass overflow-hidden">
          {filtered.map((task, idx) => {
            const urgency = urgencyInfo(task.due_date);
            const isPending = pendingId === task.id;
            return (
              <div
                key={task.id}
                className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-brand-light/40 ${
                  idx !== filtered.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => markDone(task)}
                  disabled={isPending}
                  title="Mark as done"
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                    isPending
                      ? 'opacity-50 cursor-wait border-brand bg-brand/20'
                      : 'border-slate-300 hover:border-brand cursor-pointer'
                  }`}
                >
                  {isPending && <Loader2 size={10} className="animate-spin text-brand" />}
                </button>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <FolderOpen size={11} className="text-slate-400 shrink-0" />
                    <p
                      className="text-xs text-slate-400 truncate hover:text-brand cursor-pointer transition-colors"
                      onClick={() => navigate(`/projects/${task.projectId}`)}
                    >
                      {task.projectName}
                    </p>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {urgency && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${urgency.cls}`}>
                      {urgency.label}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 hidden sm:block">{fmt(task.due_date)}</span>
                  <Badge type="priority" value={task.priority} />
                </div>
              </div>
            );
          })}

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60">
            <p className="text-xs text-slate-400">
              Showing{' '}
              <span className="font-semibold text-slate-600">{filtered.length}</span> of{' '}
              <span className="font-semibold text-slate-600">{tasks.length}</span> pending tasks
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
