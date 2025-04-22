import Koa, { Context } from 'koa';
import Router from '@koa/router';
import path from 'path';
import helmet from 'koa-helmet';
import cors from '@koa/cors';
import serve from 'koa-static';
import jwt from 'koa-jwt';
import bodyparser from '@koa/bodyparser';
import rateLimit from 'koa-ratelimit';
import likedDescriptionRoutes from './routes/likedDescriptionRoutes';
import { isAuthenticated } from './auth';
import { parseUserQuery } from './controllers/userQueryController';
import { openAiImageProcessing } from './controllers/imageProcessingController';
import { queryOpenAI } from './controllers/openAiAltTextController';
import {
  handleGoogleOAuthLogin,
  handleGoogleOAuthCallback,
} from './controllers/googleOAuthController';

interface CustomError extends Error {
  status?: number;
}

const app = new Koa();
app.proxy = true; // Trust proxy headers from Render.com
const router = new Router();

if (!process.env.SUPABASE_JWT_SECRET) {
  throw new Error('❌ Missing SUPABASE_JWT_SECRET. Server cannot start.');
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PORT = process.env.PORT || 3000;

// Define allowed origins for CORS
const allowedOrigins = [
  FRONTEND_URL,
  'https://altsprout.dance',
  'https://www.altsprout.dance',
  // Add more trusted domains as needed
];

//global error handling
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error: unknown) {
    // Ensure we have an Error object
    const err: Error =
      error instanceof Error ? error : new Error('Unknown error');
    // Cast error to CustomError so we can access status if it exists
    const customError = error as CustomError;
    const status = customError.status || 500;

    // Add security headers even for error responses
    // I believe we can remove setting the header
    // This is a proxy server and Render.com handles the header settings
    /** 
    - /* - Content-Security-Policy -  default-src 'self';  script-src 'self' https://apis.google.com;  style-src 'self' https://fonts.googleapis.com;  img-src 'self' data: blob: https:;  connect-src 'self' https://afziltusqfvlckjbgkil.supabase.co https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://api.openai.com https://api.altsprout.dance;  font-src 'self' https://fonts.gstatic.com;  object-src 'none';  frame-ancestors 'none';  base-uri 'self';  form-action 'self';  upgrade-insecure-requests
    - /* - Strict-Transport-Security - max-age=31536000; includeSubDomains; preload
    - /* - Cache-Control - Cache-Control: no-cache, no-store, must-revalidate, private Pragma: no-cache Expires: 0
    **/
    // Removing this as Render.com already sets CSP headers
    // ctx.set(
    //   'Content-Security-Policy',
    //   "default-src 'self'; script-src 'self' https://apis.google.com; style-src 'self'; img-src 'self' data: https:; connect-src 'self'; font-src 'self' https: data:; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests"
    // );

    ctx.status = status;

    // Only expose detailed error message in development
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      // Generic error message in production
      const publicError = {
        error:
          status === 400
            ? 'Bad Request'
            : status === 401
            ? 'Unauthorized'
            : status === 403
            ? 'Forbidden'
            : status === 404
            ? 'Not Found'
            : 'Internal Server Error',
        requestId: ctx.request.headers['x-request-id'] || Date.now().toString(),
      };
      ctx.body = publicError;

      // Still log the detailed error on the server
      console.error('Error:', {
        status,
        message: err.message,
        stack: err.stack,
        requestId: publicError.requestId,
        path: ctx.path,
        method: ctx.method,
        query: ctx.query,
        ip: ctx.ip,
      });
    } else {
      // Detailed error in development
      ctx.body = {
        error: err.message,
        stack: err.stack,
        status,
      };
    }

    ctx.app.emit('error', err, ctx);
  }
});

// Set various security headers
app.use(helmet());

// Set CSP with frame-ancestors
// Comment out helmet CSP since Render.com already handles this
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'", 'https://apis.google.com'], //"'unsafe-inline'"
//       styleSrc: ["'self'"], //"'unsafe-inline'"
//       imgSrc: ["'self'", 'data:', 'https:'],
//       connectSrc: ["'self'"],
//       fontSrc: ["'self'", 'https:', 'data:'],
//       objectSrc: ["'none'"],
//       frameAncestors: ["'none'"], // Prevents your site from being framed
//       // Optionally, if you need to allow framing from specific origins, list them here.
//       // e.g., frameAncestors: ["'self'", "https://trusted.com"],
//       upgradeInsecureRequests: [],
//     },
//   })
// );

// Over kill, and may conflict with frameAncestors if we want to used specified iframe approval
app.use(helmet.frameguard({ action: 'deny' }));

// CORS Setup with multiple origin support
app.use(
  cors({
    origin: (ctx) => {
      const requestOrigin = ctx.headers.origin;
      if (!requestOrigin) return '';

      return allowedOrigins.includes(requestOrigin) ? requestOrigin : '';
    },
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Authorization'],
  })
);

// Add size limits to bodyparser to prevent large payload attacks
app.use(
  bodyparser({
    jsonLimit: '1mb',
    formLimit: '1mb',
    textLimit: '1mb',
  })
);

// Add rate limiting to protect against API abuse
const db = new Map(); // In-memory store for rate limiting
app.use(
  rateLimit({
    driver: 'memory',
    db: db,
    duration: 60000, // 1 minute
    max: 10, // limit each IP to 10 requests per minute
    errorMessage: 'Too many requests, please try again later.',
    id: (ctx) => ctx.ip, // Use IP address for rate limiting
    headers: {
      remaining: 'Rate-Limit-Remaining',
      reset: 'Rate-Limit-Reset',
      total: 'Rate-Limit-Total',
    },
    disableHeader: false,
  })
);

// Handle static privacy-policy and terms-of-service pages
app.use(serve(path.join(__dirname, 'public')));

// Define JWT token interface
interface JwtToken {
  exp?: number;
  [key: string]: any;
}

// Middleware to Verify JWT
app.use(
  jwt({
    secret: process.env.SUPABASE_JWT_SECRET!,
    algorithms: ['HS256'],
    isRevoked: async (ctx, decodedToken: JwtToken) => {
      // Check if token has expired
      const now = Math.floor(Date.now() / 1000);
      if (decodedToken && decodedToken.exp && decodedToken.exp < now) {
        console.log('Token has expired');
        return true; // Token is revoked (expired)
      }

      // You could also implement a blacklist check using Redis or another store
      // e.g., const isBlacklisted = await checkBlacklist(decodedToken.jti);
      // return isBlacklisted;

      return false; // Token is valid
    },
  }).unless({
    path: [
      /^\/auth\/google/,
      /^\/auth\/google\/callback/,
      /^\/privacy-policy/,
      /^\/terms-of-service/,
      /^\/health/,
    ],
  })
);

// Process Alt Text Request
router.post(
  '/alt-text',
  isAuthenticated,
  parseUserQuery,
  openAiImageProcessing,
  queryOpenAI,
  async (ctx: Context) => {
    ctx.status = 200;
    ctx.body = ctx.state.analysisResult;
  }
);

// OAuth Routes
router.get('/auth/google', handleGoogleOAuthLogin);
router.get('/auth/google/callback', handleGoogleOAuthCallback);
router
  .use(likedDescriptionRoutes.routes())
  .use(likedDescriptionRoutes.allowedMethods());

// Ensure health check endpoint is properly defined
router.get('/health', (ctx) => {
  ctx.status = 200;
  ctx.body = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  };
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
