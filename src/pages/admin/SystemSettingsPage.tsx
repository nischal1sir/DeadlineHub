import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Lock } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';

export const SystemSettingsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [settings, setSettings] = useState<any>({
    platform_name: 'DeadlineHub Platform',
    maintenance_mode: false,
    allow_public_registration: true,
    default_user_role: 'user',
    session_timeout_minutes: 60,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const s = await apiClient.getSystemSettings();
        if (s && Object.keys(s).length > 0) setSettings(s);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setMsg('Only Super Admins can alter global system configuration.');
      return;
    }
    setSaving(true);
    try {
      await apiClient.updateSystemSettings(settings);
      setMsg('✓ Global platform settings updated successfully.');
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      setMsg(err.message || 'Failed saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400 text-xs">Loading system configuration...</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <div className="flex items-center gap-2 text-brand text-xs font-bold uppercase tracking-wider mb-1">
          <SettingsIcon size={14} /> Global Configuration
        </div>
        <h1 className="font-heading font-bold text-2xl text-slate-900">System Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure platform-wide security options, registration access, maintenance controls, and session limits.
        </p>
      </div>

      {!isSuperAdmin && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3 shadow-xs">
          <Lock size={20} className="text-amber-600 shrink-0" />
          <div>
            <p className="font-bold text-amber-900">Read-Only View Mode</p>
            <p className="text-amber-700 text-[11px]">
              System configuration settings can only be altered by <strong>Super Admins</strong>. Contact a Super Admin to request setting changes.
            </p>
          </div>
        </div>
      )}

      {msg && (
        <div className="p-3.5 rounded-xl bg-brand-light border border-brand/30 text-brand text-xs font-semibold">
          {msg}
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
        <div>
          <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 mb-4">
            Platform Branding & Info
          </h2>
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Platform Name</label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings.platform_name}
                onChange={e => setSettings({ ...settings, platform_name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 mb-4">
            Security & Access Controls
          </h2>
          <div className="space-y-3 text-xs">
            <label className={`flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 ${isSuperAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
              <div>
                <p className="font-bold text-slate-800 flex items-center gap-2">
                  Maintenance Mode
                  {settings.maintenance_mode && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">Active</span>
                  )}
                </p>
                <p className="text-slate-500">Temporarily restrict non-admin users from logging in.</p>
              </div>
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={settings.maintenance_mode}
                onChange={e => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                className="w-4 h-4 text-brand rounded cursor-pointer disabled:cursor-not-allowed"
              />
            </label>

            <label className={`flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 ${isSuperAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
              <div>
                <p className="font-bold text-slate-800">Public Account Registration</p>
                <p className="text-slate-500">Allow new users to self-register from the login page.</p>
              </div>
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={settings.allow_public_registration}
                onChange={e => setSettings({ ...settings, allow_public_registration: e.target.checked })}
                className="w-4 h-4 text-brand rounded cursor-pointer disabled:cursor-not-allowed"
              />
            </label>
          </div>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 mb-4">
            Session Configuration
          </h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Session Timeout (Minutes)</label>
              <input
                type="number"
                disabled={!isSuperAdmin}
                min={15}
                max={1440}
                value={settings.session_timeout_minutes}
                onChange={e => setSettings({ ...settings, session_timeout_minutes: parseInt(e.target.value) || 60 })}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Default User Role</label>
              <select
                disabled={!isSuperAdmin}
                value={settings.default_user_role}
                onChange={e => setSettings({ ...settings, default_user_role: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="user">Standard User</option>
                <option value="admin">Admin User</option>
              </select>
            </div>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Save size={15} /> Save Platform Settings
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
