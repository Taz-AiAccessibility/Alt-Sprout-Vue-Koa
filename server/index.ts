// import Koa, { Context, Next } from 'koa';
// import Router from '@koa/router';
// import cors from '@koa/cors';
// import serve from 'koa-static';
// import path from 'path';
// import fs from 'fs';
// import koaBody from 'koa-body';
// import session from 'koa-session';
// import passport, { User } from './auth';
// import { supabase } from './supabase';

// import { parseUserQuery } from './controllers/userQueryController';
// import { openAiImageProcessing } from './controllers/imageProcessingController';
// import { queryOpenAI } from './controllers/openAiAltTextController';

// import likedDescriptionRoutes from './routes/likedDescriptionRoutes';

// const FRONTEND_URL = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';

// const app = new Koa();
// const router = new Router();

// app.keys = [process.env.SESSION_SECRET!];

// app.use(
//   cors({
//     origin: FRONTEND_URL, // Update this for production
//     credentials: true, // Allows cookies to be sent
//   })
// );

// // Use router middleware
// app.use(router.routes()).use(router.allowedMethods());
// app
//   .use(likedDescriptionRoutes.routes())
//   .use(likedDescriptionRoutes.allowedMethods());

// // Serve frontend build in production
// if (process.env.NODE_ENV === 'production') {
//   const distPath = path.join(__dirname, '../dist');
//   console.log('🚀 Serving frontend from:', distPath);
//   app.use(serve(path.join(__dirname, '../dist')));

//   // Fallback for Vue SPA routes
//   router.get('(.*)', async (ctx) => {
//     const indexPath = path.join(__dirname, '../dist', 'index.html');

//     if (fs.existsSync(indexPath)) {
//       ctx.type = 'html';
//       ctx.body = fs.createReadStream(indexPath);
//     } else {
//       ctx.status = 404;
//       ctx.body = 'Frontend build not found!';
//     }
//   });
// }

// app.use(koaBody());

// app.use(
//   session(
//     {
//       key: 'koa.sess', // Default session key
//       maxAge: 86400000, // 1 day session
//       renew: true, // Auto-renew session
//       rolling: true, // Reset expiration on each request
//     },
//     app
//   )
// );
// // Initialize passport
// app.use(passport.initialize());
// // Use passport session
// app.use(passport.session());

// // Authentication Middleware
// const isAuthenticated = async (ctx: Context, next: Next) => {
//   if (ctx.isAuthenticated()) {
//     return next();
//   } else {
//     ctx.status = 401;
//     ctx.body = { message: 'Unauthorized: Please log in first' };
//   }
// };

// // Google OAuth Login Route (No Authentication Required)
// router.get(
//   '/auth/google',
//   passport.authenticate('google', { scope: ['profile', 'email'] })
// );

// router.get('/auth/google/callback', async (ctx: Context, next) => {
//   return passport.authenticate(
//     'google',
//     async (err: any, user: User, info: any) => {
//       if (err || !user) {
//         ctx.redirect(FRONTEND_URL);
//         return;
//       }
//       await ctx.login(user);
//       ctx.redirect(
//         `${FRONTEND_URL}?user=${encodeURIComponent(JSON.stringify(user))}`
//       );
//     }
//   )(ctx, next);
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
//       secure: process.env.NODE_ENV === 'production', // Ensures HTTPS in production
//       sameSite: 'lax', // Protects against CSRF
//       maxAge: 60 * 60 * 1000, // 1 hour expiration
//     });

//     ctx.body = { user }; // Return only user info (No token)
//   } else {
//     console.log('❌ No user session found.');
//     ctx.cookies.set('supabase_token', '', { maxAge: 0 }); // Clear token
//     ctx.body = { user: null };
//   }
// });

// router.get('/logout', async (ctx) => {
//   if (ctx.isAuthenticated()) {
//     ctx.logout();
//     ctx.session = {}; // Clears session
//     ctx.cookies.set('supabase_token', '', { maxAge: 0 }); // 🔒 Clears the HTTP-only cookie
//     ctx.body = { message: 'Logged out successfully' };
//     console.log('✅ User logged out successfully');
//   } else {
//     ctx.body = { message: 'No active session' };
//   }
// });

// // Protected API Route (Requires Authentication)
// router.post(
//   '/alt-text',
//   isAuthenticated, // Ensure user is logged in before processing request
//   parseUserQuery,
//   openAiImageProcessing,
//   queryOpenAI,
//   async (ctx: Context) => {
//     ctx.status = 200;
//     ctx.body = ctx.state.analysisResult;
//     console.log('✅ Context Body:', ctx.body);
//   }
// );

