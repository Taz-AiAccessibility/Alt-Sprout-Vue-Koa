import { Context, Next } from 'koa';
import validator from 'validator';

export const parseUserQuery = async (ctx: Context, next: Next) => {
  console.log('parseUserQuery middleware');
  const { userUrl, imageContext = '', textContext = '' } = ctx.request.body;

  if (!userUrl) {
    console.log('Error: userUrl not found');
    ctx.status = 400;
    ctx.body = { error: 'Image URL is required' };
    return;
  }

  // Add URL validation to protect against SSRF attacks
  try {
    const url = new URL(userUrl);
    const allowedProtocols = ['https:', 'http:'];

    if (!allowedProtocols.includes(url.protocol)) {
      console.log(`Error: Invalid URL protocol: ${url.protocol}`);
      ctx.status = 400;
      ctx.body = { error: 'Invalid URL protocol' };
      return;
    }

    // Optional domain validation - uncomment if needed
    // const allowedDomains = ['supabase.co', 'your-trusted-domain.com'];
    // const isDomainAllowed = allowedDomains.some(domain => url.hostname.endsWith(domain));
    // if (!isDomainAllowed) {
    //   ctx.status = 400;
    //   ctx.body = { error: 'Image domain not allowed' };
    //   return;
    // }
  } catch (error) {
    console.log(`Error: Invalid URL format: ${userUrl}`);
    ctx.status = 400;
    ctx.body = { error: 'Invalid URL format' };
    return;
  }

  // Sanitize text inputs to prevent prompt injection and XSS
  const sanitizedImageContext = imageContext
    ? validator.escape(imageContext.substring(0, 500))
    : '';
  const sanitizedTextContext = textContext
    ? validator.escape(textContext.substring(0, 500))
    : '';

  console.log('Sanitized inputs:', {
    originalImageContext: imageContext,
    sanitizedImageContext,
    originalTextContext: textContext,
    sanitizedTextContext,
  });

  ctx.state.userUrl = userUrl;
  ctx.state.imageContext = sanitizedImageContext;
  ctx.state.textContext = sanitizedTextContext;

  await next();
};
