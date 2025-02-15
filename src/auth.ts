import { supabase } from './utils/supabase';

export async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`, // Adjust as needed
    },
  });

  if (error) {
    console.error('❌ OAuth Error:', error.message);
    return;
  }

  console.log('🔄 Redirecting to Google for login...');
}

// ✅ Get the user session after OAuth login
export async function getUserSession() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    console.error('❌ Failed to retrieve user session:', error);
    return null;
  }

  console.log('✅ User session retrieved:', data.user);
  return data.user;
}

// ✅ Logout securely
export async function logout() {
  await supabase.auth.signOut();
  localStorage.removeItem('token');
  window.location.reload();
}
