import { Context, Next } from 'koa';
import { getSupabaseClient } from './supabase';

export const isAuthenticated = async (ctx: Context, next: Next) => {
  const authHeader = ctx.headers.authorization;
  if (!authHeader) {
    console.error('❌ Unauthorized: Missing Authorization header');
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized: Missing authentication token' };
    return;
  }

  const token = authHeader.split(' ')[1]; // Extract Bearer token
  console.log('🔑 Received JWT Token:', token);

  try {
    const supabaseClient = getSupabaseClient(token); // ✅ Ensure the token is used
    const { data: userData, error } = await supabaseClient.auth.getUser(token);

    if (error || !userData?.user) {
      console.error('❌ Authentication failed:', error);
      ctx.status = 401;
      ctx.body = { error: 'Unauthorized: Invalid session token' };
      return;
    }

    console.log('✅ Authenticated User:', userData.user.id);
    ctx.state.user = userData.user; // ✅ Store user in state for routes

    await next();
  } catch (err) {
    console.error('❌ JWT Verification Error:', err);
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized: Authentication failed' };
  }
};
