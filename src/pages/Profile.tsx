import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ImageCropModal } from '../components/ui/ImageCropModal';
import { Modal } from '../components/ui/Modal';
import { User, Lock, Mail, Clock, Shield, Camera, CheckCircle2, AlertCircle, Save, Pencil, LogOut, Trash2, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { apiClient } from '../lib/apiClient';

export const Profile: React.FC = () => {
  const { user, updateProfile, updateAvatar, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [saving, setSaving] = useState(false);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete account modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
    }
  }, [user]);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, WebP, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 5MB');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = async (blob: Blob) => {
    setUploading(true);
    setErrorMsg(null);
    try {
      await updateAvatar(blob);
      setCropModalOpen(false);
      setSuccessMsg('Profile picture updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Full name cannot be empty');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      await updateProfile(fullName.trim(), user.timezone || 'UTC');
      setIsEditing(false);
      setSuccessMsg('Name updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save name');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setErrorMsg(null);
    try {
      await logout();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to logout');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setErrorMsg('Please type "DELETE" to confirm account deletion');
      return;
    }

    setDeleting(true);
    setErrorMsg(null);
    try {
      await apiClient.deleteAccount();
      await logout();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">My Profile</h1>
          <p className="text-sm text-slate-500 mt-1">View your account information and manage your profile</p>
        </div>

        {!isEditing ? (
          <Button variant="outline" onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 text-xs">
            <Pencil size={14} /> Edit Name
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => {
            setIsEditing(false);
            setFullName(user.full_name || '');
          }} className="text-xs">
            Cancel
          </Button>
        )}
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2 animate-fade-in">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-light via-white to-surface border border-brand/20 p-6 flex items-center gap-5 shadow-xs">
        {/* Avatar with Camera Crop Overlay */}
        <div className="relative group shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center text-white text-2xl font-bold shadow-md overflow-hidden ring-2 ring-white">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>

          {/* Camera overlay button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer backdrop-blur-xs text-white"
            title="Upload and crop photo"
          >
            <Camera size={20} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        <div>
          <h2 className="font-heading font-bold text-xl text-slate-900">{user.full_name}</h2>
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
            <Mail size={13} className="text-brand" />
            {user.email}
          </p>
          <span className={`inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${user.role === 'super_admin'
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
        {/* Personal Details */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-5 text-sm border-b border-slate-100 pb-3">
            <User size={16} className="text-brand" /> Personal Details
          </h2>

          <form onSubmit={handleSaveName} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">First Name</label>
                    <div className="w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-700 bg-slate-50 border border-slate-200">
                      {firstName || '—'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Name</label>
                    <div className="w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-700 bg-slate-50 border border-slate-200">
                      {lastName || '—'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Mail size={10} /> Email Address (Read-Only)
              </label>
              <div className="w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-500 bg-slate-100 border border-slate-200 cursor-not-allowed">
                {user.email}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock size={10} /> Timezone
              </label>
              <div className="w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-700 bg-slate-50 border border-slate-200">
                {user.timezone || 'UTC — Coordinated Universal Time'}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Member Since</label>
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
                  {saving ? 'Saving...' : 'Save Name'}
                </Button>
              </div>
            )}
          </form>
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

      {/* Account Management / Danger Zone */}
      <div className="rounded-2xl bg-white border border-rose-200 p-6 shadow-xs">
        <h2 className="flex items-center gap-2 font-semibold text-rose-800 mb-5 text-sm border-b border-rose-100 pb-3">
          <Trash2 size={16} className="text-rose-600" /> Account Management
        </h2>

        <div className="space-y-4">
          {/* Logout Button */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <LogOut size={20} className="text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Sign Out</p>
                  <p className="text-slate-500 text-xs mt-0.5">Sign out of your DeadlineHub account on this device</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-xs"
                icon={<LogOut size={14} />}
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Delete Account Button */}
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <Trash2 size={20} className="text-rose-600" />
                </div>
                <div>
                  <p className="font-semibold text-rose-900 text-sm">Delete Account</p>
                  <p className="text-rose-600 text-xs mt-0.5">Permanently delete your account and all associated data. This action cannot be undone.</p>
                </div>
              </div>
              <Button
                variant="danger"
                onClick={() => setDeleteModalOpen(true)}
                className="text-xs"
                icon={<Trash2 size={14} />}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      {selectedImage && (
        <ImageCropModal
          isOpen={cropModalOpen}
          imageSrc={selectedImage}
          onClose={() => setCropModalOpen(false)}
          onCropComplete={handleCropComplete}
          isUploading={uploading}
        />
      )}

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setDeleteConfirmText(''); }}
        title="Delete Account"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => { setDeleteModalOpen(false); setDeleteConfirmText(''); }}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              isLoading={deleting}
              className="text-xs"
              icon={<Trash2 size={14} />}
            >
              Delete Account
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <AlertCircle size={22} className="text-rose-600" />
            </div>
            <div>
              <p className="font-semibold text-rose-900 text-sm">This action is permanent</p>
              <p className="text-rose-700 text-xs mt-1">
                Deleting your account will permanently remove all your data including projects, tasks, and profile information. This cannot be undone.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Type "DELETE" to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose/30 focus:border-rose transition font-mono"
              autoFocus
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[11px] text-slate-600 flex items-start gap-2">
              <X size={12} className="shrink-0 mt-0.5" />
              All your projects, tasks, and personal data will be permanently deleted{/*  */}.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
