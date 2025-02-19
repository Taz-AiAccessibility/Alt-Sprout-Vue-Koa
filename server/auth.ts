import { Context, Next } from 'koa';
import { getSupabaseClient, supabaseAdmin } from './supabase';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  exp?: number;
}

const isTokenExpired = (token: string) => {
  const decoded = jwtDecode<DecodedToken>(token);
  return decoded.exp ? Date.now() >= decoded.exp * 1000 : false;
};

// export const isAuthenticated = async (ctx: Context, next: Next) => {
//   const authHeader = ctx.headers.authorization;
//   if (!authHeader) {
//     ctx.status = 401;
//     ctx.body = { error: 'Unauthorized: Missing authentication token' };
//     return;
//   }

//   const token = authHeader.split(' ')[1];

//   if (isTokenExpired(token)) {
//     ctx.status = 401;
//     ctx.body = { error: 'Unauthorized: Token expired' };
//     return;
//   }

//   try {
//     const supabaseClient = getSupabaseClient(token);
//     const { data: userData, error } = await supabaseClient.auth.getUser();

//     if (error || !userData?.user) {
//       ctx.status = 401;
//       ctx.body = { error: 'Unauthorized: Invalid session token' };
//       return;
//     }

//     // Ensure user exists in DB
//     const { data: dbUser, error: dbError } = await supabaseAdmin
//       .from('users')
//       .select('*')
//       .eq('email', userData.user.email)
//       .single();

//     if (dbError) {
//       console.error('❌ Database user lookup error:', dbError);
//       ctx.status = 401;
//       ctx.body = { error: 'Unauthorized: User not found in DB' };
//       return;
//     }

//     ctx.state.user = userData.user;
//     await next();
//   } catch (err) {
//     ctx.status = 401;
//     ctx.body = { error: 'Unauthorized: Authentication failed' };
//   }
// };
export const isAuthenticated = async (ctx: Context, next: Next) => {
  const authHeader = ctx.headers.authorization;
  if (!authHeader) {
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized: Missing authentication token' };
    return;
  }

  const token = authHeader.split(' ')[1];

  if (isTokenExpired(token)) {
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized: Token expired' };
    return;
  }

  try {
    const supabaseClient = getSupabaseClient(token);
    const { data: userData, error } = await supabaseClient.auth.getUser();

    if (error || !userData?.user) {
      ctx.status = 401;
      ctx.body = { error: 'Unauthorized: Invalid session token' };
      return;
    }

    ctx.state.user = userData.user;
    await next();
  } catch (err) {
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized: Authentication failed' };
  }
};
