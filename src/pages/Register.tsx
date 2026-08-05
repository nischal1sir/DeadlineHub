import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError(null);
    try { await register(email, password, name); navigate('/'); }
    catch (err: any) { setError(err.message || 'Registration failed.'); }
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
        <p className="text-sm text-slate-500 mb-8">Create an account to get started</p>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-1">
          <Input type="text" label="Full Name" placeholder="John Doe"
            value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
          <Input type="email" label="Email Address" placeholder="name@example.com"
            value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          <Input type="password" label="Password" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)} required
            helperText="Minimum 6 characters." autoComplete="new-password" />
          <Button type="submit" className="w-full !mt-2" isLoading={loading}>Create Account</Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand hover:text-brand-hover transition">Sign In</Link>
        </p>
      </div>
    </div>
  );
};
