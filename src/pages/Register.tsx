import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, Rocket, Timer, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import logoImg from '../assets/logo.png';

import { PublicNavbar } from '../components/layout/PublicNavbar';
import { Footer as PublicFooter } from '../components/layout/PublicFooter';
import { AuthHeroClock } from '../components/Clock/AuthHeroClock';

const CALLBACK_URL = `${window.location.origin}/auth/callback`;

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      if (import.meta.env.DEV) {
        console.log('[Register] Google OAuth - Current origin:', window.location.origin);
        console.log('[Register] Google OAuth - CALLBACK_URL:', CALLBACK_URL);
        console.log('[Register] Google OAuth - Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
        console.log('[Register] Google OAuth - Full redirectTo:', `${CALLBACK_URL}?mode=signup`);
      }
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${CALLBACK_URL}?mode=signup` },
      });
      if (import.meta.env.DEV) {
        console.log('[Register] Google OAuth - signInWithOAuth data:', data);
      }
      if (error) throw error;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('[Register] Google OAuth error:', err);
      }
      setError(err.message || 'Google sign-up failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    setLoading(true);
    setError(null);
    try {
      await register(email, password, fullName);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const signupHighlights = [
    { icon: Rocket, label: 'Instant Setup', sub: 'Get started in under 60 seconds' },
    { icon: Timer, label: 'Live Deadline Radar', sub: 'Automated notification & tracking' },
    { icon: Users, label: 'Team Workspace', sub: 'Role-based collaboration' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <PublicNavbar />

      {/* Main Container Aligned with PublicNavbar max-w-7xl */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col justify-center overflow-x-hidden">
        <div className="w-full flex flex-col lg:flex-row items-stretch gap-6 xl:gap-8 min-h-[600px] lg:min-h-[640px]">
          <style>{`
            @keyframes shakeX {
              10%, 90% { transform: translateX(-1px); }
              20%, 80% { transform: translateX(2px); }
              30%, 50%, 70% { transform: translateX(-4px); }
              40%, 60% { transform: translateX(4px); }
            }
            .anim-shake { animation: shakeX 0.45s ease-in-out; }
          `}</style>

          {/* Left Hero Clock Component */}
          <AuthHeroClock
            headline="Join the ultimate workspace platform"
            subtext="Create your account to organize projects, manage milestones, and collaborate effortlessly."
            highlights={signupHighlights}
            className="lg:w-[54%] xl:w-[56%]"
          />

          {/* Right: Register Form Panel — ~46% lg, 44% xl */}
          <div className="flex-1 lg:w-[46%] xl:w-[44%] flex items-center justify-center p-6 sm:p-8 xl:p-10 bg-white rounded-3xl border border-slate-200/80 shadow-xl relative overflow-hidden">
            <div className="hidden lg:block absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#eef4f0] blur-3xl opacity-70" />
            <div
              className={`w-full max-w-md relative z-10 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
            >
              {/* Mobile logo */}
              <div className="flex items-center gap-2.5 mb-6 lg:hidden">
                <div className="w-10 h-10 rounded-2xl bg-[#f0f3ee] flex items-center justify-center ring-1 ring-[#AAC1B1]/50">
                  <img src={logoImg} alt="Logo" className="w-6 h-6" />
                </div>
                <span className="font-heading font-bold text-2xl text-slate-900">
                  Deadline<span className="text-brand">Hub</span>
                </span>
              </div>

              <div className="mb-5">
                <h2 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900 flex items-center gap-2">
                  Create your account
                </h2>
                <p className="text-slate-500 text-sm mt-1">Get started with DeadlineHub today</p>
              </div>

              {error && (
                <div
                  className={`mb-5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium flex items-center gap-2 ${shake ? 'anim-shake' : ''
                    }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className={`space-y-3.5 ${shake ? 'anim-shake' : ''}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    type="text"
                    label="First Name"
                    placeholder="Nischal"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                    autoComplete="given-name"
                  />
                  <Input
                    type="text"
                    label="Last Name"
                    placeholder="Rai"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                    autoComplete="family-name"
                  />
                </div>
                <Input
                  type="email"
                  label="Email Address"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    helperText="Minimum 6 characters."
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    tabIndex={-1}
                    className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <Eye size={17} /> : <EyeOff size={17} />}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirm Password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    tabIndex={-1}
                    className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <Eye size={17} /> : <EyeOff size={17} />}
                  </button>
                </div>
                <Button
                  type="submit"
                  className="w-full !mt-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                  isLoading={loading}
                >
                  {loading ? 'Creating account…' : 'Create Account'}
                </Button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">or register with</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Google OAuth Button */}
              <button
                id="google-signup-btn"
                type="button"
                onClick={handleGoogleSignUp}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <svg className="animate-spin h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.2-.1-2.4-.4-3.5z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.2 0-9.7-3.1-11.3-7.5L6.1 33.6C9.5 39.6 16.3 44 24 44z"/>
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.4 4.3-4.4 5.7l.1-.1 6.2 5.2C36.9 40.9 44 35.5 44 24c0-1.2-.1-2.4-.4-3.5z"/>
                  </svg>
                )}
                {googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}
              </button>

              <p className="mt-5 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-brand hover:text-brand-hover transition">
                  Sign In
                </Link>
              </p>

              <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck size={13} className="text-[#748469]" />
                Your data is encrypted and secure
              </div>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};