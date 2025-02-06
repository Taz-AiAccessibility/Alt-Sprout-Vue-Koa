import Koa, { Context, Next } from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import koaBody from 'koa-body';
import session from 'koa-session';
import passport, { User } from './auth';
import { supabase } from './supabase';

import { parseUserQuery } from './controllers/userQueryController';
import { openAiImageProcessing } from './controllers/imageProcessingController';
import { queryOpenAI } from './controllers/openAiAltTextController';

import likedDescriptionRoutes from './routes/likedDescriptionRoutes';

const app = new Koa();
const router = new Router();

app.keys = [process.env.SESSION_SECRET!];

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(koaBody());

app.use(
  session(
    {
      key: 'koa.sess', // Default session key
      maxAge: 86400000, // 1 day session
      renew: true, // Auto-renew session
      rolling: true, // Reset expiration on each request
    },
    app
  )
);
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
        ctx.redirect('http://localhost:5173');
        return;
      }
      await ctx.login(user);
      ctx.redirect(
        `http://localhost:5173?user=${encodeURIComponent(JSON.stringify(user))}`
      );
    }
  )(ctx, next);
});

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

// Logout Route
router.get('/logout', async (ctx) => {
  if (ctx.isAuthenticated()) {
    ctx.logout();
    ctx.session = {}; // Properly clears session without breaking it
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
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Koa server running on http://localhost:${PORT}`);
});
