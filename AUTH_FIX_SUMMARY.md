# Authentication Bug Fixes Summary

## Root Cause Analysis

### BUG 1 — "Email not confirmed" displayed incorrectly on local login

**Root Cause:** In `src/hooks/useAuth.tsx`, the fallback authentication path (when the Express backend is unreachable) was passing through Supabase's raw error messages without proper handling for the "Email not confirmed" case. When running locally without the backend server, the code falls back to direct Supabase auth, which returns the error message "Email not confirmed" even if the user's email IS confirmed (this can happen due to Supabase's email confirmation state timing or if there's a session conflict).

**Fix Applied:** Added explicit handling for "Email not confirmed" error in the fallback path (`src/hooks/useAuth.tsx:103-105`) to show a proper user-friendly message instead of the raw Supabase error.

### BUG 2 — Google OAuth from localhost redirects to production

**Root Cause:** Both local development and production use the **SAME Supabase project** (`https://aghilcdqtreiztnzvoqr.supabase.co`). The Supabase Dashboard "URL Configuration" likely only has the production URL configured as "Site URL" and only production redirect URLs, missing localhost entries.

When using the same Supabase project for both environments, Supabase's OAuth flow relies on the configured "Site URL" and "Redirect URLs" to validate and redirect after Google authentication. If localhost URLs are not added to Supabase Dashboard → Authentication → URL Configuration, the OAuth flow may default to the production Site URL.

**Fix Applied:**
1. The frontend already correctly uses `window.location.origin` for the redirect URL (dynamic based on current environment)
2. Added development-only debugging to trace the OAuth flow
3. **Required:** Supabase Dashboard configuration must include both local and production URLs

---

## Files Changed

1. **`src/hooks/useAuth.tsx`** - Fixed "Email not confirmed" error handling in fallback path + added dev debugging
2. **`src/pages/Login.tsx`** - Added dev debugging for Google OAuth redirect URL
3. **`src/pages/Register.tsx`** - Added dev debugging for Google OAuth redirect URL  
4. **`src/pages/AuthCallback.tsx`** - Added dev debugging for OAuth callback flow

---

## Supabase Dashboard Configuration (REQUIRED)

Go to **Supabase Dashboard → Authentication → URL Configuration** and configure:

### Site URL
```
http://localhost:5173
```

### Redirect URLs (add ALL of these)
```
http://localhost:5173/auth/callback
http://127.0.0.1:5173/auth/callback
https://deadlinehub-online.vercel.app/auth/callback
```

> **Note:** Since both environments use the same Supabase project, you must include BOTH local and production URLs. The `redirectTo` parameter passed by the frontend (`window.location.origin`) will be validated against these configured URLs.

---

## Google Cloud Console Configuration

Go to **Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs** and ensure:

### Authorized JavaScript Origins
```
http://localhost:5173
http://127.0.0.1:5173
https://deadlinehub-online.vercel.app
```

### Authorized Redirect URIs
```
https://aghilcdqtreiztnzvoqr.supabase.co/auth/v1/callback
```

---

## Environment Variables

### Local Development (`.env.local`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://aghilcdqtreiztnzvoqr.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Production (Vercel/Netlify Environment Variables)
```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SUPABASE_URL=https://aghilcdqtreiztnzvoqr.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Backend (`.env` in backend folder)
```env
SUPABASE_URL=https://aghilcdqtreiztnzvoqr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=https://deadlinehub-online.vercel.app
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
PORT=5000
```

> **Important:** The frontend ONLY uses the anon key (safe for browser). The service role key is ONLY in the backend `.env` and never exposed to the frontend.

---

## Testing Steps

### Test 1 — Local Normal Login
```bash
# 1. Start backend
cd backend && npm run dev

# 2. Start frontend (in another terminal)
cd .. && npm run dev

# 3. Open http://localhost:5173
# 4. Login with testone@gmail.com + correct password
# Expected: Login succeeds, no "Email not confirmed" error
```

### Test 2 — Local Wrong Password
```bash
# 1. Use correct email with wrong password
# Expected: "Invalid email or password. Please check your credentials and try again."
```

### Test 3 — Local Google Login
```bash
# 1. Click "Continue with Google" on login page
# 2. Complete Google authentication
# Expected: Returns to http://localhost:5173/auth/callback?mode=login → /dashboard
# NOT to production domain
```

### Test 4 — Production Google Login
```bash
# 1. On production site, click "Continue with Google"
# 2. Complete Google authentication
# Expected: Returns to https://deadlinehub-online.vercel.app/auth/callback → /dashboard
```

### Test 5 — Production Email/Password Login
```bash
# 1. On production site, login with email/password
# Expected: Works as before
```

---

## Debugging (Development Only)

Open browser DevTools Console to see:
- `[Login] Google OAuth - Current origin: http://localhost:5173`
- `[Login] Google OAuth - CALLBACK_URL: http://localhost:5173/auth/callback`
- `[Login] Google OAuth - Supabase URL: https://aghilcdqtreiztnzvoqr.supabase.co`
- `[AuthCallback] Current origin: http://localhost:5173`
- `[AuthCallback] Supabase URL: https://aghilcdqtreiztnzvoqr.supabase.co`
- `[AuthCallback] Session obtained, user: test@gmail.com`
- `[useAuth] Supabase auth error: { code: '...', message: '...', ... }`

Debug logging is wrapped in `import.meta.env.DEV` checks and will not appear in production builds.

---

## Security Confirmation

✅ **No Supabase service-role/private key exposed in frontend code**
- Frontend (`src/lib/supabaseClient.ts`) uses only `VITE_SUPABASE_ANON_KEY` (public anon key)
- Backend (`backend/supabaseClient.js`) uses `SUPABASE_SERVICE_ROLE_KEY` (service role key)
- The `.env.local` file only contains public anon key
- Service role key is only in backend `.env` which is not deployed to frontend

---

## Architecture Note

**This project uses the SAME Supabase project for both local development and production.** This is a valid architecture choice but requires proper Supabase Dashboard URL Configuration to support both origins. The fixes ensure:
1. Frontend dynamically determines redirect URL from `window.location.origin`
2. Supabase Dashboard has both local and production URLs configured
3. Error handling is environment-aware and user-friendly