import Koa, { Context } from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import koaBody from 'koa-body';
import session from 'koa-session'; // ✅ Import koa-session for session management
import passport, { User } from './auth'; // ✅ Import configured passport

import { parseUserQuery } from './controllers/userQueryController';
import { openAiImageProcessing } from './controllers/imageProcessingController';
import { queryOpenAI } from './controllers/openAiAltTextController';

const app = new Koa();
const router = new Router();

app.keys = [process.env.SESSION_SECRET!]; // Use your session secret

// ✅ Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // Adjust for your frontend
app.use(koaBody());
// app.use(session({ signed: false }, app)); // Initialize session
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
app.use(passport.initialize()); // Initialize passport
app.use(passport.session()); // Use passport session

// router.get('/', async (ctx) => {
//   ctx.body = { message: 'Koa server is running!' };
// });

// ✅ Google OAuth Login Route
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
  console.log('Session Data:', ctx.session);
  console.log('Authenticated:', ctx.isAuthenticated());

  if (ctx.isAuthenticated()) {
    console.log('✅ User in session:', ctx.state.user);
    ctx.body = { user: ctx.state.user };
  } else {
    console.log('❌ No user session found.');
    ctx.body = { user: null };
  }
});

// ✅ Logout Route
router.get('/logout', async (ctx) => {
  router.get('/logout', async (ctx) => {
    if (ctx.isAuthenticated()) {
      ctx.logout();
      ctx.session = {}; // ✅ Properly clears session without breaking it
      ctx.body = { message: 'Logged out successfully' };
    } else {
      ctx.body = { message: 'No active session' };
    }
  });
});

// Define API route
router.post(
  '/alt-text',
  parseUserQuery,
  openAiImageProcessing,
  queryOpenAI,
  async (ctx: Context) => {
    ctx.status = 200;
    ctx.body = ctx.state.analysisResult;
    console.log(ctx.body);
  }
);

// Use router middleware
app.use(router.routes()).use(router.allowedMethods());

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Koa server running on http://localhost:${PORT}`);
});
