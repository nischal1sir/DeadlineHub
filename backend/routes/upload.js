import { Router } from 'express';
import multer from 'multer';
import { supabase } from '../supabaseClient.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateToken);

// Configure multer memory storage (limit 5MB, images only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed.'));
    }
  }
});

// POST /api/upload/avatar — Upload avatar file to Supabase Storage
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }

    const userId = req.user.id;
    const file = req.file;
    const ext = file.originalname.split('.').pop() || 'jpg';
    const filePath = `${userId}/avatar.${ext}`;

    let avatarUrl = null;

    // Try Supabase Storage 'avatars' bucket
    try {
      // 1. Delete old avatar files in user's folder
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(userId);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
        await supabase.storage.from('avatars').remove(filesToDelete);
      }

      // 2. Upload new file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (!uploadError) {
        // 3. Get public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatarUrl = urlData?.publicUrl;
      } else {
        console.warn('Supabase storage upload error:', uploadError.message);
      }
    } catch (e) {
      console.warn('Supabase storage upload failed, falling back to base64 Data URL:', e.message);
    }

    // Fallback if storage bucket doesn't exist or failed
    if (!avatarUrl) {
      const base64Data = file.buffer.toString('base64');
      avatarUrl = `data:${file.mimetype};base64,${base64Data}`;
    }

    // Update user profile in database
    const { data: updatedProfile, error: dbError } = await supabase
      .from('profiles')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (dbError) throw dbError;

    // Log activity
    try {
      await supabase.from('activity_logs').insert([{
        user_id: userId,
        action: 'UPDATE_AVATAR',
        category: 'user',
        details: 'Updated profile picture',
        created_at: new Date().toISOString()
      }]);
    } catch (logErr) {
      console.error('Failed to log avatar update activity:', logErr);
    }

    res.json(updatedProfile);
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ message: err.message || 'Failed to upload avatar' });
  }
});

export default router;
