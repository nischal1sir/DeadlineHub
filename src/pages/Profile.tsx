import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Lock, Mail, Clock, Shield } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <svg className="animate-spin h-10 w-10 text-brand" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm text-slate-500">Loading profile...</span>
        </div>
      </div>
    );
  }

  // Get initials from full name
  const initials = user.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  // Split name into first and last
  const nameParts = user.full_name?.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">View your account information</p>
      </div>

      {/* Profile Header Card */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-light via-white to-surface border border-brand/20 p-6 mb-6 flex items-center gap-5 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-md">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-2xl object-cover" />
          ) : (
            initials
          )}
        </div>
        <div>
          <h2 className="font-heading font-bold text-xl text-slate-900">{user.full_name}</h2>
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
            <Mail size={13} className="text-brand" />
            {user.email}
          </p>
          <span className={`inline-flex items-center gap-1 mt-1.5 px-2.5 rounded-full text-[11px] font-bold uppercase ${
            user.role === 'super_admin'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : user.role === 'admin'
              ? 'bg-brand-light text-brand border border-brand/20'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}>
            <User size={13} />
            {user.role.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Personal Details — Read Only */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-5 text-sm border-b border-slate-100 pb-3">
            <User size={16} className="text-brand" /> Personal Details
          </h2>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">First Name</label>
                <div className="w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-700 bg-slate-50 border border-slate-200">
                  {firstName || '—'}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Last Name</label>
                <div className="w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-700 bg-slate-50 border border-slate-200">
                  {lastName || '—'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Mail size={10} /> Email Address
              </label>
              <div className="w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-700 bg-slate-50 border border-slate-200">
                {user.email}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock size={10} /> Timezone
              </label>
              <div className="w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-700 bg-slate-50 border border-slate-200">
                UTC — Coordinated Universal Time
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Member Since</label>
              <div className="w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-700 bg-slate-50 border border-slate-200">
                {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Shield size={11} className="text-brand" />
            Profile changes must be requested through an administrator.
          </p>
        </div>

        {/* Password — Info Panel */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-5 text-sm border-b border-slate-100 pb-3">
            <Lock size={16} className="text-amber-600" /> Security & Password
          </h2>

          <div className="flex flex-col items-center justify-center py-8 px-4 rounded-2xl bg-amber-50 border border-amber-200 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Lock size={22} className="text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-900 text-sm">Password Change Restricted</p>
              <p className="text-amber-700 text-xs mt-1.5 leading-relaxed max-w-xs">
                To change your password, please contact an <strong>Administrator</strong> or <strong>Super Admin</strong> to update your password on your behalf.
              </p>
            </div>
          </div>

          <div className="mt-4 p-3.5 rounded-xl bg-brand-light border border-brand/20">
            <p className="text-[11px] text-brand font-medium flex items-start gap-2">
              <Shield size={12} className="shrink-0 mt-0.5" />
              Your account security is managed centrally. Administrators can reset your credentials securely through the admin panel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
