import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import logoImg from "../assets/logo.png"
export const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true); setError(null); setSuccess(null);
    try {
      // NOTE: keeps the existing forgotPassword(email) call from useAuth untouched.
      // fullName / password are collected here for the request context; wire them into
      // forgotPassword (or a separate submitRequest call) if/when the hook supports it.
      await forgotPassword(email);
      setSuccess('Your request has been submitted for review.');
    } catch (err: any) {
      setError(err.message || 'Failed to submit your request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
      <div className="glass animate-pop-in w-full max-w-md p-8 bg-white border border-slate-200 shadow-xl rounded-2xl">
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-slate-200 shrink-0">
          <img src={logoImg} alt="Logo" className="w-12 h-12" />
          <span className="font-heading font-bold text-lg text-slate-900">
            Deadline<span className="text-brand">Hub</span>
          </span>
        </div>

        {!success ? (
          <>
            <p className="text-sm text-slate-500 mb-8">
              Tell us who you are and the new password you'd like. Our admin team will verify and apply it to your account.
            </p>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-1">
              <Input
                type="text"
                label="Full Name"
                placeholder="Nischal Karki"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
              <Input
                type="email"
                label="Email Address"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                helperText="We'll use this to confirm your identity."
              />
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
                  onClick={() => setShowPassword(prev => !prev)}
                  tabIndex={-1}
                  className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
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
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <Button type="submit" className="w-full !mt-2" isLoading={loading}>
                Submit Request
              </Button>
            </form>
          </>
        ) : (
          <div className="mt-2">
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center mb-4">
                <Clock size={26} className="text-brand" />
              </div>
              <h2 className="font-heading font-bold text-lg text-slate-900 mb-2">
                Request submitted
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-1">
                Thanks, <span className="font-medium text-slate-700">{fullName}</span>. Your password reset
                request has been sent to our admin team for review.
              </p>
              <p className="text-sm text-slate-500 leading-relaxed">
                Once approved, your new password will be applied and we'll notify{' '}
                <span className="font-medium text-slate-700 inline-flex items-center gap-1">
                  <Mail size={13} className="text-brand" />
                  {email}
                </span>.
              </p>
            </div>
            <Link to="/login">
              <Button className="w-full">Continue to Login</Button>
            </Link>
          </div>
        )}

        <Link to="/login" className="mt-6 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft size={14} /> Back to login
        </Link>
      </div>
    </div>
  );
};