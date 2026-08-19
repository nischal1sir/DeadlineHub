import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../supabaseClient.js';

const router = Router();

const ACCESS_SECRET  = process.env.JWT_SECRET         || 'project_intelligence_secret_jwt_token_2026';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'project_intelligence_refresh_secret_2026';

const ACCESS_TOKEN_TTL  = '15m';   // short-lived access token
const REFRESH_TOKEN_TTL = '15d';   // long-lived refresh token

// ── Cookie config for the refresh token ──────────────────────────────────────
const isProd = process.env.NODE_ENV === 'production' || !!process.env.FRONTEND_URL;

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,                        // JS cannot read — protects against XSS
  secure: isProd,                        // MUST be true for sameSite: 'none'
  sameSite: isProd ? 'none' : 'lax',     // 'none' required for cross-origin
  maxAge: 15 * 24 * 60 * 60 * 1000,    // 15 days in milliseconds
  path: '/api/auth'                      // limit cookie scope to auth endpoints
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeTokens = (profile) => {
  const payload = { id: profile.id, email: profile.email, role: profile.role || 'user' };
  const accessToken  = jwt.sign(payload, ACCESS_SECRET,  { expiresIn: ACCESS_TOKEN_TTL });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
  return { accessToken, refreshToken };
};

// Parse a readable device/browser summary from User-Agent string
const getDeviceSummary = (ua = '') => {
  if (!ua) return 'Unknown Device';
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  return `${browser} on ${os}`;
};

const logActivity = async (userId, action, category, details, req = null) => {
  try {
    let enrichedDetails = details;
    if (req) {
      const device = getDeviceSummary(req.headers['user-agent']);
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'Unknown IP';
      enrichedDetails = `${details} | Device: ${device} | IP: ${ip}`;
    }
    await supabase.from('activity_logs').insert([{
      user_id: userId,
      action,
      category,
      details: enrichedDetails,
      created_at: new Date().toISOString()
    }]);
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

// ── Register ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ message: 'Email, password, and full name are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Check if profile already exists in public.profiles table
    const { data: existingProf } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingProf) {
      return res.status(400).json({
        message: 'An account with this email address already exists. Please sign in instead.'
      });
    }

    let user = null;

    // 2. Try auth.signUp (works with both anon and service_role keys)
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          name: fullName.trim(),
          display_name: fullName.trim(),
          role: 'user'
        }
      }
    });

    if (signUpErr) {
      // If signUp failed because of admin restrictions, try admin.createUser as fallback
      if (signUpErr.message?.includes('already registered') || signUpErr.message?.includes('already exists')) {
        return res.status(400).json({
          message: 'An account with this email address already exists. Please sign in instead.'
        });
      }

      try {
        const { data: adminData, error: adminErr } = await supabase.auth.admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName.trim(),
            name: fullName.trim(),
            role: 'user'
          }
        });
        if (adminErr) throw adminErr;
        user = adminData.user;
      } catch {
        throw signUpErr;
      }
    } else {
      // Supabase returns user with identities=[] when account already exists
      if (signUpData.user && (!signUpData.user.identities || signUpData.user.identities.length === 0)) {
        return res.status(400).json({
          message: 'An account with this email address already exists. Please sign in instead.'
        });
      }
      user = signUpData.user;
    }

    if (!user) {
      return res.status(400).json({ message: 'User registration failed. Please try again.' });
    }

    // 3. Create profile in public.profiles table (strictly default role: 'user')
    const newProfile = {
      id: user.id,
      email: user.email || cleanEmail,
      full_name: fullName.trim(),
      avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanEmail}`,
      role: 'user',
      status: 'active',
      timezone: 'UTC',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: profile, error: _profileErr } = await supabase
      .from('profiles')
      .upsert(newProfile, { onConflict: 'id' })
      .select()
      .single();

    const sessionProfile = profile || newProfile;

    const { accessToken, refreshToken } = makeTokens(sessionProfile);

    await logActivity(sessionProfile.id, 'USER_REGISTER', 'auth',
      `Registered new account: ${fullName.trim()}`, req);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
    res.status(201).json({ token: accessToken, user: sessionProfile });
  } catch (err) {
    console.error('[AUTH] Registration error:', err.message);
    const msg = err.message || '';
    if (msg.toLowerCase().includes('already registered') ||
        msg.toLowerCase().includes('already exists') ||
        msg.includes('duplicate key') ||
        msg.includes('unique constraint')) {
      return res.status(400).json({ message: 'An account with this email address already exists. Please sign in instead.' });
    }
    res.status(400).json({ message: msg || 'Registration failed.' });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (authError) {
      throw authError;
    }

    if (!authData?.user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Fetch or auto-create profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (!profile) {
      console.log(`[AUTH] Profile missing for user ${authData.user.id} (${cleanEmail}). Auto-creating...`);
      const meta = authData.user.user_metadata || {};
      const newProfile = {
        id: authData.user.id,
        email: authData.user.email || cleanEmail,
        full_name: meta.full_name || meta.display_name || meta.name || cleanEmail.split('@')[0],
        avatar_url: meta.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanEmail}`,
        role: 'user',
        status: 'active',
        timezone: 'UTC',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertedProfile, error: insertErr } = await supabase
        .from('profiles')
        .upsert(newProfile, { onConflict: 'id' })
        .select()
        .single();

      if (insertErr || !insertedProfile) {
        console.error('[AUTH] Failed to auto-create profile:', insertErr);
        profile = newProfile; // Fallback to memory object if DB upsert is blocked by RLS
      } else {
        profile = insertedProfile;
      }
    }

    if (profile.status === 'inactive') {
      return res.status(403).json({ message: 'This account has been deactivated. Please contact the administrator.' });
    }

    const { accessToken, refreshToken } = makeTokens(profile);

    await logActivity(profile.id, 'USER_LOGIN', 'auth',
      `User logged in as ${(profile.role || 'user').toUpperCase()}`, req);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
    res.json({ token: accessToken, user: profile });
  } catch (err) {
    console.error('[AUTH] Login failure:', err.message);
    let errorMessage = err.message || 'Invalid email or password.';
    if (errorMessage.includes('Invalid login credentials')) {
      errorMessage = 'Invalid email or password. Please check your credentials and try again.';
    } else if (errorMessage.includes('Email not confirmed')) {
      errorMessage = 'Your email address has not been confirmed. Please check your inbox for the confirmation email.';
    }
    res.status(401).json({ message: errorMessage });
  }
});

