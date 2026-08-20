import React, { useEffect, useState } from 'react';
import { History, Search, RefreshCw, Download, Trash2, ShieldAlert } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import type { ActivityLog } from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { GlobalLoader } from '../../components/ui/GlobalLoader';

export const ActivityLogsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'auth' | 'user' | 'admin' | 'system'>('all');

  const [purgeDays, setPurgeDays] = useState(30);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purging, setPurging] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
    if (log.category === 'project' || log.category === 'task') return false;
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
      case 'user':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleExportCSV = () => {
    if (!isSuperAdmin) return;
    const headers = ['Timestamp', 'User Name', 'User Email', 'Category', 'Action', 'Details'];
    const rows = filtered.map(l => [
      `"${new Date(l.created_at).toLocaleString()}"`,
      `"${(l.user_name || 'System').replace(/"/g, '""')}"`,
      `"${(l.user_email || '—').replace(/"/g, '""')}"`,
      `"${l.category}"`,
      `"${l.action}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `deadlinehub_activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePurgeLogs = async () => {
    if (!isSuperAdmin) return;
    setPurging(true);
    try {
      const res = await apiClient.purgeActivityLogs(purgeDays);
      setMsg(`✓ ${res.message}`);
      setShowPurgeModal(false);
      await fetchLogs();
    } catch (err: any) {
      setMsg(err.message || 'Failed purging historical logs');
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand text-xs font-bold uppercase tracking-wider mb-1">
            <History size={14} /> Audit Trail & System Events
          </div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">System Activity Logs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time activity log tracking registrations, logins, account updates, and administrative actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <>
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-brand/40 text-slate-700 hover:text-brand text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                title="Export Logs to CSV"
              >
                <Download size={14} /> Export CSV
              </button>

              <button
                onClick={() => setShowPurgeModal(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                title="Purge Old Activity Logs"
              >
                <Trash2 size={14} /> Purge Logs
              </button>
            </>
          )}

          <button
            onClick={fetchLogs}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-brand/40 text-slate-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-brand-light border border-brand/30 text-brand text-xs font-semibold flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="text-slate-500 hover:text-slate-900 text-xs font-bold">Dismiss</button>
        </div>
      )}

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
          {(['all', 'auth', 'user', 'admin', 'system'] as const).map(cat => (
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
        {loading && <GlobalLoader text="Loading audit logs..." />}

        {!loading && filtered.length === 0 ? (
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
                    <td className="py-3.5 px-5 text-slate-700 max-w-md truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Purge Logs Modal */}
      {showPurgeModal && (
        <Modal isOpen={showPurgeModal} onClose={() => setShowPurgeModal(false)} title="Purge Historical Activity Logs">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">Warning: Permanent Action</p>
                <p className="text-amber-700 mt-0.5">
                  This action will permanently delete all activity log entries older than the selected retention window.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Retention Window
              </label>
              <select
                value={purgeDays}
                onChange={e => setPurgeDays(parseInt(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold"
              >
                <option value={30}>Delete logs older than 30 days</option>
                <option value={60}>Delete logs older than 60 days</option>
                <option value={90}>Delete logs older than 90 days</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setShowPurgeModal(false)} disabled={purging}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handlePurgeLogs} disabled={purging}>
                {purging ? 'Purging…' : 'Purge Historical Logs'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
