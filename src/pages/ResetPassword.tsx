import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import logoImg from '../assets/logo.png';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { Footer as PublicFooter } from '../components/layout/PublicFooter';

type Step = 'form' | 'success' | 'invalid';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('form');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Supabase puts the token in the URL hash after clicking the email link.
  // detectSessionInUrl: true in the client handles this automatically —
  // supabase.auth.getSession() will return a valid session if the link is valid.
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // URL hash missing or expired token
        setStep('invalid');
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Please fill in both fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to update password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  // ── Invalid / expired link ───────────────────────────────────────────────────
  if (step === 'invalid') {
    return (
      <div className="min-h-screen flex flex-col bg-surface overflow-x-hidden">
        <PublicNavbar />
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
          <div className="glass w-full max-w-md p-8 bg-white border border-slate-200 shadow-xl rounded-3xl text-center">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <KeyRound size={26} className="text-rose-500" />
            </div>
            <h2 className="font-heading font-bold text-xl text-slate-900 mb-2">Link expired or invalid</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              This password reset link has already been used or has expired.
              Please request a new one.
            </p>
            <Link to="/forgot-password">
              <Button className="w-full">Request a new link</Button>
            </Link>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col bg-surface overflow-x-hidden">
        <PublicNavbar />
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
          <div className="glass w-full max-w-md p-8 bg-white border border-slate-200 shadow-xl rounded-3xl text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <h2 className="font-heading font-bold text-xl text-slate-900 mb-2">Password updated!</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Your password has been changed successfully. You can now sign in with your new password.
            </p>
            <Button className="w-full" onClick={() => navigate('/login')}>
              Continue to Login
            </Button>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-surface overflow-x-hidden">
      <PublicNavbar />
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
        <div
          className={`w-full max-w-md p-8 bg-white border border-slate-200 shadow-xl rounded-3xl transition-all duration-700 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-200">
            <img src={logoImg} alt="Logo" className="w-10 h-10 object-contain" />
            <span className="font-heading font-bold text-xl text-slate-900">
              Deadline<span className="text-brand">Hub</span>
            </span>
          </div>

          <div className="mb-6">
            <h2 className="font-heading font-bold text-2xl text-slate-900">Set new password</h2>
            <p className="text-sm text-slate-500 mt-1">Choose a strong password for your account.</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="New Password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                helperText="Minimum 6 characters."
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                tabIndex={-1}
                className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                label="Confirm Password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(p => !p)}
                tabIndex={-1}
                className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <Button type="submit" className="w-full !mt-5" isLoading={loading}>
              {loading ? 'Updating…' : 'Update Password'}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck size={13} className="text-[#748469]" />
            Your data is encrypted and secure
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
};
