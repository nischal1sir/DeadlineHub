import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email.'); return; }
    setLoading(true); setError(null); setSuccess(null);
    try {
      await forgotPassword(email);
      setSuccess('If an account exists, a reset link has been sent.');
    } catch (err: any) { setError(err.message || 'Account not found.'); }
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
        <p className="text-sm text-slate-500 mb-8">Reset your account password</p>

        {error && <div className="mb-5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">{error}</div>}
        {success && <div className="mb-5 px-4 py-3 rounded-xl bg-brand-light border border-brand/30 text-brand text-sm font-medium">{success}</div>}

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-1">
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Enter the email associated with your account and we'll send you a reset link.
            </p>
            <Input type="email" label="Email Address" placeholder="name@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <Button type="submit" className="w-full !mt-2" isLoading={loading}>Send Reset Email</Button>
          </form>
        ) : (
          <Link to="/login">
            <Button className="w-full">Return to Login</Button>
          </Link>
        )}

        <Link to="/login" className="mt-6 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft size={14} /> Back to login
        </Link>
      </div>
    </div>
  );
};
