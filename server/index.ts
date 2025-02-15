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

const app = new Koa();
const router = new Router();

// ✅ Ensure Required Environment Variables Exist
if (!process.env.SUPABASE_JWT_SECRET) {
  throw new Error('❌ Missing SUPABASE_JWT_SECRET. Server cannot start.');
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PORT = process.env.PORT || 3000;

// ✅ CORS Setup
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Authorization'],
  })
);
app.use(bodyparser()); // ✅ Middleware to parse request bodies

// ✅ Serve static files
app.use(serve(path.join(__dirname, 'public')));

// ✅ Middleware to Verify JWT
app.use(
  jwt({
    secret: process.env.SUPABASE_JWT_SECRET!,
    algorithms: ['HS256'],
  }).unless({
    path: [/^\/privacy-policy/, /^\/terms-of-service/], // Keep public access limited
  })
);

// ✅ Process Alt Text Request
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

// ✅ Serve Privacy Policy
router.get('/privacy-policy', async (ctx) => {
  const filePath = path.join(__dirname, 'public/privacy-policy.html');
  if (!fs.existsSync(filePath)) {
    ctx.status = 404;
    ctx.body = 'Privacy policy not found.';
    return;
  }
  ctx.type = 'html';
  ctx.body = fs.createReadStream(filePath);
});

// ✅ Serve Terms of Service
router.get('/terms-of-service', async (ctx) => {
  const filePath = path.join(__dirname, 'public/terms-of-service.html');
  if (!fs.existsSync(filePath)) {
    ctx.status = 404;
    ctx.body = 'Terms of Service not found.';
    return;
  }
  ctx.type = 'html';
  ctx.body = fs.createReadStream(filePath);
});

// ✅ Register API Routes
router
  .use(likedDescriptionRoutes.routes())
  .use(likedDescriptionRoutes.allowedMethods());
app.use(router.routes()).use(router.allowedMethods());

// ✅ Start Server
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