// ── Refresh Token ─────────────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ message: 'No refresh token. Please log in again.' });
  }

  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !profile) {
      return res.status(401).json({ message: 'User session invalid.' });
    }

    if (profile.status === 'inactive') {
      return res.status(403).json({ message: 'This account has been deactivated.' });
    }

    const { accessToken, refreshToken: newRefreshToken } = makeTokens(profile);

    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTS);
    res.json({ token: accessToken, user: profile });
  } catch {
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTS);
    res.status(401).json({ message: 'Refresh token expired or invalid. Please log in again.' });
  }
});

// ── Logout ────────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTS);
  res.json({ message: 'Logged out successfully.' });
});

// ── Forgot Password ───────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const redirectTo  = `${frontendUrl.replace(/\/$/, '')}/reset-password`;

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    res.json({ message: 'Password reset link sent. Check your inbox.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── Reset Password ────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'New password is required.' });

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required to reset password.' });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;

    await logActivity(decoded.id, 'RESET_PASSWORD', 'auth', 'Password updated successfully');
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── Google OAuth Callback ─────────────────────────────────────────────────────
router.post('/google-callback', async (req, res) => {
  const { accessToken, mode } = req.body;
  if (!accessToken) return res.status(400).json({ message: 'Access token is required.' });

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) throw new Error('Invalid or expired Google token.');

    const fullName = user.user_metadata?.full_name ||
                     user.user_metadata?.name ||
                     user.email?.split('@')[0] || 'User';
    const avatarUrl = user.user_metadata?.avatar_url ||
                      user.user_metadata?.picture ||
                      `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}`;

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (mode === 'signup' && existingProfile) {
      return res.status(400).json({
        message: 'This Gmail account is already registered. Please login instead.'
      });
    }

    let profile;

    if (existingProfile) {
      const updates = {
        full_name: existingProfile.full_name || fullName,
        avatar_url: existingProfile.avatar_url || avatarUrl,
        updated_at: new Date().toISOString()
      };

      const { data: updated, error: updateErr } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      if (updateErr) {
        profile = { ...existingProfile, ...updates };
      } else {
        profile = updated;
      }
    } else {
      const newProfile = {
        id: user.id,
        email: user.email,
        full_name: fullName,
        avatar_url: avatarUrl,
        role: 'user',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: created, error: createErr } = await supabase
        .from('profiles')
        .upsert(newProfile, { onConflict: 'id' })
        .select()
        .single();

      if (createErr) {
        profile = newProfile;
      } else {
        profile = created;
      }

      await logActivity(profile.id, 'GOOGLE_OAUTH_REGISTER', 'auth',
        `New account via Google OAuth: ${fullName} (${user.email})`, req);
    }

    if (profile.status === 'inactive') {
      return res.status(403).json({ message: 'This account has been deactivated. Contact an administrator.' });
    }

    const { accessToken: jwtAccess, refreshToken } = makeTokens(profile);

    await logActivity(profile.id, 'GOOGLE_OAUTH_LOGIN', 'auth',
      `Signed in via Google OAuth as ${(profile.role || 'user').toUpperCase()}`, req);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
    res.json({ token: jwtAccess, user: profile });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
