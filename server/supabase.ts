import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const getSupabaseClient = (token?: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: token ? `Bearer ${token}` : '' } },
  });
};

// 🔹 Test the connection
(async () => {
  try {
    console.log('🔍 Testing Supabase connection...');

    const supabase = getSupabaseClient(); // ✅ Use the function correctly
    const { data, error } = await supabase.from('users').select('*').limit(1);

    if (error) {
      console.error('❌ Supabase Connection Error:', error);
    } else {
      console.log('✅ Supabase Connected Successfully! Sample Data:', data);
    }
  } catch (err) {
    console.error('❌ Unexpected Error Connecting to Supabase:', err);
  }
})();
