import { Context } from 'koa';
import { supabaseAdmin } from '../supabase';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
}

interface GoogleUserInfo {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

// ✅ Google OAuth Login Handler
export async function handleGoogleOAuthLogin(ctx: Context) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    console.error('❌ Missing Google OAuth environment variables');
    ctx.status = 500;
    ctx.body = { error: 'Server misconfiguration: Missing OAuth settings' };
    return;
  }

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

  googleAuthUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
  googleAuthUrl.searchParams.append('redirect_uri', GOOGLE_REDIRECT_URI);
  googleAuthUrl.searchParams.append('response_type', 'code');
  googleAuthUrl.searchParams.append('scope', 'openid email profile');
  googleAuthUrl.searchParams.append('access_type', 'offline');
  googleAuthUrl.searchParams.append('prompt', 'consent');

  console.log('🔗 Redirecting user');
  ctx.redirect(googleAuthUrl.toString());
}

// ✅ Google OAuth Callback Handler
export async function handleGoogleOAuthCallback(ctx: Context) {
  const { code } = ctx.query;

  if (!code) {
    ctx.status = 400;
    ctx.body = { error: 'Missing authorization code' };
    return;
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
        code: code.toString(),
      }),
    });

    if (!tokenResponse.ok) {
      console.error('❌ Failed to exchange auth code for tokens');
      throw new Error('Failed to exchange auth code');
    }

    const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;

    if (!tokenData.id_token) {
      console.error('❌ Missing ID token from Google');
      ctx.status = 500;
      ctx.body = { error: 'Authentication token missing' };
      return;
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signInWithIdToken({
        provider: 'google',
        token: tokenData.id_token,
      });

    if (authError || !authData.session) {
      console.error('❌ Supabase authentication failed:', authError);
      ctx.status = 500;
      ctx.body = { error: 'Authentication failed' };
      return;
    }

    console.log('✅ User successfully authenticated with Supabase');

    // ✅ Fetch user data from Supabase Auth
    const { data: userData, error: userFetchError } =
      await supabaseAdmin.auth.getUser(authData.session.access_token);

    if (userFetchError) {
      console.error('❌ Error fetching user data:', userFetchError);
      ctx.status = 500;
      ctx.body = { error: 'User data fetch failed' };
      return;
    }

    const redirectUrl = new URL(`${FRONTEND_URL}/`);
    redirectUrl.hash = `access_token=${authData.session.access_token}&refresh_token=${authData.session.refresh_token}`;

    console.log('🔗 Redirecting user to frontend');
    ctx.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('❌ Google OAuth process failed:', error);
    ctx.status = 500;
    ctx.body = { error: 'OAuth login failed' };
  }
}
