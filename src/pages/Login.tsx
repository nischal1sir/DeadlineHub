import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Zap, Layers, BarChart3, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import logoImg from '../assets/logo.png';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    if (!email || !password) {
      setError('Please fill in all fields.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setLoading(true); setError(null);
    try {
      await login(email, password);
      const stored = localStorage.getItem('tracker_auth_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.role === 'admin' || u.role === 'super_admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Layers, label: 'Role-Based Dual Portals', sub: 'Dedicated User Portal & Admin Control Center' },
    { icon: Zap, label: 'Comprehensive Task Management', sub: 'Projects → Modules → Tasks → Subtasks' },
    { icon: BarChart3, label: 'Platform Statistics & Audit Logs', sub: 'Real-time user & event tracking' },
  ];

  return (
    <div className="min-h-screen flex bg-surface overflow-hidden">
      <style>{`
        @keyframes floatBlob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.92); }
        }
        @keyframes floatBlobSlow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 30px) scale(1.15); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shakeX {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes logoGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(170, 193, 177, 0.5), 0 0 40px 10px rgba(249, 234, 215, 0.18); }
          50% { box-shadow: 0 0 0 8px rgba(170, 193, 177, 0.1), 0 0 60px 20px rgba(249, 234, 215, 0.32); }
        }
        @keyframes logoPop {
          0% { opacity: 0; transform: scale(0.5) rotate(-8deg); }
          60% { opacity: 1; transform: scale(1.08) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes orbitRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes drift {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }
        @keyframes drawLine {
          0% { stroke-dashoffset: 240; opacity: 0; }
          15% { opacity: 0.6; }
          60% { stroke-dashoffset: 0; opacity: 0.6; }
          85% { opacity: 0.15; }
          100% { stroke-dashoffset: -240; opacity: 0; }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 0.3; r: 2; }
          50% { opacity: 1; r: 3; }
        }
        @keyframes waveMove {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes shapeFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(180deg); }
        }
        .anim-blob { animation: floatBlob 10s ease-in-out infinite; }
        .anim-blob-slow { animation: floatBlobSlow 14s ease-in-out infinite; }
        .anim-fade-up { animation: fadeSlideUp 0.6s ease-out both; }
        .anim-fade-right { animation: fadeSlideRight 0.6s ease-out both; }
        .anim-shake { animation: shakeX 0.45s ease-in-out; }
        .anim-logo-pop { animation: logoPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both, logoGlow 3s ease-in-out infinite 0.8s; }
        .anim-orbit { animation: orbitRing 18s linear infinite; }
        .anim-orbit-rev { animation: orbitRing 24s linear infinite reverse; }
        .anim-twinkle { animation: twinkle 2.6s ease-in-out infinite; }
        .anim-shape { animation: shapeFloat 8s ease-in-out infinite; }
        .anim-wave { animation: waveMove 16s linear infinite; }
        .brand-shimmer {
          background: linear-gradient(90deg, #ffffff 30%, #F9EAD7 45%, #AAC1B1 55%, #ffffff 70%);
          background-size: 250% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .mesh-bg {
          background: #748469;
        }
        .constellation-line {
          stroke-dasharray: 240;
          animation: drawLine 6s ease-in-out infinite;
        }
        .constellation-dot {
          animation: pulseDot 3s ease-in-out infinite;
        }
      `}</style>

      {/* Left: immersive brand / motion side — 75% */}
      <div className="hidden lg:flex lg:w-[75%] relative overflow-hidden mesh-bg">
        {/* ambient blobs */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="anim-blob absolute top-[10%] left-[8%] w-80 h-80 rounded-full bg-[#AAC1B1] blur-3xl" />
          <div className="anim-blob-slow absolute bottom-[8%] right-[10%] w-[28rem] h-[28rem] rounded-full bg-[#F9EAD7] blur-3xl" />
          <div className="anim-blob absolute top-[45%] right-[25%] w-56 h-56 rounded-full bg-[#ABB290] blur-3xl" style={{ animationDelay: '2s' }} />
        </div>

        {/* floating outline shapes */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="anim-shape absolute top-[15%] right-[15%] w-14 h-14 border border-[#F9EAD7]/40 rounded-2xl" />
          <div className="anim-shape absolute bottom-[22%] left-[12%] w-10 h-10 border border-[#AAC1B1]/40 rounded-full" style={{ animationDelay: '1.5s', animationDuration: '10s' }} />
          <div className="anim-shape absolute top-[55%] left-[6%] w-8 h-8 border border-white/25" style={{ animationDelay: '3s', animationDuration: '9s' }} />
          <div className="anim-shape absolute bottom-[35%] right-[8%] w-6 h-6 border border-[#F9EAD7]/40 rounded-full" style={{ animationDelay: '0.7s', animationDuration: '7s' }} />
        </div>

        {/* animated constellation network */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F9EAD7" stopOpacity="0" />
              <stop offset="50%" stopColor="#F9EAD7" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#AAC1B1" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[
            { x1: '12%', y1: '20%', x2: '32%', y2: '38%', delay: '0s' },
            { x1: '32%', y1: '38%', x2: '20%', y2: '60%', delay: '1.2s' },
            { x1: '65%', y1: '15%', x2: '82%', y2: '30%', delay: '2.4s' },
            { x1: '78%', y1: '55%', x2: '60%', y2: '70%', delay: '0.6s' },
            { x1: '45%', y1: '25%', x2: '65%', y2: '15%', delay: '3.2s' },
            { x1: '20%', y1: '60%', x2: '40%', y2: '75%', delay: '1.8s' },
          ].map((l, i) => (
            <line
              key={i}
              x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="url(#lineGrad)"
              strokeWidth="1"
              className="constellation-line"
              style={{ animationDelay: l.delay }}
            />
          ))}
          {[
            { cx: '12%', cy: '20%' }, { cx: '32%', cy: '38%' }, { cx: '20%', cy: '60%' },
            { cx: '65%', cy: '15%' }, { cx: '82%', cy: '30%' }, { cx: '78%', cy: '55%' },
            { cx: '60%', cy: '70%' }, { cx: '45%', cy: '25%' }, { cx: '40%', cy: '75%' },
          ].map((d, i) => (
            <circle
              key={i}
              cx={d.cx} cy={d.cy} r="2"
              fill="#F9EAD7"
              className="constellation-dot"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </svg>

        {/* gentle wave silhouette at the base */}
        <svg
          className="absolute bottom-0 left-0 w-[200%] h-40 opacity-[0.15] anim-wave"
          viewBox="0 0 2400 200"
          preserveAspectRatio="none"
        >
          <path
            d="M0,100 C200,180 400,20 600,100 C800,180 1000,20 1200,100 C1400,180 1600,20 1800,100 C2000,180 2200,20 2400,100 L2400,200 L0,200 Z"
            fill="#AAC1B1"
          />
        </svg>

        {/* twinkling particles */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="anim-twinkle absolute rounded-full bg-[#F9EAD7]"
              style={{
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
                top: `${(i * 37) % 90 + 5}%`,
                left: `${(i * 53) % 90 + 5}%`,
                animationDelay: `${(i * 0.37) % 3}s`,
              }}
            />
          ))}
        </div>

        {/* content */}
        <div className="relative z-10 w-full flex flex-col items-center justify-center px-16 py-12 text-center">
          {/* Attention-grabbing logo */}
          <div className="relative mb-10 anim-fade-up" style={{ animationDelay: '0.05s' }}>
            <div className="anim-orbit absolute -inset-6 rounded-full border border-[#F9EAD7]/25 border-dashed" />
            <div className="anim-orbit-rev absolute -inset-10 rounded-full border border-[#AAC1B1]/20 border-dashed" />
            <div className="anim-logo-pop relative w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-1 ring-white/20">
              <img src={logoImg} alt="Logo" className="w-14 h-14 drop-shadow-lg" />
            </div>
          </div>
          <div className="anim-fade-up" style={{ animationDelay: '0.15s' }}>
            <span className="font-heading font-extrabold text-5xl tracking-tight text-black-500">
              Deadline<span className="brand-shimmer">Hub</span>
            </span>
          </div>
          <h1
            className="mt-6 text-2xl md:text-3xl font-heading font-semibold text-slate-200 leading-snug max-w-xl anim-fade-up"
            style={{ animationDelay: '0.25s' }}
          >
            Manage projects with intelligence
          </h1>
          <p
            className="mt-4 text-black text-base leading-relaxed max-w-md anim-fade-up"
            style={{ animationDelay: '0.35s' }}
          >
            Track tasks, organize modules, collaborate with your team, and monitor system metrics — all in one place.
          </p>

          {/* feature pills */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
            {features.map((item, i) => (
              <div
                key={item.label}
                className="anim-fade-up group flex flex-col items-center text-center gap-2 p-4 rounded-2xl bg-white/5 backdrop-blur-sm ring-1 ring-white/10 hover:ring-[#F9EAD7]/40 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${0.45 + i * 0.1}s` }}
              >
                <div className="w-9 h-9 rounded-xl bg-[#AAC1B1]/25 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#AAC1B1]/40 transition-all duration-300">
                  <item.icon size={16} className="text-[#F9EAD7]" />
                </div>
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="text-xs text-black">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: compact login — 25% */}
      <div className="flex-1 lg:w-[25%] flex items-center justify-center p-6 relative bg-surface">
        <div className="hidden lg:block absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#eef4f0] blur-3xl opacity-70 anim-blob-slow" />
        <div
          className={`w-full max-w-sm relative z-10 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="anim-logo-pop w-10 h-10 rounded-2xl bg-[#f0f3ee] flex items-center justify-center ring-1 ring-[#AAC1B1]/50">
              <img src={logoImg} alt="Logo" className="w-6 h-6" />
            </div>
            <span className="font-heading font-bold text-2xl text-black-500">
              Deadline<span className="text-brand">Hub</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className="font-heading font-bold text-2xl text-slate-900 flex items-center gap-2">
              Welcome back
            </h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to your account to continue</p>
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

          <form onSubmit={handleSubmit} className={`space-y-4 ${shake ? 'anim-shake' : ''}`}>
            <div className="transition-transform duration-200 focus-within:scale-[1.01]">
              <Input
                type="email"
                label="Email Address"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <div className="relative transition-transform duration-200 focus-within:scale-[1.01]">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-xs text-slate-500 hover:text-slate-800 hover:underline transition">
                  Forgot password?
                </Link>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              isLoading={loading}
            >
              {loading ? 'Signing you in…' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand hover:text-brand-hover transition">
              Register here
            </Link>
          </p>

          <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck size={13} className="text-[#748469]" />
            Your data is encrypted and secure
          </div>
        </div>
      </div>
    </div>
  );
};