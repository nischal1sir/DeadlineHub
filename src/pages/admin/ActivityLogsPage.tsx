import React, { useEffect, useState } from 'react';
import { History, Search, RefreshCw } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import type { ActivityLog } from '../../lib/apiClient';

export const ActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'auth' | 'user' | 'project' | 'task' | 'admin' | 'system'>('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const l = await apiClient.getActivityLogs();
      setLogs(l);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = logs.filter(log => {
    const q = search.toLowerCase();
    const matchesSearch = log.details.toLowerCase().includes(q) ||
      (log.user_name && log.user_name.toLowerCase().includes(q)) ||
      (log.user_email && log.user_email.toLowerCase().includes(q)) ||
      log.action.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (cat: ActivityLog['category']) => {
    switch (cat) {
      case 'admin':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'auth':
        return 'bg-brand-light text-brand border-brand/20';
      case 'project':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'task':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'user':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-brand text-xs font-bold uppercase tracking-wider mb-1">
            <History size={14} /> Audit Trail & System Events
          </div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">System Activity Logs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time activity log tracking registrations, logins, project changes, account deletions, and administrative actions.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-brand/40 text-slate-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Logs
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search activity logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-brand"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {(['all', 'auth', 'user', 'project', 'task', 'admin', 'system'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${categoryFilter === cat ? 'bg-brand text-white' : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading audit logs...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No activity logs recorded matching your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900">{log.user_name || 'System'}</p>
                        <p className="text-[10px] text-slate-400">{log.user_email || '—'}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getCategoryBadge(log.category)}`}>
                        {log.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] font-semibold text-brand">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-5 text-slate-700 max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
