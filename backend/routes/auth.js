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
  sameSite: isProd ? 'none' : 'lax',     // 'none' required for cross-origin (Vercel -> Render)
  maxAge: 15 * 24 * 60 * 60 * 1000,    // 15 days in milliseconds
  path: '/api/auth'                      // limit cookie scope to auth endpoints
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeTokens = (profile) => {
  const payload = { id: profile.id, email: profile.email, role: profile.role };
  const accessToken  = jwt.sign(payload, ACCESS_SECRET,  { expiresIn: ACCESS_TOKEN_TTL });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
  return { accessToken, refreshToken };
};

const logActivity = async (userId, action, category, details) => {
  try {
    await supabase.from('activity_logs').insert([{
      user_id: userId,
      action,
      category,
      details,
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

  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'user' }
    });

    if (authError) throw authError;

    const user = authData.user;
    if (!user) throw new Error('User creation failed.');

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const sessionProfile = profile || {
      id: user.id, email, full_name: fullName, role: 'user', status: 'active'
    };

    const { accessToken, refreshToken } = makeTokens(sessionProfile);

    await logActivity(sessionProfile.id, 'USER_REGISTER', 'auth', `Registered new account: ${fullName}`);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
    res.status(201).json({ token: accessToken, user: sessionProfile });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw authError;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) throw new Error('User profile record not found.');

    if (profile.status === 'inactive') {
      return res.status(403).json({ message: 'This account has been deactivated. Please contact the administrator.' });
    }

    const { accessToken, refreshToken } = makeTokens(profile);

    await logActivity(profile.id, 'USER_LOGIN', 'auth', `User logged in as ${profile.role.toUpperCase()}`);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
    res.json({ token: accessToken, user: profile });
  } catch (err) {
    const errorMessage = err.message && err.message.includes('Email not confirmed')
      ? 'Email or password is incorrect'
      : (err.message || 'Email or password is incorrect');
    res.status(401).json({ message: errorMessage });
  }
});

// ── Refresh Token ─────────────────────────────────────────────────────────────
// Called silently by the frontend when the access token expires (401).
// Validates the httpOnly refresh cookie and issues a fresh pair.
router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ message: 'No refresh token. Please log in again.' });
  }

  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);

    // Re-fetch profile to catch any role/status changes since token was issued
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

    // Rotate the refresh token — issues a brand-new cookie each time
    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTS);
    res.json({ token: accessToken, user: profile });
  } catch (err) {
    // Token expired or tampered — force a full login
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

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    res.json({ message: 'Password reset request processed. Check your inbox.' });
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
    const { error } = await supabase.auth.admin.updateUserById(decoded.id, { password });
    if (error) throw error;

    await logActivity(decoded.id, 'RESET_PASSWORD', 'auth', 'Password updated successfully');
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
