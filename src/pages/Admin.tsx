import React, { useEffect, useState } from 'react';
import {
  Users, Shield, Search, UserCheck, Trash2, Mail, Clock,
  FolderKanban, CheckSquare, Activity, TrendingUp, Eye, X
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

/* ─── Types  */
interface ManagedUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
  timezone?: string;
  created_at: string;
  projectCount?: number;
  taskCount?: number;
}

/* ─── Helper: role pill */
const RolePill = ({ role }: { role: string }) => (
  <span className={[
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide',
    role === 'admin'
      ? 'bg-amber-100 text-amber-800 border border-amber-200'
      : 'bg-slate-100 text-slate-600 border border-slate-200'
  ].join(' ')}>
    <Shield size={11} />
    {role?.toUpperCase()}
  </span>
);

/* ─── User Detail Side Panel */
const UserDetailPanel = ({
  user,
  projects,
  tasks,
  onClose,
  onToggleRole,
  onDelete,
  actionLoading,
}: {
  user: ManagedUser;
  projects: any[];
  tasks: any[];
  onClose: () => void;
  onToggleRole: (u: ManagedUser) => void;
  onDelete: (u: ManagedUser) => void;
  actionLoading: boolean;
}) => {
  if (!user) return null;
  const userProjects = projects.filter((p: any) => p.owner_id === user.id);
  const userTasks = tasks.filter((t: any) => t.owner_id === user.id);
  const completedTasks = userTasks.filter((t: any) => t.status === 'done').length;
  const completionRate = userTasks.length > 0
    ? Math.round((completedTasks / userTasks.length) * 100)
    : 0;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-slide-in-right overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
        <h2 className="font-heading font-bold text-slate-900 text-lg">User Profile</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition">
          <X size={18} />
        </button>
      </div>

      {/* User card */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-4">
        <img
          src={user.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}`}
          alt={user.full_name}
          className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 object-cover shrink-0"
        />
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-base truncate">{user.full_name}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
            <Mail size={12} /> {user.email}
          </p>
          <div className="mt-2">
            <RolePill role={user.role} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        {[
          { label: 'Projects', value: userProjects.length, icon: FolderKanban },
          { label: 'Tasks', value: userTasks.length, icon: CheckSquare },
          { label: 'Done %', value: `${completionRate}%`, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="p-4 text-center">
            <Icon size={18} className="text-brand mx-auto mb-1" />
            <p className="text-xl font-bold text-slate-900">{value}</p>
            <p className="text-[11px] text-slate-500 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Projects list */}
      <div className="p-5 flex-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <FolderKanban size={13} /> Owned Projects ({userProjects.length})
        </h3>
        {userProjects.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No projects created yet.</p>
        ) : (
          <div className="space-y-2">
            {userProjects.map((p: any) => {
              const pTasks = tasks.filter((t: any) => t.project_id === p.id);
              const pDone = pTasks.filter((t: any) => t.status === 'done').length;
              return (
                <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {p.status}
                    </span>
                  </div>
                  {pTasks.length > 0 && (
                    <div className="mt-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>{pDone}/{pTasks.length} tasks done</span>
                        <span>{pTasks.length > 0 ? Math.round(pDone / pTasks.length * 100) : 0}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand rounded-full transition-all"
                          style={{ width: `${pTasks.length > 0 ? Math.round(pDone / pTasks.length * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-5 border-t border-slate-100 flex gap-2 shrink-0">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => onToggleRole(user)}
          disabled={actionLoading}
        >
          Make {user.role === 'admin' ? 'Standard User' : 'Admin'}
        </Button>
        <Button
          variant="danger"
          onClick={() => onDelete(user)}
          disabled={actionLoading}
          icon={<Trash2 size={14} />}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

/* ─── Main Admin Component ──────────────────────────── */
export const Admin: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [panelUser, setPanelUser] = useState<ManagedUser | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [userList, projectList] = await Promise.all([
        apiClient.getAllUsers(),
        apiClient.getProjects(),
      ]);
      setAllProjects(projectList);

      // Fetch tasks for each project to calculate user task counts
      let tasks: any[] = [];
      for (const p of projectList) {
        const t = await apiClient.getTasksForProject(p.id);
        tasks = [...tasks, ...t];
      }
      setAllTasks(tasks);

      // Enrich users with project/task counts
      const enriched = userList.map((u: any) => ({
        ...u,
        projectCount: projectList.filter((p: any) => p.owner_id === u.id).length,
        taskCount: tasks.filter((t: any) => t.owner_id === u.id).length,
      }));
      setUsers(enriched);
    } catch (err: any) {
      setMsg('Error loading data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleToggleRole = async (user: ManagedUser) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setActionLoading(true);
    try {
      await apiClient.updateUserRole(user.id, newRole as 'admin' | 'user');
      setMsg(`✓ ${user.full_name} is now ${newRole.toUpperCase()}`);
      setPanelUser(null);
      await fetchAll();
    } catch (err: any) {
      setMsg(err.message || 'Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await apiClient.deleteUser(selectedUser.id);
      setMsg(`User ${selectedUser.full_name} deleted.`);
      setDeleteModal(false);
      setPanelUser(null);
      await fetchAll();
    } catch (err: any) {
      setMsg(err.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = (user: ManagedUser) => {
    setSelectedUser(user);
    setDeleteModal(true);
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const totalUsers = users.filter(u => u.role === 'user').length;
  const totalProjects = allProjects.length;
  const totalTasks = allTasks.length;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in space-y-6">

      {/* ── Header ───────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 text-brand text-xs font-semibold uppercase tracking-wider mb-1">
          <Shield size={14} /> Platform Administration
        </div>
        <h1 className="font-heading font-bold text-2xl text-slate-900">User & Access Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage all registered users, view their projects, and control platform-wide access roles.
        </p>
      </div>

      {/* ── Alert ────────────────────────────────────────── */}
      {msg && (
        <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between animate-fade-in">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="text-xs font-semibold hover:underline ml-4">Dismiss</button>
        </div>
      )}

      {/* ── Platform Stats ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Accounts', value: users.length, icon: Users, bg: 'bg-brand/10 text-brand' },
          { label: 'Admin Users', value: totalAdmins, icon: Shield, bg: 'bg-amber-50 text-amber-700' },
          { label: 'Standard Users', value: totalUsers, icon: UserCheck, bg: 'bg-emerald-50 text-emerald-700' },
          { label: 'Platform Projects', value: totalProjects, icon: FolderKanban, bg: 'bg-slate-100 text-slate-700' },
        ].map(({ label, value, icon: Icon, bg }) => (
          <div key={label} className="glass p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-heading font-bold text-slate-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Platform Activity Overview ────────────────────── */}
      <div className="glass p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-brand" />
          <h2 className="font-semibold text-sm text-slate-800">Platform Activity Overview</h2>
          <span className="ml-auto text-xs text-slate-500">{totalTasks} total tasks across all projects</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'To Do', count: allTasks.filter(t => t.status === 'todo').length, color: 'bg-slate-400' },
            { label: 'In Progress', count: allTasks.filter(t => t.status === 'in_progress').length, color: 'bg-amber-400' },
            { label: 'Completed', count: allTasks.filter(t => t.status === 'done').length, color: 'bg-emerald-400' },
          ].map(({ label, count, color }) => (
            <div key={label} className="text-center p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className={`w-3 h-3 rounded-full ${color} mx-auto mb-2`} />
              <p className="text-xl font-bold text-slate-900">{count}</p>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Search & Filter ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {(['all', 'admin', 'user'] as const).map(rf => (
            <button
              key={rf}
              onClick={() => setRoleFilter(rf)}
              className={[
                'px-3.5 py-1.5 rounded-xl text-xs font-medium capitalize transition cursor-pointer',
                roleFilter === rf ? 'bg-brand text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-slate-900',
              ].join(' ')}
            >
              {rf}
            </button>
          ))}
        </div>
      </div>

      {/* ── Users Table ──────────────────────────────────── */}
      <div className="glass overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <svg className="animate-spin h-8 w-8 text-brand mx-auto" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-sm text-slate-500 mt-3">Loading platform users…</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center">
            <Users size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No users match your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-xs text-slate-500 uppercase font-semibold tracking-wide">
                <tr>
                  <th className="py-3.5 px-5">User</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-4 text-center">Projects</th>
                  <th className="py-3.5 px-4 text-center">Tasks</th>
                  <th className="py-3.5 px-5">Joined</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(user => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/60 transition group"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}`}
                          alt=""
                          className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{user.full_name}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Mail size={11} /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <RolePill role={user.role} />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
                        <FolderKanban size={13} className="text-brand" />
                        {user.projectCount ?? 0}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
                        <CheckSquare size={13} className="text-brand" />
                        {user.taskCount ?? 0}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPanelUser(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand-light transition"
                          title="View User Details"
                        >
                          <Eye size={15} />
                        </button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleToggleRole(user)}
                          disabled={actionLoading}
                        >
                          {user.role === 'admin' ? '→ User' : '→ Admin'}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => confirmDelete(user)}
                          disabled={actionLoading}
                          icon={<Trash2 size={12} />}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── User Detail Side Panel ────────────────────────── */}
      {panelUser && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setPanelUser(null)} />
          <UserDetailPanel
            user={panelUser}
            projects={allProjects}
            tasks={allTasks}
            onClose={() => setPanelUser(null)}
            onToggleRole={handleToggleRole}
            onDelete={confirmDelete}
            actionLoading={actionLoading}
          />
        </>
      )}

      {/* ── Delete Confirmation Modal ─────────────────────── */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete User Account"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteUser} isLoading={actionLoading}>
              Permanently Delete
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <img
              src={selectedUser?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${selectedUser?.email}`}
              alt=""
              className="w-10 h-10 rounded-full bg-slate-100"
            />
            <div>
              <p className="text-sm font-bold text-slate-900">{selectedUser?.full_name}</p>
              <p className="text-xs text-slate-500">{selectedUser?.email}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete this account? All their projects, tasks, and data will be removed from the platform. <strong className="text-rose-600">This cannot be undone.</strong>
          </p>
        </div>
      </Modal>
    </div>
  );
};
