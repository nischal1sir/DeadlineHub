import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ImageCropModal } from '../../components/ui/ImageCropModal';
import { User, Mail, Clock, Shield, Camera, Save, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { GlobalLoader } from '../../components/ui/GlobalLoader';

export const AdminProfilePage: React.FC = () => {
  const { user, updateProfile, updateAvatar } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Avatar crop states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setTimezone(user.timezone || 'UTC');
    }
  }, [user]);

  if (!user) {
    return <GlobalLoader text="Loading admin profile..." />;
  }

  const initials = user.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'A';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset so same file can be re-selected if needed
  };

  const handleCropComplete = async (blob: Blob) => {
    setUploading(true);
    setErrorMsg(null);
    try {
      await updateAvatar(blob);
      setCropModalOpen(false);
      setSuccessMsg('Profile picture updated successfully');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Full name cannot be empty');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      await updateProfile(fullName.trim(), timezone);
      setIsEditing(false);
      setSuccessMsg('Profile updated successfully');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  const isSuperAdmin = user.role === 'super_admin';

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-slate-900 flex items-center gap-2">
            Admin Profile <Sparkles size={20} className="text-amber-500" />
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage your administrative credentials and preferences</p>
        </div>

        {!isEditing ? (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => {
            setIsEditing(false);
            setFullName(user.full_name || '');
            setTimezone(user.timezone || 'UTC');
          }}>
            Cancel
          </Button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2 animate-fade-in">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-light via-white to-surface border border-brand/20 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-xs relative">
        {/* Avatar with Crop Trigger */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 rounded-2xl bg-brand flex items-center justify-center text-white text-3xl font-bold shadow-md overflow-hidden ring-4 ring-white">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex flex-col items-center justify-center text-white gap-1 backdrop-blur-xs cursor-pointer"
            title="Upload and crop profile photo"
          >
            <Camera size={22} />
            <span className="text-[10px] font-semibold">Change</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* User Badge Info */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <h2 className="font-heading font-bold text-2xl text-slate-900">{user.full_name}</h2>
          <p className="text-sm text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
            <Mail size={14} className="text-brand" />
            {user.email}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase ${
              isSuperAdmin
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-brand-light text-brand border border-brand/20'
            }`}>
              <Shield size={13} />
              {user.role.replace('_', ' ')}
            </span>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <Clock size={13} />
              {timezone}
            </span>
          </div>
        </div>
      </div>

      {/* Main Form & Details Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Personal & Admin Details Card */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-5 text-sm border-b border-slate-100 pb-3">
            <User size={16} className="text-brand" /> Personal & Account Information
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
                  placeholder="Enter full name"
                  required
                />
              ) : (
                <div className="w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 font-medium">
                  {user.full_name}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Mail size={12} /> Email Address (Read-Only)
              </label>
              <div className="w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-500 bg-slate-100 border border-slate-200 cursor-not-allowed">
                {user.email}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock size={12} /> Preferred Timezone
              </label>
              {isEditing ? (
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
                >
                  <option value="UTC">UTC — Coordinated Universal Time</option>
                  <option value="America/New_York">EST (UTC-5) — Eastern Time</option>
                  <option value="America/Chicago">CST (UTC-6) — Central Time</option>
                  <option value="America/Denver">MST (UTC-7) — Mountain Time</option>
                  <option value="America/Los_Angeles">PST (UTC-8) — Pacific Time</option>
                  <option value="Europe/London">GMT/BST (UTC+0/+1) — London</option>
                  <option value="Europe/Paris">CET (UTC+1) — Paris, Berlin</option>
                  <option value="Asia/Kathmandu">NPT (UTC+5:45) — Kathmandu</option>
                  <option value="Asia/Tokyo">JST (UTC+9) — Tokyo</option>
                </select>
              ) : (
                <div className="w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 font-medium">
                  {timezone}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Member Since
              </label>
              <div className="w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-700 bg-slate-50 border border-slate-200">
                {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            {isEditing && (
              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* Security & Administrative Powers Card */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-5 text-sm border-b border-slate-100 pb-3">
              <Shield size={16} className="text-amber-600" /> Security & Admin Privileges
            </h2>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                  Role Privileges
                </span>
                <p className="text-slate-600 leading-relaxed">
                  As an <strong>{user.role.replace('_', ' ').toUpperCase()}</strong>, you possess full administrative permissions to manage project lifecycles, user accounts, system configuration, and inspect security audit logs.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-brand-light/50 border border-brand/20 text-xs space-y-2">
                <span className="font-bold text-brand block text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={13} /> Avatar & Identity Security
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Your custom profile photo will be visible on system activity logs, notification feeds, and admin management portals across the organization.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-right">
            <span className="text-[11px] text-slate-400">
              Account ID: <code className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{user.id}</code>
            </span>
          </div>
        </div>
      </div>

      {/* Image Crop Modal */}
      {selectedImage && (
        <ImageCropModal
          isOpen={cropModalOpen}
          imageSrc={selectedImage}
          onClose={() => setCropModalOpen(false)}
          onCropComplete={handleCropComplete}
          isUploading={uploading}
        />
      )}
    </div>
  );
};
