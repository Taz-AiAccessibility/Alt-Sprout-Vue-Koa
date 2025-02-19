import { supabase } from './utils/supabase';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Extract token from URL and store in Supabase session
export async function handleOAuthRedirect(user: any) {
  const url = new URL(window.location.href);
  const accessToken = url.hash.match(/access_token=([^&]+)/)?.[1];
  const refreshToken = url.hash.match(/refresh_token=([^&]+)/)?.[1];

  console.log('🔍 OAuth Redirect:', { accessToken, refreshToken });

  if (!accessToken || !refreshToken) {
    console.warn('⚠️ No OAuth tokens found in URL.');
    return;
  }

  try {
    // ✅ Set session manually
    const { data, error } = await supabase.auth.setSession(
      {
        access_token: accessToken,
        refresh_token: refreshToken,
      }
      // true //  Force persistence - does not work!
    );

    if (error) {
      console.error('❌ Error setting session:', error);
      return;
    }

    console.log('✅ Supabase session set:', data);

    // ✅ Verify session immediately
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError || !sessionData?.session) {
      console.error('❌ Session not found after setting:', sessionError);
      return;
    }

    console.log('✅ Verified session:', sessionData);

    // ✅ Fetch user details after ensuring session exists
    await checkSupabaseSession(user);

    // ✅ Remove tokens from the URL after storing them
    window.history.replaceState({}, document.title, window.location.pathname);
  } catch (err) {
    console.error('❌ Error in OAuth redirect handling:', err);
  }
}

// Check if user is authenticated
export const checkSupabaseSession = async (user: any) => {
  console.log('🔍 Checking Supabase session...');

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError || !sessionData?.session) {
    console.warn('⚠️ No active session found.');
    return;
  }

  console.log('✅ Session found:', sessionData);

  // ✅ Fetch user details separately
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    console.error('❌ Failed to fetch user:', userError);
    return;
  }

  console.log('✅ User data fetched:', userData.user);

  // ✅ Update Vue's reactive `user` state
  user.value = {
    id: userData.user.id,
    name: userData.user.user_metadata?.full_name || 'Anonymous',
    avatar_url: userData.user.user_metadata?.avatar_url || '',
  };

  console.log('✅ User state updated:', user.value);
};

// Login function
export function loginWithGoogle() {
  window.location.href = `${BACKEND_URL}/auth/google`;
}

// Logout function
export async function logoutUser() {
  console.log('🔍 Logging out user...');

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('❌ Logout failed:', error);
  } else {
    console.log('✅ Logout successful. Session cleared.');
  }

  window.location.href = '/';
}
