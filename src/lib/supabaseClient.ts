// Frontend Supabase client — uses the PUBLIC anon key (safe for browser)
// Used for: Google OAuth, password reset (client-side Supabase auth operations)
// DO NOT use for server-side admin operations — use backend/supabaseClient.js instead

import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://placeholder.supabase.co';
const supabaseAnon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'placeholder-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    '[supabaseClient] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in root .env. ' +
    'OAuth and password-reset features will remain disabled until set.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,   // required for OAuth + magic-link callbacks
  },
});
