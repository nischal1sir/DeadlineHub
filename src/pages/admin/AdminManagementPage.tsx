import React, { useEffect, useState } from 'react';
import { UserPlus, Trash2, Mail, ShieldAlert, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export const AdminManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'super_admin'>('admin');

  const [transferTarget, setTransferTarget] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const allUsers = await apiClient.getAllUsers();
      const adminList = allUsers.filter((u: any) => u.role === 'admin' || u.role === 'super_admin');
      setAdmins(adminList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newEmail || !newPassword) return;
    setActionLoading(true);
    try {
      await apiClient.createAdminUser({
        full_name: newFullName,
        email: newEmail,
        password: newPassword,
        role: newRole
      });
      setMsg(`✓ New Admin account created for ${newFullName}`);
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      setIsModalOpen(false);
      await fetchAdmins();
    } catch (err: any) {
      setMsg(err.message || 'Failed creating admin account');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAdminRole = async (targetAdmin: any) => {
    if (targetAdmin.id === currentUser?.id && currentUser?.role === 'super_admin') {
      setMsg('You cannot alter your own Super Admin role directly. Use Transfer Super Admin instead.');
      return;
    }
    const nextRole = targetAdmin.role === 'super_admin' ? 'admin' : 'super_admin';
    setActionLoading(true);
    try {
      await apiClient.updateUserRole(targetAdmin.id, nextRole);
      setMsg(`✓ Role updated to ${nextRole.toUpperCase()} for ${targetAdmin.full_name}`);
      await fetchAdmins();
    } catch (err: any) {
      setMsg(err.message || 'Failed updating admin role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAdmin = async (targetAdmin: any) => {
    if (targetAdmin.id === currentUser?.id && currentUser?.role === 'super_admin') {
      setMsg('Super Admin cannot delete their own account. Transfer the Super Admin role to another admin first.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete Admin ${targetAdmin.full_name}?`)) return;

    setActionLoading(true);
    try {
      await apiClient.deleteUser(targetAdmin.id);
      setMsg(`✓ Admin ${targetAdmin.full_name} deleted.`);
      await fetchAdmins();
    } catch (err: any) {
      setMsg(err.message || 'Failed deleting admin');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferSuperAdmin = async () => {
    if (!transferTarget) return;
    const targetObj = admins.find(a => a.id === transferTarget);
    if (!window.confirm(`Are you sure you want to transfer your Super Admin role to ${targetObj?.full_name || 'this admin'}? You will be demoted to Admin.`)) return;

    setTransferLoading(true);
    setMsg(null);
    try {
      const result = await apiClient.transferSuperAdmin(transferTarget);
      localStorage.setItem('tracker_auth_user', JSON.stringify(result.updatedProfile));
      alert(result.message);
      window.location.reload();
    } catch (err: any) {
      setMsg(err.message || 'Failed to transfer Super Admin role');
    } finally {
      setTransferLoading(false);
    }
  };

  if (currentUser?.role !== 'super_admin') {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-lg mx-auto mt-12">
        <ShieldAlert size={40} className="text-amber-500 mx-auto mb-3" />
        <h2 className="font-bold text-lg text-slate-900 mb-1">Super Admin Privileges Required</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Only the primary Super Admin has permission to view the admin console, create new Admin accounts, or modify administrative roles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-brand text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert size={14} /> Super Admin Privilege Console
          </div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">Admin Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manually grant, edit, or revoke administrative privileges and create new Admin accounts.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <UserPlus size={15} /> Create Admin Account
        </button>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-brand-light border border-brand/30 text-brand text-xs font-semibold flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="text-slate-500 hover:text-slate-900 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Loading admin registry...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {admins.map(admin => {
            const isSelfSuperAdmin = admin.id === currentUser?.id && currentUser?.role === 'super_admin';
            return (
              <div key={admin.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={admin.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${admin.email}`}
                      alt=""
                      className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        {admin.full_name}
                        {admin.id === currentUser?.id && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-normal">(You)</span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Mail size={11} /> {admin.email}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${admin.role === 'super_admin' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-brand-light text-brand border border-brand/20'}`}>
                    {admin.role.replace('_', ' ')}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Joined: {new Date(admin.created_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAdminRole(admin)}
                      disabled={actionLoading || isSelfSuperAdmin}
                      className="px-2.5 py-1 rounded text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Set as {admin.role === 'super_admin' ? 'Admin' : 'Super Admin'}
                    </button>

                    {isSelfSuperAdmin ? (
                      <button
                        disabled
                        className="p-1.5 rounded-lg text-slate-300 cursor-not-allowed"
                        title="Super Admin cannot delete their own account. Transfer role first."
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeleteAdmin(admin)}
                        disabled={actionLoading}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Admin"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Super Admin Role Transfer Console */}
      {currentUser?.role === 'super_admin' && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 mt-6 shadow-xs space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-900 flex items-center gap-2">
                Transfer Super Admin Privileges
              </h3>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed max-w-2xl">
                Select an existing active <strong>Admin</strong> user to receive full Super Admin authority. Your account will automatically be reassigned to standard Admin status upon completion.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <select
              value={transferTarget}
              onChange={(e) => setTransferTarget(e.target.value)}
              className="flex-1 p-2.5 rounded-xl border border-amber-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">Select an active admin...</option>
              {admins
                .filter(a => a.role === 'admin' && a.id !== currentUser.id && a.status !== 'inactive')
                .map(a => (
                  <option key={a.id} value={a.id}>
                    {a.full_name} ({a.email})
                  </option>
                ))}
            </select>

            <Button
              variant="danger"
              onClick={handleTransferSuperAdmin}
              disabled={!transferTarget || transferLoading}
              isLoading={transferLoading}
              className="text-xs"
            >
              Transfer Super Admin Role
            </Button>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Admin Account">
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Jonathan Vance"
              value={newFullName}
              onChange={e => setNewFullName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="admin.user@tracker.com"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Admin Privilege Level</label>
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm bg-white"
            >
              <option value="admin">Platform Admin</option>
              <option value="super_admin">Super Admin (Full Rights)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={actionLoading}>Create Admin</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
