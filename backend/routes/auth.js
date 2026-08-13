import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../supabaseClient.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'project_intelligence_secret_jwt_token_2026';

// Helper function to log activity
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

// Register Route
router.post('/register', async (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ message: 'Email, password, and full name are required.' });
  }

  try {
    // Register user via Admin API so email is auto-confirmed immediately
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,          // ← marks email as confirmed right away
      user_metadata: {
        full_name: fullName,
        role: 'user'
      }
    });

    if (authError) throw authError;

    const user = authData.user;
    if (!user) throw new Error('User creation failed.');

    // Fetch created profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const sessionProfile = profile || {
      id: user.id,
      email,
      full_name: fullName,
      role: 'user',
      status: 'active'
    };

    const token = jwt.sign(
      { id: sessionProfile.id, email: sessionProfile.email, role: sessionProfile.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logActivity(sessionProfile.id, 'USER_REGISTER', 'auth', `Registered new account: ${fullName}`);

    res.status(201).json({
      token,
      user: sessionProfile
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw authError;

    const authUser = authData.user;

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile record not found.');
    }

    if (profile.status === 'inactive') {
      return res.status(403).json({ message: 'This account has been deactivated. Please contact the administrator.' });
    }

    const token = jwt.sign(
      { id: profile.id, email: profile.email, role: profile.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logActivity(profile.id, 'USER_LOGIN', 'auth', `User logged in as ${profile.role.toUpperCase()}`);

    res.json({
      token,
      user: profile
    });
  } catch (err) {
    // Replace Supabase's "Email not confirmed" error with generic message
    const errorMessage = err.message && err.message.includes('Email not confirmed') 
      ? 'Email or password is incorrect' 
      : (err.message || 'Email or password is incorrect');
    res.status(401).json({ message: errorMessage });
  }
});

// Forgot Password Route
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

// Reset Password Route
router.post('/reset-password', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'New password is required.' });

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required to reset password.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { error } = await supabase.auth.admin.updateUserById(decoded.id, { password });
    if (error) throw error;

    await logActivity(decoded.id, 'RESET_PASSWORD', 'auth', 'Password updated successfully');
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;

