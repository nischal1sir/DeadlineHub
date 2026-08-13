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
  const { email, password, fullName, phone } = req.body;

  if (!email || !password || !fullName || !phone) {
    return res.status(400).json({ message: 'Email, password, full name, and phone number are required.' });
  }

  const cleanPhone = phone.trim();
  const phoneDigits = cleanPhone.replace(/[\s\-\(\)]/g, '');
  if (!/^\+?[0-9]{7,15}$/.test(phoneDigits)) {
    return res.status(400).json({ message: 'Please enter a valid phone number (7 to 15 digits, optional + prefix).' });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      phone: cleanPhone,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
        name: fullName.trim(),
        display_name: fullName.trim(),
        phone: cleanPhone,
        role: 'user'
      }
    });

    if (authError) throw authError;

    const user = authData.user;
    if (!user) throw new Error('User creation failed.');

    // Ensure phone is saved in profiles table
    try {
      await supabase
        .from('profiles')
        .update({ phone: cleanPhone })
        .eq('id', user.id);
    } catch (dbErr) {
      console.warn('Failed to update phone in profiles table:', dbErr.message);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const sessionProfile = profile || {
      id: user.id, email, full_name: fullName.trim(), phone: cleanPhone, role: 'user', status: 'active'
    };

    const { accessToken, refreshToken } = makeTokens(sessionProfile);

    await logActivity(sessionProfile.id, 'USER_REGISTER', 'auth', `Registered new account: ${fullName.trim()} (${cleanPhone})`, req);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
    res.status(201).json({ token: accessToken, user: sessionProfile });
  } catch (err) {
    const msg = err.message || '';
    if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists') || msg.includes('duplicate key')) {
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

    await logActivity(profile.id, 'USER_LOGIN', 'auth', `User logged in as ${profile.role.toUpperCase()}`, req);

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

  // Build the redirect URL — points to the /reset-password page on the frontend
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
    const { error } = await supabase.auth.admin.updateUserById(decoded.id, { password });
    if (error) throw error;

    await logActivity(decoded.id, 'RESET_PASSWORD', 'auth', 'Password updated successfully');
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── Google OAuth Callback ─────────────────────────────────────────────────────
// Called by the frontend /auth/callback page after Google OAuth redirect.
// Verifies the Supabase access token, syncs the user profile, returns our JWT.
router.post('/google-callback', async (req, res) => {
  const { accessToken, phone, mode } = req.body;
  if (!accessToken) return res.status(400).json({ message: 'Access token is required.' });

  try {
    // Verify the Supabase access token and get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) throw new Error('Invalid or expired Google token.');

    // If user attempted Google Sign-Up from Register page, but account already existed
    if (mode === 'signup' && user.created_at) {
      const userCreatedAt = new Date(user.created_at).getTime();
      const isBrandNewUser = (Date.now() - userCreatedAt) < 30000; // 30s window
      if (!isBrandNewUser) {
        return res.status(400).json({
          message: 'An account is already registered under this email. Please sign in instead.'
        });
      }
    }

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

    let profile;

    if (existingProfile) {
      // Existing profile — update fields cleanly
      const updates = {
        full_name: existingProfile.full_name || fullName,
        avatar_url: existingProfile.avatar_url || avatarUrl,
        updated_at: new Date().toISOString()
      };
      if (phone) updates.phone = phone;

      const { data: updated, error: updateErr } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      if (updateErr) throw updateErr;
      profile = updated;
    } else {
      // New profile — upsert safely in case database trigger already created it
      const newProfile = {
        id: user.id,
        email: user.email,
        full_name: fullName,
        phone: phone || null,
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
      if (createErr) throw createErr;
      profile = created;

      await logActivity(profile.id, 'GOOGLE_OAUTH_REGISTER', 'auth',
        `New account via Google OAuth: ${fullName} (${user.email})`, req);
    }

    if (profile.status === 'inactive') {
      return res.status(403).json({ message: 'This account has been deactivated. Contact an administrator.' });
    }

    const { accessToken: jwtAccess, refreshToken } = makeTokens(profile);

    await logActivity(profile.id, 'GOOGLE_OAUTH_LOGIN', 'auth',
      `Signed in via Google OAuth as ${profile.role.toUpperCase()}`, req);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
    res.json({ token: jwtAccess, user: profile });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
