import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);

// 🔹 Test the connection
(async () => {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);

    if (error) {
      console.error('❌ Supabase Connection Error:', error);
    } else {
      console.log('✅ Supabase Connected Successfully!');
    }
  } catch (err) {
    console.error('❌ Unexpected Error Connecting to Supabase:', err);
  }
})();
