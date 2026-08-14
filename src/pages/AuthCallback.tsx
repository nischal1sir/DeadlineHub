import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import logoImg from '../assets/logo.png';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { Footer as PublicFooter } from '../components/layout/PublicFooter';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

type Step = 'loading' | 'phone-prompt' | 'syncing' | 'error';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { setSessionUser } = useAuth();
  const [step, setStep] = useState<Step>('loading');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ── On mount: let Supabase pick up the OAuth tokens from the URL ── */
  useEffect(() => {
    const handleCallback = async () => {
      try {
        let session = null;

        // 1. Check if PKCE code parameter exists in URL
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');

        if (code) {
          const { data, error: codeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (codeErr) {
            console.error('[AuthCallback] exchangeCodeForSession error:', codeErr);
          } else {
            session = data.session;
          }
        }

        // 2. Fallback to getSession for implicit flow or established sessions
        if (!session) {
          const { data, error: sessErr } = await supabase.auth.getSession();
          if (sessErr) {
            console.error('[AuthCallback] getSession error:', sessErr);
            throw sessErr;
          }
          session = data?.session;
        }

        if (!session) {
          const urlError = searchParams.get('error_description') || searchParams.get('error');
          setErrorMsg(urlError || 'Authentication failed or was cancelled. Please try again.');
          setStep('error');
          return;
        }

        // Sync profile and land directly on user dashboard
        await syncProfileAndRedirect(session.access_token);
      } catch (err: any) {
        console.error('[AuthCallback] Catch error:', err);
        setErrorMsg(err.message || 'Something went wrong. Please try again.');
        setStep('error');
      }
    };

    handleCallback();
  }, []);

  /* ── Sync Google profile to backend (or fallback to Supabase directly) ── */
  const syncProfileAndRedirect = async (accessToken: string) => {
    setStep('syncing');
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const mode = searchParams.get('mode') || 'login';

      let userProfile: any = null;
      let token = accessToken;

      // 1. Attempt backend synchronization
      try {
        const res = await fetch(`${BASE_URL}/auth/google-callback`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken, mode }),
        });

        if (res.ok) {
          const data = await res.json();
          userProfile = data.user;
          token = data.token || accessToken;
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'An account is already registered under this email. Please sign in instead.');
        }
      } catch (backendErr: any) {
        if (backendErr.message && backendErr.message.includes('already registered')) {
          throw backendErr;
        }
        // Backend offline or unreachable — proceed to client-side Supabase fallback
      }

      // 2. Direct Supabase Client Fallback (100% Serverless & Independent of local Express server)
      if (!userProfile) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) throw new Error('Google session expired. Please try signing in again.');

        const user = session.user;

        // Fetch or create profile directly from Supabase DB
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (dbProfile) {
          // If user clicked "Continue with Google" on Register page, but account already exists
          if (mode === 'signup' && dbProfile.created_at) {
            const createdAtMs = new Date(dbProfile.created_at).getTime();
            const isBrandNew = (Date.now() - createdAtMs) < 30000; // created within last 30s
            if (!isBrandNew) {
              await supabase.auth.signOut();
              localStorage.removeItem('tracker_jwt');
              localStorage.removeItem('tracker_auth_user');
              throw new Error('An account is already registered under this email. Please sign in instead.');
            }
          }
          userProfile = dbProfile;
        } else {
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
          const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}`;

          const cleanEmail = (user.email || '').toLowerCase();
          const defaultRole = cleanEmail === 'admin@tracker.com' ? 'super_admin' : (cleanEmail.includes('admin') ? 'admin' : 'user');

          const newProf = {
            id: user.id,
            email: user.email || '',
            full_name: fullName,
            avatar_url: avatarUrl,
            role: defaultRole,
            status: 'active',
            timezone: 'UTC',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          await supabase.from('profiles').upsert(newProf, { onConflict: 'id' });
          userProfile = newProf;
        }
      }

      // Update React AuthContext state + localStorage immediately before navigating
      setSessionUser(userProfile, token);

      // Redirect based on role
      const role = userProfile?.role;
      if (role === 'admin' || role === 'super_admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete sign-in.');
      setStep('error');
    }
  };

  /* ── Phone submission (new Google users) ── */
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);

    const cleanPhone = phone.trim();
    const phoneDigits = cleanPhone.replace(/[\s\-\(\)]/g, '');
    if (!/^\+?[0-9]{7,15}$/.test(phoneDigits)) {
      setPhoneError('Please enter a valid phone number (7–15 digits, optional + prefix).');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session lost. Please sign in again.');

      // Pass phone along with the access token to the backend
      const res = await fetch(`${BASE_URL}/auth/google-callback`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: session.access_token, phone: cleanPhone }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to save phone number');
      }

      const data = await res.json();
      setSessionUser(data.user, data.token);

      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setPhoneError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Skip phone (optional) ── */
  const handleSkipPhone = async () => {
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session lost.');
      await syncProfileAndRedirect(session.access_token);
    } catch (err: any) {
      setPhoneError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading State ── */
  if (step === 'loading' || step === 'syncing') {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <PublicNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin text-brand mx-auto mb-4" />
            <p className="text-slate-600 font-medium">
              {step === 'syncing' ? 'Setting up your account…' : 'Completing sign-in…'}
            </p>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  /* ── Error State ── */
  if (step === 'error') {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <PublicNavbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md p-8 bg-white border border-slate-200 shadow-xl rounded-3xl text-center">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-rose-500" />
            </div>
            <h2 className="font-heading font-bold text-xl text-slate-900 mb-2">Sign-in failed</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">{errorMsg}</p>
            <Button className="w-full" onClick={() => navigate('/login')}>Back to Login</Button>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  /* ── Phone Prompt (new Google users only) ── */
  return (
    <div className="min-h-screen flex flex-col bg-surface overflow-x-hidden">
      <PublicNavbar />
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md p-8 bg-white border border-slate-200 shadow-xl rounded-3xl animate-pop-in">
          {/* Logo */}
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-200">
            <img src={logoImg} alt="Logo" className="w-10 h-10 object-contain" />
            <span className="font-heading font-bold text-xl text-slate-900">
              Deadline<span className="text-brand">Hub</span>
            </span>
          </div>

          {/* Icon + Title */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center mb-3">
              <Phone size={24} className="text-brand" />
            </div>
            <h2 className="font-heading font-bold text-xl text-slate-900">One last step!</h2>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              Add a phone number to complete your profile. This helps with account recovery and team collaboration.
            </p>
          </div>

          {phoneError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              {phoneError}
            </div>
          )}

          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <Input
              type="tel"
              label="Phone Number"
              placeholder="+977 9800000000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              helperText="Include country code (e.g. +977 or +1)."
              autoComplete="tel"
              autoFocus
            />
            <Button
              type="submit"
              className="w-full !mt-2"
              isLoading={submitting}
            >
              {submitting ? 'Saving…' : 'Complete Setup'}
            </Button>
          </form>

          <button
            onClick={handleSkipPhone}
            disabled={submitting}
            className="mt-4 w-full text-center text-sm text-slate-400 hover:text-slate-600 transition disabled:opacity-50"
          >
            Skip for now →
          </button>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <CheckCircle2 size={13} className="text-[#748469]" />
            Your Google account is securely connected
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
};
