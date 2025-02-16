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
    ctx.body = { error: 'Server misconfiguration' };
    return;
  }

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
  googleAuthUrl.searchParams.append('redirect_uri', GOOGLE_REDIRECT_URI);
  googleAuthUrl.searchParams.append('response_type', 'code');
  googleAuthUrl.searchParams.append('scope', 'openid email profile');
  googleAuthUrl.searchParams.append('access_type', 'offline');
  googleAuthUrl.searchParams.append('prompt', 'consent');

  console.log('🔗 Redirecting user to Google OAuth');
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
    // ✅ Exchange authorization code for tokens
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

    // ✅ Fetch user details from Google
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    if (!userInfoResponse.ok) {
      console.error('❌ Failed to fetch user info');
      throw new Error('Failed to fetch user info');
    }

    const userInfo = (await userInfoResponse.json()) as GoogleUserInfo;

    // ✅ Check if user exists in Supabase DB
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', userInfo.email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Database error while checking user');
      ctx.status = 500;
      ctx.body = { error: 'Database error' };
      return;
    }

    if (!existingUser) {
      console.log('🆕 New user detected, creating record...');
      const { error: insertError } = await supabaseAdmin.from('users').insert([
        {
          email: userInfo.email,
          google_id: userInfo.sub,
          name: userInfo.name,
          avatar_url: userInfo.picture || '',
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertError) {
        console.error('❌ Error inserting new user');
        ctx.status = 500;
        ctx.body = { error: 'User creation failed' };
        return;
      }
    }

    // ✅ Authenticate user with Supabase
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signInWithIdToken({
        provider: 'google',
        token: tokenData.id_token,
      });

    if (authError || !authData.session) {
      console.error('❌ Supabase authentication failed');
      ctx.status = 500;
      ctx.body = { error: 'Authentication failed' };
      return;
    }

    console.log('✅ User successfully authenticated');

    if (!FRONTEND_URL || FRONTEND_URL === 'undefined') {
      console.error('❌ Invalid FRONTEND_URL setting');
      ctx.status = 500;
      ctx.body = { error: 'Server misconfiguration' };
      return;
    }

    const redirectUrl = new URL(`${FRONTEND_URL}/`);
    redirectUrl.hash = `access_token=${authData.session.access_token}&refresh_token=${authData.session.refresh_token}`;

    console.log('🔗 Redirecting user to frontend');
    ctx.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('❌ Google OAuth process failed');
    ctx.status = 500;
    ctx.body = { error: 'OAuth login failed' };
  }
}
