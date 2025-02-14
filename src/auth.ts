import { supabase } from './utils/supabase';

export async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });

  if (error) console.error('OAuth Error:', error.message);
}

export async function logout() {
  await supabase.auth.signOut();
  localStorage.removeItem('token');
  window.location.reload();
}
