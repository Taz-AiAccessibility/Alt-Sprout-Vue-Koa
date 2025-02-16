import { supabase } from './utils/supabase';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Extract token from URL and store in Supabase session
export async function handleOAuthRedirect() {
  const url = new URL(window.location.href);
  const accessToken = url.hash.match(/access_token=([^&]+)/)?.[1];
  const refreshToken = url.hash.match(/refresh_token=([^&]+)/)?.[1];

  if (!accessToken || !refreshToken) {
    return;
  }

  try {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) return;

    // Remove tokens from the URL after storing them
    window.history.replaceState({}, document.title, window.location.pathname);
  } catch (err) {
    throw err;
  }
}

// Check if user is authenticated
export const checkSupabaseSession = async (user: any) => {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      return;
    }

    //  Fetch user details separately
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      return;
    }

    // Update Vue's reactive `user` state
    user.value = {
      id: userData.user.id,
      name: userData.user.user_metadata?.full_name || 'Anonymous',
      avatar_url: userData.user.user_metadata?.avatar_url || '',
    };
  } catch (err) {
    throw err;
  }
};

// Login function
export function loginWithGoogle() {
  window.location.href = `${BACKEND_URL}/auth/google`;
}

// Logout function
export async function logoutUser() {
  await supabase.auth.signOut();
  window.location.href = '/';
}
