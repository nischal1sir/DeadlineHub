import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { User, Lock } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateProfile, resetPassword } = useAuth();
  const [name, setName] = useState(user?.full_name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setProfileMsg({ type: 'error', text: 'Full name cannot be blank.' }); return; }
    setProfileLoading(true); setProfileMsg(null);
    try {
      await updateProfile(name.trim(), timezone);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: any) { setProfileMsg({ type: 'error', text: err.message || 'Failed to update.' }); }
    finally { setProfileLoading(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) { setPwMsg({ type: 'error', text: 'Please fill in all fields.' }); return; }
    if (password !== confirmPassword) { setPwMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
    if (password.length < 6) { setPwMsg({ type: 'error', text: 'Minimum 6 characters required.' }); return; }
    setPwLoading(true); setPwMsg(null);
    try {
      await resetPassword(password);
      setPwMsg({ type: 'success', text: 'Password updated successfully.' });
      setPassword(''); setConfirmPassword('');
    } catch (err: any) { setPwMsg({ type: 'error', text: err.message || 'Failed to update password.' }); }
    finally { setPwLoading(false); }
  };

  const Alert = ({ msg }: { msg: { type: 'error' | 'success'; text: string } }) => (
    <div className={[
      'mb-4 px-4 py-3 rounded-xl text-sm border',
      msg.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-brand-light border-brand/30 text-brand font-medium',
    ].join(' ')}>{msg.text}</div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <h1 className="font-heading font-bold text-2xl text-slate-900 mb-1">Profile Settings</h1>
      <p className="text-sm text-slate-500 mb-8">Manage your account preferences and security</p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="glass p-6">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-5">
            <User size={16} className="text-brand" /> Personal Details
          </h2>
          {profileMsg && <Alert msg={profileMsg} />}
          <form onSubmit={handleUpdateProfile}>
            <Input type="text" label="Full Name" value={name} onChange={e => setName(e.target.value)} required />
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Timezone</label>
              <select
                className="w-full rounded-xl px-4 py-3 text-sm text-slate-800 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/30 transition"
                value={timezone} onChange={e => setTimezone(e.target.value)}
              >
                <option value="UTC">UTC — Coordinated Universal Time</option>
                <option value="GMT">GMT — Greenwich Mean Time</option>
                <option value="EST">EST — Eastern Standard Time</option>
                <option value="PST">PST — Pacific Standard Time</option>
                <option value="NPT">NPT — Nepal Standard Time</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Email (Read‑only)</label>
              <input
                className="w-full rounded-xl px-4 py-3 text-sm text-slate-500 bg-slate-50 border border-slate-200 cursor-not-allowed opacity-75"
                value={user?.email || ''} disabled
              />
              <span className="text-xs text-slate-500">Email changes require Supabase auth confirmation.</span>
            </div>
            <Button type="submit" isLoading={profileLoading}>Save Details</Button>
          </form>
        </div>

        {/* Security */}
        <div className="glass p-6">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-5">
            <Lock size={16} className="text-amber-700" /> Security & Password
          </h2>
          {pwMsg && <Alert msg={pwMsg} />}
          <form onSubmit={handleChangePassword}>
            <Input type="password" label="New Password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required helperText="Minimum 6 characters." />
            <Input type="password" label="Confirm Password" placeholder="••••••••"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            <Button type="submit" variant="outline" isLoading={pwLoading}
              className="border-amber-700/40 text-amber-900 hover:bg-cream">
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
