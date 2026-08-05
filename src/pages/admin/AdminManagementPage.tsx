import React, { useEffect, useState } from 'react';
import { UserPlus, Trash2, Mail, ShieldAlert } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export const AdminManagementPage: React.FC = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'super_admin'>('admin');

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
    if (targetAdmin.id === 'superadmin-uuid-0000') {
      setMsg('Primary Super Admin account role cannot be altered.');
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
    if (targetAdmin.id === 'superadmin-uuid-0000') {
      setMsg('Primary Super Admin account cannot be deleted.');
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert size={14} /> Super Admin Privilege Console
          </div>
          <h1 className="font-heading font-bold text-2xl text-white">Admin Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manually grant, edit, or revoke administrative privileges and create new Admin accounts.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
        >
          <UserPlus size={15} /> Create Admin Account
        </button>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-white text-xs font-bold">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading admin registry...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {admins.map(admin => (
            <div key={admin.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={admin.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${admin.email}`}
                    alt=""
                    className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-white text-sm">{admin.full_name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Mail size={11} /> {admin.email}
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${admin.role === 'super_admin' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                  {admin.role.replace('_', ' ')}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Joined: {new Date(admin.created_at).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAdminRole(admin)}
                    disabled={actionLoading || admin.id === 'superadmin-uuid-0000'}
                    className="px-2.5 py-1 rounded text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer disabled:opacity-50"
                  >
                    Set as {admin.role === 'super_admin' ? 'Admin' : 'Super Admin'}
                  </button>

                  <button
                    onClick={() => handleDeleteAdmin(admin)}
                    disabled={actionLoading || admin.id === 'superadmin-uuid-0000'}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition disabled:opacity-30"
                    title={admin.id === 'superadmin-uuid-0000' ? 'Primary Super Admin protected from deletion' : 'Delete Admin'}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
