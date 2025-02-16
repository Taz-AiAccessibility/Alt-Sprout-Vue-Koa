import Koa, { Context } from 'koa';
import Router from '@koa/router';
import path from 'path';
import fs from 'fs';
import cors from '@koa/cors';
import serve from 'koa-static';
import jwt from 'koa-jwt';
import bodyparser from '@koa/bodyparser';
import likedDescriptionRoutes from './routes/likedDescriptionRoutes';
import { isAuthenticated } from './auth';
import { parseUserQuery } from './controllers/userQueryController';
import { openAiImageProcessing } from './controllers/imageProcessingController';
import { queryOpenAI } from './controllers/openAiAltTextController';
import {
  handleGoogleOAuthLogin,
  handleGoogleOAuthCallback,
} from './controllers/googleOAuthController';

const app = new Koa();
const router = new Router();

if (!process.env.SUPABASE_JWT_SECRET) {
  throw new Error('❌ Missing SUPABASE_JWT_SECRET. Server cannot start.');
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PORT = process.env.PORT || 3000;

// CORS Setup
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Authorization'],
  })
);
app.use(bodyparser());
app.use(serve(path.join(__dirname, 'public')));

// Middleware to Verify JWT
app.use(
  jwt({
    secret: process.env.SUPABASE_JWT_SECRET!,
    algorithms: ['HS256'],
  }).unless({
    path: [
      /^\/auth\/google/,
      /^\/auth\/google\/callback/,
      /^\/privacy-policy/,
      /^\/terms-of-service/,
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

app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
