import Koa, { Context } from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import koaBody from 'koa-body';
import { parseUserQuery } from './controllers/userQueryController';
import { openAiImageProcessing } from './controllers/imageProcessingController';
import { queryOpenAI } from './controllers/openAiAltTextController';

const app = new Koa();
const router = new Router();

// Middleware
app.use(cors({ origin: '*' })); // Allow all origins for development
app.use(koaBody());

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
