import jwt from 'jsonwebtoken';
import { supabase } from '../supabaseClient.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  try {
    // Verify against the access token secret (short-lived, 15m)
    const secret = process.env.JWT_SECRET || 'project_intelligence_secret_jwt_token_2026';
    const decoded = jwt.verify(token, secret);
    
    // Fetch profile details from Supabase
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'User session invalid or user not found.' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'This account has been deactivated. Please contact the administrator.' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid or expired authentication token.' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    return res.status(403).json({ message: 'Access denied. Administrative privileges required.' });
  }
  next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Access denied. Super Admin privileges required.' });
  }
  next();
};
