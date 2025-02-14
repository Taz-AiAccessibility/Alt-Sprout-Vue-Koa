// // import { Context, Next } from 'koa';
// // import { supabase } from './supabase';

// // const isAuthenticated = async (ctx: Context, next: Next) => {
// //   console.log(
// //     '📌 Received Authorization Header:',
// //     ctx.request.headers.authorization
// //   );

// //   try {
// //     console.log('🔍 Incoming request headers:', ctx.request.headers);
// //     const authHeader = ctx.request.headers.authorization;
// //     if (!authHeader) {
// //       console.error('❌ Unauthorized: Missing Authorization header');
// //       ctx.status = 401;
// //       ctx.body = { message: 'Unauthorized: Missing Authorization header' };
// //       return;
// //     }

// //     const token = authHeader.split(' ')[1]; // Extract token after "Bearer"
// //     console.log('🔍 Received Token:', token);

// //     // ✅ Verify the JWT with Supabase
// //     const { data, error } = await supabase.auth.getUser(token);

// //     console.log('🔍 JWT Token Received:', authHeader);
// //     console.log('🔍 User Data from Supabase:', data);

// //     if (error || !data.user) {
// //       console.error('❌ Supabase Authentication Failed:', error);
// //       ctx.status = 401;
// //       ctx.body = { message: 'Unauthorized: Invalid or expired token' };
// //       return;
// //     }

// //     console.log('✅ Authenticated user:', data.user);

// //     // Attach user to context for future use
// //     ctx.state.user = data.user;
// //     await next();
// //   } catch (err) {
// //     console.error('❌ Authentication Error:', err);
// //     ctx.status = 500;
// //     ctx.body = { message: 'Internal Server Error' };
// //   }
// // };

// // export { isAuthenticated };

// import { Context, Next } from 'koa';
// import { createClient } from '@supabase/supabase-js';
// import { getSupabaseClient } from './supabase';
// import dotenv from 'dotenv';
// import jwt from 'jsonwebtoken';
// dotenv.config(); // ✅ Ensure environment variables are loaded

// const supabase = createClient(
//   process.env.SUPABASE_URL!,
//   process.env.SUPABASE_ANON_KEY!
// );

// export const isAuthenticated = async (ctx: Context, next: Next) => {
//   const authHeader = ctx.headers.authorization;
//   if (!authHeader) {
//     console.error('❌ Unauthorized: Missing authorization header');
//     ctx.status = 401;
//     ctx.body = { error: 'Unauthorized: Missing authentication token' };
//     return;
//   }

//   const token = authHeader.split(' ')[1]; // Extract Bearer token
//   console.log('🔑 Extracted JWT Token:', token);

//   try {
//     const supabase = getSupabaseClient(token); // ✅ Use the user’s token
//     const {
//       data: { user },
//       error,
//     } = await supabase.auth.getUser(token);

//     if (error || !user) {
//       console.error('❌ Authentication failed:', error);
//       ctx.status = 401;
//       ctx.body = { error: 'Unauthorized: Invalid session token' };
//       return;
//     }

//     console.log('✅ Authenticated User:', user.id);
//     ctx.state.user = user;
//     ctx.state.supabase = supabase; // ✅ Attach Supabase client to request
//     await next();
//   } catch (err) {
//     console.error('❌ JWT Verification Error:', err);
//     ctx.status = 401;
//     ctx.body = { error: 'Unauthorized: Authentication failed' };
//   }
// };

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
