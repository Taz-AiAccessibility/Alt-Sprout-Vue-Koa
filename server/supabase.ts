import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Load environment variables safely
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables.');
  process.exit(1);
}

// ✅ Secure Supabase Client (For admin authentication)
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false }, // Prevent service role session persistence
  }
);

// ✅ Helper to get user-authenticated Supabase client
export const getSupabaseClient = (token?: string) => {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }, // ✅ Ensure session persistence
    global: { headers: { Authorization: token ? `Bearer ${token}` : '' } },
  });
};

// 🔹 Test Supabase Connection
(async () => {
  console.log('🔍 Checking Supabase connection...');

  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    console.error('❌ Supabase Connection Error:', error);
  } else if (data.users.length === 0) {
    console.warn('⚠️ No users exist in Supabase Auth yet.');
  } else {
    console.log(
      '✅ Supabase Connected Successfully:',
      data.users.length,
      'users found.'
    );
  }
})();
