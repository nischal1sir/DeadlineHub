import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, Rocket, Timer, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import logoImg from '../assets/logo.png';

import { PublicNavbar } from '../components/layout/PublicNavbar';
import { Footer as PublicFooter } from '../components/layout/PublicFooter';
import { AuthHeroClock } from '../components/Clock/AuthHeroClock';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const cleanPhone = phone.trim();
    const phoneDigits = cleanPhone.replace(/[\s\-\(\)]/g, '');
    if (!/^\+?[0-9]{7,15}$/.test(phoneDigits)) {
      setError('Please enter a valid phone number (7 to 15 digits, optional + prefix).');
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
      await register(email, password, fullName, cleanPhone);
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

              <div className="mb-6">
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
                <Input
                  type="tel"
                  label="Phone Number"
                  placeholder="+977 9800000000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  helperText="Include country code (e.g. +977 or +1)."
                  autoComplete="tel"
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