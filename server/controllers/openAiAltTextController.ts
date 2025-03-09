import { Context, Next } from 'koa';
import OpenAI from 'openai';
import 'dotenv/config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const queryOpenAI = async (ctx: Context, next: Next) => {
  console.log('queryOpenAI middleware');

  const { imageAnalysis, imageContext, textContext } = ctx.state;

  console.log({ imageContext, textContext });

  if (!imageAnalysis) {
    console.log('Error: imageAnalysis not found');
    ctx.status = 500;
    ctx.body = { error: 'Image analysis missing' };
    return;
  }

  //const model = 'gpt-3.5-turbo';
  // base64 required for turbo. This change is required by the model's image input specification. You'll need to fetch the image data, convert it to a base64 string, and then send it with the proper prefix before making your request.
  const model = 'gpt-4o-mini';

  const altTextPrompt = `Guidelines:
1. You are an accomplished alt text writer for accessibility.
2. Consider the analysis provided: "${imageAnalysis}".
3. Factor in the additional context: "${imageContext}" regarding the dancers.
4. Adjust for the target audience: "${textContext}".
5. Produce a JSON object with two keys: "simple" (a short, clear alt text) and "complex" (a more detailed alt text). 
Ensure your response is only a valid JSON object, with no extra characters or line breaks.`;

  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: altTextPrompt },
        { role: 'user', content: `${imageContext}, ${textContext}` },
      ],
    });

    const completion = response.choices[0].message.content;

    if (!completion) {
      console.error('Error: OpenAI returned null content.');
      ctx.status = 500;
      ctx.body = { error: 'OpenAI did not return a valid response' };
      return;
    }
    const result = JSON.parse(completion);
    result.description_origin = imageAnalysis;
    result.subjects = imageContext;
    result.targetAudience = textContext;
    console.log('RESULT:', result);
    ctx.state.analysisResult = result;

    await next();
  } catch (error: any) {
    console.error('Error querying OpenAI:', error.message);
    ctx.status = 500;
    ctx.body = { error: 'Failed to process alt text' };
  }
};