// // // Use router middleware
// // app.use(router.routes()).use(router.allowedMethods());
// // app
// //   .use(likedDescriptionRoutes.routes())
// //   .use(likedDescriptionRoutes.allowedMethods());

// // Start server
// // might need to change env variable to just PORT for build
// const PORT = process.env.PORT || 3000; // Render dynamically assigns a port
// app.listen(PORT, () => {
//   console.log(`🚀 Koa server running on http://localhost:${PORT}`);
// });

import Koa, { Context, Next } from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import serve from 'koa-static';
import path from 'path';
import fs from 'fs';
import koaBody from 'koa-body';
import session from 'koa-session';
import passport, { User } from './auth';
import { supabase } from './supabase';

import { parseUserQuery } from './controllers/userQueryController';
import { openAiImageProcessing } from './controllers/imageProcessingController';
import { queryOpenAI } from './controllers/openAiAltTextController';

import likedDescriptionRoutes from './routes/likedDescriptionRoutes';

const FRONTEND_URL = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';
const app = new Koa();
const router = new Router();

// Enable CORS for frontend
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

app.use(koaBody());

// 🔑 **SESSION & AUTH SETUP**
app.use(
  session(
    {
      key: 'koa.sess',
      maxAge: 86400000, // 1 day session
      renew: true,
      rolling: true,
    },
    app
  )
);
app.use(passport.initialize());
app.use(passport.session());

// **Authentication Middleware**
const isAuthenticated = async (ctx: Context, next: Next) => {
  if (ctx.isAuthenticated()) {
    return next();
  } else {
    ctx.status = 401;
    ctx.body = { message: 'Unauthorized: Please log in first' };
  }
};

// ✅ **AUTH ROUTES**
router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback', async (ctx: Context, next) => {
  return passport.authenticate('google', async (err: any, user: User) => {
    if (err || !user) {
      ctx.redirect(FRONTEND_URL);
      return;
    }
    await ctx.login(user);
    ctx.redirect(
      `${FRONTEND_URL}?user=${encodeURIComponent(JSON.stringify(user))}`
    );
  })(ctx, next);
});

// ✅ **USER SESSION CHECK**
router.get('/user-session', async (ctx) => {
  console.log('🔍 Checking session for user...');

  if (ctx.isAuthenticated() && ctx.state.user) {
    console.log('✅ User in session:', ctx.state.user);

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error || !session) {
      ctx.cookies.set('supabase_token', '', { maxAge: 0 }); // Clear token
      ctx.body = { user: null };
      return;
    }

    console.log('✅ SESSION TOKEN:', session.access_token);

    const user = {
      id: ctx.state.user.id,
      name: ctx.state.user.name,
      avatar_url: ctx.state.user.avatar_url,
    };

    // 🔒 Store token in HTTP-Only cookie
    ctx.cookies.set('supabase_token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour expiration
    });

    ctx.body = { user };
  } else {
    console.log('❌ No user session found.');
    ctx.cookies.set('supabase_token', '', { maxAge: 0 });
    ctx.body = { user: null };
  }
});

// ✅ **LOGOUT ROUTE**
router.get('/logout', async (ctx) => {
  if (ctx.isAuthenticated()) {
    ctx.logout();
    ctx.session = {}; // Clear session
    ctx.cookies.set('supabase_token', '', { maxAge: 0 });
    ctx.body = { message: 'Logged out successfully' };
    console.log('✅ User logged out successfully');
  } else {
    ctx.body = { message: 'No active session' };
  }
});

// ✅ **ALT TEXT PROCESSING (Protected)**
router.post(
  '/alt-text',
  isAuthenticated,
  parseUserQuery,
  openAiImageProcessing,
  queryOpenAI,
  async (ctx: Context) => {
    ctx.status = 200;
    ctx.body = ctx.state.analysisResult;
    console.log('✅ Context Body:', ctx.body);
  }
);

// ✅ **LIKED DESCRIPTIONS ROUTES**
app
  .use(likedDescriptionRoutes.routes())
  .use(likedDescriptionRoutes.allowedMethods());

// ✅ **SERVE FRONTEND BUILD**
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  console.log('🚀 Serving frontend from:', distPath);
  app.use(serve(distPath));

  // Handle Vue SPA routes
  app.use(async (ctx, next) => {
    if (ctx.path.startsWith('/api') || ctx.path.startsWith('/auth')) {
      return next(); // API requests should not load frontend
    }

    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      ctx.type = 'html';
      ctx.body = fs.createReadStream(indexPath);
    } else {
      ctx.status = 404;
      ctx.body = 'Frontend build not found!';
    }
  });
}

// **Start the server**
const PORT = process.env.PORT || 10000; // Render assigns a port dynamically
app.listen(PORT, () => {
  console.log(`🚀 Koa server running on port ${PORT}`);
});
