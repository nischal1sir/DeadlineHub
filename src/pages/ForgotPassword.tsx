import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import logoImg from '../assets/logo.png';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { Footer as PublicFooter } from '../components/layout/PublicFooter';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      // Show success even if email doesn't exist (prevents email enumeration)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Only show real errors — swallow "user not found" for security
        if (res.status !== 400 || !data?.message?.toLowerCase().includes('not found')) {
          throw new Error(data.message || 'Something went wrong. Please try again.');
        }
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success State ────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-surface overflow-x-hidden">
        <PublicNavbar />
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
          <div className="glass w-full max-w-md p-8 bg-white border border-slate-200 shadow-xl rounded-3xl">
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
                <CheckCircle2 size={30} className="text-emerald-500" />
              </div>
              <h2 className="font-heading font-bold text-xl text-slate-900 mb-2">
                Check your inbox!
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-1">
                We've sent a password reset link to:
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full mb-4">
                <Mail size={13} className="text-brand" />
                {email}
              </span>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                Click the link in the email to set your new password. If you don't see it, check your spam folder.
                The link expires in <strong>1 hour</strong>.
              </p>
            </div>
            <Link to="/login">
              <Button className="w-full mt-4">Back to Login</Button>
            </Link>
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
            <h2 className="font-heading font-bold text-2xl text-slate-900">Forgot your password?</h2>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              No worries! Enter your email and we'll send you a reset link straight to your inbox.
            </p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              helperText="We'll send the reset link to this address."
            />
            <Button type="submit" className="w-full !mt-5" isLoading={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </form>

          <Link
            to="/login"
            className="mt-6 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft size={14} /> Back to login
          </Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
};