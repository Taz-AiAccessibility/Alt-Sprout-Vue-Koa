import Koa, { Context, Next } from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
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

// ✅ Middleware to Verify JWT Instead of Cookies
app.use(
  jwt({
    secret: process.env.SUPABASE_JWT_SECRET!,
    algorithms: ['HS256'],
  }).unless({
    path: [/^\/auth\/google/, /^\/public/], // Public routes
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
