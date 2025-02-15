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
  console.log('🔑 Received JWT Token');

  try {
    const supabaseClient = getSupabaseClient(token);
    const { data: userData, error } = await supabaseClient.auth.getUser();

    if (error || !userData?.user) {
      console.error('❌ Authentication failed:', error);
      ctx.status = 401;
      ctx.body = { error: 'Unauthorized: Invalid session token' };
      return;
    }

    const { id, email, identities, user_metadata } = userData.user;

    // Extract Google ID from identities array
    const googleId = identities?.find(
      (identity) => identity.provider === 'google'
    )?.id;

    if (!googleId) {
      console.error('❌ Google ID not found for user:', id);
      ctx.status = 401;
      ctx.body = { error: 'Unauthorized: No valid Google ID found' };
      return;
    }

    // ✅ Check if the user exists in the `users` table
    const { data: existingUser, error: userFetchError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('google_id', googleId)
      .single();

    if (userFetchError && userFetchError.code !== 'PGRST116') {
      console.error('❌ Error checking user in DB:', userFetchError);
      ctx.status = 500;
      ctx.body = { error: 'Internal Server Error' };
      return;
    }

    if (!existingUser) {
      console.log('🆕 User not found, inserting into DB...');

      const { error: insertError } = await supabaseClient.from('users').insert([
        {
          id, // Supabase Auth User ID
          google_id: googleId, // ✅ Store the actual Google OAuth ID
          email,
          name: user_metadata?.full_name || '',
          avatar_url: user_metadata?.avatar_url || '',
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertError) {
        console.error('❌ Error inserting user:', insertError);
        ctx.status = 500;
        ctx.body = { error: 'Error creating user' };
        return;
      }

      console.log('✅ New user inserted successfully:', id);
    }

    ctx.state.user = userData.user; // ✅ Store user in state for routes
    await next();
  } catch (err) {
    console.error('❌ JWT Verification Error:', err);
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized: Authentication failed' };
  }
};
