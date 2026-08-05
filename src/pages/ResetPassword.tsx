import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const ResetPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) { setError('Please fill in both fields.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError(null); setSuccess(null);
    try {
      await resetPassword(password);
      setSuccess('Password updated successfully!');
    } catch (err: any) { setError(err.message || 'Failed to update password.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
      <div className="glass animate-pop-in w-full max-w-md p-8 bg-white border border-slate-200 shadow-xl rounded-2xl">
        <div className="flex items-center gap-2.5 mb-2">
          <CheckCircle2 size={28} className="text-brand" />
          <span className="font-heading font-bold text-2xl text-slate-900">
            Tracker<span className="text-brand">.</span>
          </span>
        </div>
        <p className="text-sm text-slate-500 mb-8">Set a new password</p>

        {error && <div className="mb-5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">{error}</div>}
        {success && <div className="mb-5 px-4 py-3 rounded-xl bg-brand-light border border-brand/30 text-brand text-sm font-medium">{success}</div>}

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-1">
            <Input type="password" label="New Password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required helperText="Minimum 6 characters." />
            <Input type="password" label="Confirm Password" placeholder="••••••••"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            <Button type="submit" className="w-full !mt-2" isLoading={loading}>Reset Password</Button>
          </form>
        ) : (
          <Link to="/login"><Button className="w-full">Continue to Login</Button></Link>
        )}

        <Link to="/login" className="mt-6 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft size={14} /> Back to login
        </Link>
      </div>
    </div>
  );
};
