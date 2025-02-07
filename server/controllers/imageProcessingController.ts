import { Context, Next } from 'koa';
import OpenAI from 'openai';
import 'dotenv/config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const openAiImageProcessing = async (ctx: Context, next: Next) => {
  console.log('imageProcessing middleware');

  const { userUrl, imageContext, textContext } = ctx.state;
  // Original prompt - 'What’s in this image?'
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe this image of ballet dancers' },
            {
              type: 'image_url',
              image_url: { url: userUrl, detail: 'low' },
            },
          ],
        },
      ],
    });

    ctx.state.imageAnalysis = response.choices[0].message.content;
    ctx.state.imageContext = imageContext;
    ctx.state.textContext = textContext;

    await next();
  } catch (error: any) {
    console.error('Error analyzing image:', error.message);
    ctx.status = 500;
    ctx.body = { error: 'Failed to analyze image' };
  }
};
