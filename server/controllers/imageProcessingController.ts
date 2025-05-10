import { Context, Next } from 'koa';
import OpenAI from 'openai';
import 'dotenv/config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// const model = 'gpt-3.5-turbo';
// base64 required for turbo. This change is required by the model's image input specification. You'll need to fetch the image data, convert it to a base64 string, and then send it with the proper prefix before making your request.
const model = 'gpt-4o-mini';

// const imageAnalysisPrompt =
//   "Describe this image of professional ballet dancers in a manner that is both evocative and concise. Highlight key elements such as their graceful movements, detailed costumes, facial expressions, and the performance's overall mood, ensuring the description is accessible for visually impaired users.";

// assume tonePreference ∈ {'objective','expressive'}

function setImageAnalysisPrompt(tonePreference: string) {
  const imageAnalysisPrompt = `
You are a visual-describer for accessibility. 
Use a ${tonePreference} tone:
  • objective: factual, minimal emotion  
  • expressive: vivid, emotive language  

Describe the image of ballet dancers, focusing on:
  1. Movements or poses  
  2. Costume details  
  3. Facial expressions  
  4. Overall mood or setting  

Output only the description—no lists, no JSON, no extra commentary.
`;
  return imageAnalysisPrompt;
}

export const openAiImageProcessing = async (ctx: Context, next: Next) => {
  console.log('imageProcessing middleware');

  const { userUrl, imageContext, textContext } = ctx.state;
  // Original prompt - 'What’s in this image?'
  // setting objective tone for Dance Media
  let tonePreference = 'objective';
  if (textContext !== 'Dance Media') {
    tonePreference = 'expressive';
  }
  const imageAnalysisPrompt = setImageAnalysisPrompt(tonePreference);
  try {
    const response = await openai.chat.completions.create({
      model: model,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: imageAnalysisPrompt },
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
