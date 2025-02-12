import Koa, { Context, Next } from 'koa';
import Router from '@koa/router';
import cors, { Options as CorsOptions } from '@koa/cors';
import koaBody from 'koa-body';
import session, { SessionOptions } from 'koa-session';
import passport, { User } from './auth';
import { supabase } from './supabase';

import { parseUserQuery } from './controllers/userQueryController';
import { openAiImageProcessing } from './controllers/imageProcessingController';
import { queryOpenAI } from './controllers/openAiAltTextController';

import likedDescriptionRoutes from './routes/likedDescriptionRoutes';

const FRONTEND_URL = process.env.VITE_FRONTEND_URL || 'https://altsprout.dance';

console.log('🔍 FRONTEND_URL:', FRONTEND_URL);
const app = new Koa();
const router = new Router();

app.keys = [process.env.SESSION_SECRET!];
app.proxy = true;

app.use(async (ctx, next) => {
  if (ctx.headers['x-forwarded-proto'] !== 'https') {
    ctx.set('X-Forwarded-Proto', 'https');
  }
  await next();
});

app.use(async (ctx, next) => {
  console.log('🔍 Incoming Request:', ctx.method, ctx.url);
  console.log('🍪 Cookies Received:', ctx.cookies.get('koa.sess'));
  await next();
});

// app.use(
//   cors({
//     origin: [FRONTEND_URL, 'https://api.altsprout.dance'], // Update this for production
//     credentials: true, // Allows cookies to be sent
//     allowMethods: ['GET', 'POST', 'OPTIONS'],
//     allowHeaders: ['Content-Type', 'Authorization'],
//     exposeHeaders: ['set-cookie'], // NEW: Allows frontend to receive cookies
//   })
// );
const allowedOrigins = new Set([
  'https://altsprout.dance',
  'https://api.altsprout.dance',
]);

const corsOptions: CorsOptions = {
  origin: (ctx) =>
    allowedOrigins.has(ctx.request.origin) ? ctx.request.origin : '',
  credentials: true, // Allows cookies to be sent
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['set-cookie'], // NEW: Allows frontend to receive cookies
};

app.use(cors(corsOptions));

app.use(koaBody());

// app.use(async (ctx, next) => {
//   if (ctx.headers['x-forwarded-proto'] !== 'https') {
//     ctx.redirect(`https://${ctx.hostname}${ctx.url}`);
//   } else {
//     await next();
//   }
// });

// app.use(
//   session(
//     {
//       key: 'koa.sess', // Default session key
//       maxAge: 86400000, // 1 day session
//       renew: true, // Auto-renew session
//       rolling: true, // Reset expiration on each request
//       sameSite: 'None', // Prevents CSRF issues
//       secure:
//         process.env.NODE_ENV === 'production' && process.env.RENDER !== 'true',

//       httpOnly: true, // Prevents JS access to cookie
//     },
//     app
//   )
// );

// app.use(
//   session(
//     {
//       key: 'koa.sess', // Default session key
//       maxAge: 86400000, // 1 day session
//       renew: true, // Auto-renew session
//       rolling: true, // Reset expiration on each request
//       sameSite: 'None', // Allows cross-origin cookies
//       secure: true, // Must be true for HTTPS
//       httpOnly: true, // Prevents JavaScript access
//       domain: '.altsprout.dance', // Allows sharing across subdomains
//     },
//     app
//   )
// );

// Configure session options
const sessionConfig: Partial<SessionOptions> = {
  key: 'koa.sess', // Default session key
  maxAge: 86400000, // 1 day session
  renew: true, // Auto-renew session
  rolling: true, // Reset expiration on each request
  sameSite: 'none' as const, // Ensure cross-origin cookie compatibility
  secure: false, // Adjust based on Render proxy, will need to adjust for local development!
  httpOnly: true, // Prevents JavaScript access
  // domain: '.altsprout.dance', // Allows sharing across subdomains
  beforeSave: (ctx, session) => {
    console.log('🔹 Before Save:', session);
  },
};

// Attach session to Koa app
app.use(session(sessionConfig, app));
// Initialize passport
app.use(passport.initialize());
// Use passport session
app.use(passport.session());

// Authentication Middleware
const isAuthenticated = async (ctx: Context, next: Next) => {
  if (ctx.isAuthenticated()) {
    return next();
  } else {
    ctx.status = 401;
    ctx.body = { message: 'Unauthorized: Please log in first' };
  }
};

// Google OAuth Login Route (No Authentication Required)
router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback', async (ctx: Context, next) => {
  return passport.authenticate(
    'google',
    async (err: any, user: User, info: any) => {
      if (err || !user) {
        ctx.redirect(FRONTEND_URL);
        return;
      }
      await ctx.login(user);
      ctx.redirect(
        `${FRONTEND_URL}?user=${encodeURIComponent(JSON.stringify(user))}`
      );
    }
  )(ctx, next);
});

