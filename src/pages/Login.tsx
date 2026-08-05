import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true); setError(null);
    try { await login(email, password); navigate('/'); }
    catch (err: any) { setError(err.message || 'Incorrect email or password.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
      <div className="glass animate-pop-in w-full max-w-md p-8 bg-white border border-slate-200 shadow-xl rounded-2xl">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-2">
          <CheckCircle2 size={28} className="text-brand" />
          <span className="font-heading font-bold text-2xl text-slate-900">
            Tracker<span className="text-brand">.</span>
          </span>
        </div>
        <p className="text-sm text-slate-500 mb-8">Sign in to continue your projects</p>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-1">
          <Input type="email" label="Email Address" placeholder="name@example.com"
            value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          <Input type="password" label="Password" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />

          <div className="flex justify-end -mt-2 mb-4">
            <Link to="/forgot-password" className="text-xs text-slate-500 hover:text-slate-800 transition">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" isLoading={loading}>Sign In</Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-brand hover:text-brand-hover transition">Register here</Link>
        </p>

       
      </div>
    </div>
  );
};
