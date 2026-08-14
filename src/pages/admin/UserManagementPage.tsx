import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Trash2, Mail, KeyRound, Eye, X, AlertTriangle, Activity, Download, LogOut
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

interface ManagedUser {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'user';
  status: 'active' | 'inactive';
  avatar_url?: string;
  timezone?: string;
  created_at: string;
  projectCount?: number;
  taskCount?: number;
}

export const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin' | 'super_admin'>('all');

  const [panelUser, setPanelUser] = useState<ManagedUser | null>(null);
  const [editingUserName, setEditingUserName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [resetTarget, setResetTarget] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSaveUserName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panelUser || !editedName.trim()) return;
    setActionLoading(true);
    try {
      await apiClient.updateUserProfile(panelUser.id, { full_name: editedName.trim() });
      setMsg(`✓ Profile name updated to "${editedName.trim()}"`);
      setEditingUserName(false);
      setPanelUser(prev => prev ? { ...prev, full_name: editedName.trim() } : null);
      await fetchAll();
    } catch (err: any) {
      setMsg(err.message || 'Failed updating user name');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [userList, projectList] = await Promise.all([
        apiClient.getAllUsers(),
        apiClient.getProjects(),
      ]);

      let tasks: any[] = [];
      for (const p of projectList) {
        const t = await apiClient.getTasksForProject(p.id);
        tasks = [...tasks, ...t];
      }

      const enriched: ManagedUser[] = userList.map((u: any) => ({
        ...u,
        status: u.status || 'active',
        projectCount: projectList.filter((p: any) => p.owner_id === u.id).length,
        taskCount: tasks.filter((t: any) => t.owner_id === u.id).length,
      }));
      setUsers(enriched);
    } catch (err: any) {
      setMsg('Error loading users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleToggleStatus = async (user: ManagedUser) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    setActionLoading(true);
    try {
      await apiClient.updateUserStatus(user.id, nextStatus);
      setMsg(`✓ ${user.full_name}'s account is now ${nextStatus.toUpperCase()}`);
      await fetchAll();
      if (panelUser?.id === user.id) setPanelUser(prev => prev ? { ...prev, status: nextStatus } : null);
    } catch (err: any) {
      setMsg(err.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    if (currentUser?.role !== 'super_admin') {
      setMsg('Only Super Admins have permission to delete user accounts.');
      setDeleteTarget(null);
      return;
    }
    setActionLoading(true);
    try {
      await apiClient.deleteUser(deleteTarget.id);
      setMsg(`✓ Account ${deleteTarget.full_name} deleted.`);
      setDeleteTarget(null);
      setPanelUser(null);
      await fetchAll();
    } catch (err: any) {
      setMsg(err.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget || !newPassword) return;
    if (newPassword.length < 6) {
      setMsg('Password must be at least 6 characters long.');
      return;
    }
    setActionLoading(true);
    try {
      await apiClient.adminResetPassword(resetTarget.id, newPassword);
      setMsg(`✓ Password for ${resetTarget.full_name} has been updated in Supabase. The user can now log in using their new password.`);
      setResetTarget(null);
      setNewPassword('');
    } catch (err: any) {
      setMsg(err.message || 'Failed resetting password');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (currentUser?.role !== 'super_admin') return;
    const headers = ['User ID', 'Full Name', 'Email', 'Role', 'Status', 'Projects Count', 'Tasks Count', 'Created At'];
    const rows = filteredUsers.map(u => [
      `"${u.id}"`,
      `"${(u.full_name || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${u.role}"`,
      `"${u.status}"`,
      u.projectCount || 0,
      u.taskCount || 0,
      `"${new Date(u.created_at).toLocaleString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `deadlinehub_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleForceLogout = async (user: ManagedUser) => {
    if (currentUser?.role !== 'super_admin') return;
    if (!confirm(`Are you sure you want to force logout ${user.full_name} from all active devices?`)) return;
    setActionLoading(true);
    try {
      const res = await apiClient.revokeUserSessions(user.id);
      setMsg(`✓ ${res.message}`);
    } catch (err: any) {
      setMsg(err.message || 'Failed to revoke user sessions');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand text-xs font-bold uppercase tracking-wider mb-1">
            <Users size={14} /> System User Administration
          </div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">Registered Users</h1>
          <p className="text-xs text-slate-500 mt-1">
            View registered platform accounts, toggle activation status, reset passwords, and audit user workloads.
          </p>
        </div>

        {currentUser?.role === 'super_admin' && (
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-brand/40 text-slate-700 hover:text-brand text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto"
            title="Export User Registry to CSV"
          >
            <Download size={14} /> Export CSV
          </button>
        )}
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
            placeholder="Search users by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-brand"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Status:</span>
            {(['all', 'active', 'inactive'] as const).map(sf => (
              <button
                key={sf}
                onClick={() => setStatusFilter(sf)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${statusFilter === sf ? 'bg-brand text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {sf}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Role:</span>
            {(['all', 'user', 'admin', 'super_admin'] as const).map(rf => (
              <button
                key={rf}
                onClick={() => setRoleFilter(rf)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${roleFilter === rf ? 'bg-brand text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {rf.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading user registry...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No user accounts match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Projects</th>
                  <th className="py-3.5 px-4 text-center">Tasks</th>
                  <th className="py-3.5 px-5">Joined Date</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}`}
                          alt=""
                          className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{user.full_name}</p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Mail size={10} /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.role === 'super_admin' ? 'bg-amber-50 text-amber-800 border border-amber-200' : user.role === 'admin' ? 'bg-brand-light text-brand border border-brand/20' : 'bg-slate-100 text-slate-600'}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                      {user.projectCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                      {user.taskCount}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {new Date(user.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {currentUser?.role === 'super_admin' && (
                          <>
                            <button
                              onClick={() => navigate(`/admin/users/${user.id}/activity`)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand-light transition cursor-pointer"
                              title="View Full Activity Timeline"
                            >
                              <Activity size={14} />
                            </button>

                            <button
                              onClick={() => handleForceLogout(user)}
                              disabled={actionLoading || user.id === currentUser?.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Force Logout / Revoke Active Sessions"
                            >
                              <LogOut size={14} />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setPanelUser(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                          title="View Profile Details"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          onClick={() => setResetTarget(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-slate-100 transition cursor-pointer"
                          title="Reset Password"
                        >
                          <KeyRound size={14} />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={actionLoading || (user.id === currentUser?.id && currentUser?.role === 'super_admin')}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                            user.id === currentUser?.id && currentUser?.role === 'super_admin'
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : user.status === 'active'
                              ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 cursor-pointer'
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer'
                          }`}
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>

                        {currentUser?.role !== 'super_admin' ? (
                          <button
                            disabled
                            className="p-1.5 rounded-lg text-slate-300 cursor-not-allowed"
                            title="Only Super Admins have permission to delete user accounts"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : user.id === currentUser?.id ? (
                          <button
                            disabled
                            className="p-1.5 rounded-lg text-slate-300 cursor-not-allowed"
                            title="Transfer Super Admin role before deleting your account"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => setDeleteTarget(user)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {panelUser && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white border-l border-slate-200 text-slate-800 p-6 flex flex-col justify-between shadow-2xl animate-slide-in-right overflow-y-auto">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="font-bold text-lg text-slate-900">User Profile Details</h2>
              <button onClick={() => { setPanelUser(null); setEditingUserName(false); }} className="text-slate-400 hover:text-slate-800 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-4">
              <img
                src={panelUser.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${panelUser.email}`}
                alt=""
                className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 object-cover"
              />
              <div className="flex-1 min-w-0">
                {editingUserName ? (
                  <form onSubmit={handleSaveUserName} className="space-y-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="w-full p-1.5 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                      required
                    />
                    <div className="flex items-center gap-1.5">
                      <button type="submit" disabled={actionLoading} className="px-2 py-0.5 text-[10px] text-white bg-brand rounded font-bold cursor-pointer">Save</button>
                      <button type="button" onClick={() => setEditingUserName(false)} className="px-2 py-0.5 text-[10px] text-slate-600 bg-slate-100 rounded font-medium cursor-pointer">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 text-base truncate">{panelUser.full_name}</p>
                      <button
                        onClick={() => { setEditingUserName(true); setEditedName(panelUser.full_name); }}
                        className="text-[11px] text-brand font-bold hover:underline cursor-pointer ml-1 shrink-0"
                      >
                        Edit Name
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{panelUser.email}</p>
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-light text-brand border border-brand/20">
                    {panelUser.role.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${panelUser.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {panelUser.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Registration Date</span>
                <span className="font-semibold text-slate-800">{new Date(panelUser.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Owned Projects</span>
                <span className="font-semibold text-slate-800">{panelUser.projectCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Total Tasks</span>
                <span className="font-semibold text-slate-800">{panelUser.taskCount}</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex gap-2">
            <button
              onClick={() => handleToggleStatus(panelUser)}
              disabled={actionLoading || (panelUser.id === currentUser?.id && currentUser?.role === 'super_admin')}
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer disabled:opacity-50"
            >
              {panelUser.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
            </button>
          </div>
        </div>
      )}

      <Modal isOpen={!!resetTarget} onClose={() => setResetTarget(null)} title="Reset User Password">
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-xs text-slate-600">
            Set a new temporary password for <strong>{resetTarget?.full_name}</strong> ({resetTarget?.email}).
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">New Password</label>
            <input
              type="text"
              required
              placeholder="e.g. NewPassword123!"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setResetTarget(null)}>Cancel</Button>
            <Button type="submit" isLoading={actionLoading}>Update Password</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm User Account Deletion">
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle size={18} className="shrink-0" />
            <span>Are you sure you want to permanently delete account <strong>{deleteTarget?.full_name}</strong>?</span>
          </div>
          <p className="text-xs text-slate-600">
            This action will permanently delete the user's login access. Owned projects and tasks will be unassigned or removed.
          </p>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteUser} isLoading={actionLoading}>Delete User</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