router.get('/user-session', async (ctx) => {
  console.log('🔍 Checking session for user...');
  console.log('📝 Current Session:', ctx.session);

  if (ctx.isAuthenticated() && ctx.state.user) {
    console.log('✅ User in session:', ctx.state.user);

    // Fetch Supabase session
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    console.log('🟢 Supabase Session:', session);
    console.log('🔴 Supabase Error:', error);

    if (error || !session) {
      console.log('⚠️ No valid Supabase session found, clearing cookie.');
      ctx.cookies.set('supabase_token', '', { maxAge: 0 }); // Clear cookie
      ctx.body = { user: null };
      return;
    }

    console.log('✅ SESSION TOKEN:', session.access_token);

    // Set cookie
    ctx.cookies.set('supabase_token', session.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 1000, // 1 hour expiration
      path: '/',
    });

    ctx.body = { user: ctx.state.user };
  } else {
    console.log('❌ No user session found.');
    ctx.cookies.set('supabase_token', '', { maxAge: 0 }); // Clear token
    ctx.body = { user: null };
  }
});

// router.get('/user-session', async (ctx) => {
//   console.log('🔍 Checking session for user...');

//   if (ctx.isAuthenticated() && ctx.state.user) {
//     console.log('✅ User in session:', ctx.state.user);

//     const { data, error } = await supabase.auth.getSession();
//     const session = data?.session;

//     if (error || !session) {
//       console.error('❌ No valid session token found:', error);
//       ctx.cookies.set('supabase_token', '', { maxAge: 0 });
//       ctx.body = { user: null };
//       return;
//     }

//     console.log('✅ SESSION TOKEN:', session.access_token);

//     ctx.cookies.set('supabase_token', session.access_token, {
//       httpOnly: true,
//       secure: false, // Adjust for Render proxy
//       sameSite: 'none',
//       maxAge: 60 * 60 * 1000, // 1 hour expiration
//     });

//     console.log('🔥 COOKIES SET:', ctx.cookies.get('supabase_token')); // Log the cookie value

//     ctx.body = { user: ctx.state.user };
//   } else {
//     console.log('❌ No user session found.');
//     ctx.cookies.set('supabase_token', '', { maxAge: 0 });
//     ctx.body = { user: null };
//   }
// });

// router.get('/user-session', async (ctx) => {
//   console.log('🔍 Checking session for user...');

//   if (ctx.isAuthenticated() && ctx.state.user) {
//     console.log('✅ User in session:', ctx.state.user);

//     // Fetch Supabase session token
//     const {
//       data: { session },
//       error,
//     } = await supabase.auth.getSession();

//     if (error || !session) {
//       ctx.cookies.set('supabase_token', '', { maxAge: 0 }); // Clear token
//       ctx.body = { user: null };
//       return;
//     }

//     console.log('✅  SESSION TOKEN:', session.access_token);

//     const user = {
//       id: ctx.state.user.id,
//       name: ctx.state.user.name,
//       avatar_url: ctx.state.user.avatar_url,
//     };

//     // 🔒 Securely store the token in HTTP-Only cookie
//     ctx.cookies.set('supabase_token', session.access_token, {
//       httpOnly: true, // Prevents JavaScript access
//       secure: false, // Adjust based on Render proxy, will need to adjust for local development!
//       sameSite: 'none', // Protects against CSRF
//       maxAge: 60 * 60 * 1000, // 1 hour expiration
//     });

//     ctx.body = { user }; // Return only user info (No token)
//   } else {
//     console.log('❌ No user session found.');
//     ctx.cookies.set('supabase_token', '', { maxAge: 0 }); // Clear token
//     ctx.body = { user: null };
//   }
// });

router.get('/user-session', async (ctx) => {
  console.log('🔍 Checking session for user...');

  if (ctx.isAuthenticated() && ctx.state.user) {
    console.log('✅ User in session:', ctx.state.user);

    // Ensure we return the access token
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      ctx.body = { user: null, token: null };
      return;
    }

    console.log('✅  SESSION TOKEN:', session?.access_token);

    const user = {
      id: ctx.state.user.id,
      name: ctx.state.user.name,
      avatar_url: ctx.state.user.avatar_url,
    };

    ctx.body = {
      user: user,
      token: session.access_token,
    };
  } else {
    console.log('❌ No user session found.');
    ctx.body = { user: null, token: null };
  }
});

router.get('/logout', async (ctx) => {
  if (ctx.isAuthenticated()) {
    ctx.logout();
    ctx.session = {}; // Clears session
    ctx.cookies.set('supabase_token', '', { maxAge: 0 }); // 🔒 Clears the HTTP-only cookie
    ctx.body = { message: 'Logged out successfully' };
    console.log('✅ User logged out successfully');
  } else {
    ctx.body = { message: 'No active session' };
  }
});

// Protected API Route (Requires Authentication)
router.post(
  '/alt-text',
  isAuthenticated, // Ensure user is logged in before processing request
  parseUserQuery,
  openAiImageProcessing,
  queryOpenAI,
  async (ctx: Context) => {
    ctx.status = 200;
    ctx.body = ctx.state.analysisResult;
    console.log('✅ Context Body:', ctx.body);
  }
);

// Use router middleware
app.use(router.routes()).use(router.allowedMethods());
app
  .use(likedDescriptionRoutes.routes())
  .use(likedDescriptionRoutes.allowedMethods());

// Start server
const PORT = process.env.PORT || 3000; // Render dynamically assigns a port
app.listen(PORT, () => {
  console.log(`🚀 Koa server running on http://localhost:${PORT}`);
});
