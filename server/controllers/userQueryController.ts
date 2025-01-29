import { Context, Next } from 'koa';

export const parseUserQuery = async (ctx: Context, next: Next) => {
  console.log('parseUserQuery middleware');
  const { userUrl, imageContext = '', textContext = '' } = ctx.request.body;

  if (!userUrl) {
    console.log('Error: userUrl not found');
    ctx.status = 400;
    ctx.body = { error: 'Image URL is required' };
    return;
  }

  ctx.state.userUrl = userUrl;
  ctx.state.imageContext = imageContext;
  ctx.state.textContext = textContext;

  await next();
};
