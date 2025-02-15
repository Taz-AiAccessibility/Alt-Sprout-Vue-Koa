import Koa, { Context, Next } from 'koa';
import Router from '@koa/router';
import path from 'path';
import fs from 'fs';
import cors from '@koa/cors';
import serve from 'koa-static';
import { isAuthenticated } from './auth';
import { parseUserQuery } from './controllers/userQueryController';
import { openAiImageProcessing } from './controllers/imageProcessingController';
import { queryOpenAI } from './controllers/openAiAltTextController';
import jwt from 'koa-jwt';
import bodyparser from '@koa/bodyparser';
import likedDescriptionRoutes from './routes/likedDescriptionRoutes';

const app = new Koa();
const router = new Router();

console.log('🔑 Supabase JWT Secret:', process.env.SUPABASE_JWT_SECRET);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ✅ TypeScript Fix: Define session keys properly
app.keys = [process.env.SESSION_SECRET!];

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

// ✅ Serve static files (including privacy-policy.html)
app.use(serve(path.join(__dirname, 'public')));

// ✅ Middleware to Verify JWT Instead of Cookies
app.use(
  jwt({
    secret: process.env.SUPABASE_JWT_SECRET!,
    algorithms: ['HS256'],
  }).unless({
    path: [/^\/auth\/google/, /^\/public/, /^\/privacy-policy/], // Public routes
  })
);

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

// ✅ Route to Serve Privacy Policy
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

// ✅ Register API Routes
router
  .use(likedDescriptionRoutes.routes())
  .use(likedDescriptionRoutes.allowedMethods());

app.use(router.routes()).use(router.allowedMethods());

console.log('✅ Routes Registered:');
router.stack.forEach((route) => console.log(`🔹 ${route.path}`));

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Koa server running on http://localhost:${PORT}`)
);
