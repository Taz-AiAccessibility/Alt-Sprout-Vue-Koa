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

  const prompt = `Directions: 
  You are a professional at creating alt text for img tags within CSS code. This alt text will be used by screen-readers to describe images to people who are visually impaired. Start by reading the ${imageAnalysis}, this is the description of the image. Then, read the ${imageContext}, if provided, this is further context about the image provided by the user. Finally, read the ${textContext}, if provided, this is information about what audience the alt text is for. While the alt text is always for people who are visually impaired, this will tell you what the targeted demographic is. What you should consider is that if the text is for children, then use simpler more elementary language, if it is for a more professional demographic, then use more corporate language, for artists then use more descriptive, poetic language, etc- if ${textContext} is an empty string then assume it is for a general audience and maintain a descriptive, informative, but professional tone.
  Format of your response:
  Once you have read the image analysis, respond with the alt text. Format the output as a JSON object with the properties simple and complex. The value of simple should be a string with a less detailed version of the alt text, and the value of complex should be a string with a more detailed version of the alt text. This gives the user two options, based on their use case. You should not include any other words or punctuation other than the valid JSON object in your response. Do not include line breaks.
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt },
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
