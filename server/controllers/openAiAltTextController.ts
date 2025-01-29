import { Context, Next } from 'koa';
import OpenAI from 'openai';
import 'dotenv/config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const queryOpenAI = async (ctx: Context, next: Next) => {
  console.log('queryOpenAI middleware');

  const { imageAnalysis, imageContext, textContext } = ctx.state;

  if (!imageAnalysis) {
    console.log('Error: imageAnalysis not found');
    ctx.status = 500;
    ctx.body = { error: 'Image analysis missing' };
    return;
  }

  const prompt = `Directions: 
  You are a professional creating alt text for an img tag in HTML. Start by reading ${imageAnalysis}. 
  Then, consider ${imageContext} for additional context and ${textContext} for audience relevance.
  Respond with a JSON object containing a "simple" and "complex" description of the image.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `${imageContext}, ${textContext}` },
      ],
    });

    const completion = response.choices[0].message.content;
    ctx.state.analysisResult = JSON.parse(completion);

    await next();
  } catch (error: any) {
    console.error('Error querying OpenAI:', error.message);
    ctx.status = 500;
    ctx.body = { error: 'Failed to process alt text' };
  }
};
