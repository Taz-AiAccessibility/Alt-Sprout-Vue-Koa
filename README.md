# 🌱 Alt Sprout Dance

[Visit Alt Sprout Dance](https://altsprout.dance/)

**Alt Sprout Dance** is an AI-powered alt text generator that leverages OpenAI to produce rich, meaningful, and accessible image descriptions. Designed for performance, accessibility, and scalability, it integrates **Vue.js**, **Koa.js**, and **TypeScript** to deliver a seamless user experience for digital creators.

# Demo Video

![Watch Demo Video](https://afziltusqfvlckjbgkil.supabase.co/storage/v1/object/sign/assets/demo-vidoe-x2.gif?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhc3NldHMvZGVtby12aWRvZS14Mi5naWYiLCJpYXQiOjE3NDE0OTY0MzIsImV4cCI6MTc3MzAzMjQzMn0.aLEUjikGJ1rn0DynaUVvB8kOx6tfkoJXrr88PlaIQ5s)

## ✨ Key Features

- **AI-Powered Alt Text:** Automatically generate descriptive alt text using image analysis and user context.
- **Modern Vue.js Frontend:** A reactive, dynamic UI for an intuitive workflow.
- **Efficient Koa.js Backend:** Asynchronous, middleware-driven API handling optimized for image processing.
- **TypeScript-Enhanced Development:** Ensures type safety and maintainability across the codebase.
- **Flexible Image Inputs:** Supports both image URLs and file uploads, with automatic conversion to base64 when needed.

## 🛠 Tech Stack

### Frontend: Vue.js + TypeScript

- **Reactive UI:** Real-time updates for enhanced interaction.
- **Ease of Integration:** Lightweight and flexible setup.
- **Scoped State Management:** Simplifies dynamic handling of AI responses.

### Backend: Koa.js + TypeScript

- **Asynchronous API Handling:** Optimized for AI image processing.
- **Modular Middleware Architecture:** Clean and maintainable backend logic.
- **Minimalist Design:** Lightweight and performant.

### AI: OpenAI GPT Models

Alt Sprout Dance uses **OpenAI’s GPT-4o-mini** (with alternatives like GPT-3.5-turbo as needed) to:

- Process images via URLs or uploads.
- Generate both concise and detailed alt text based on image analysis and user context.
- Enhance accessibility and improve image SEO.

## ⚙️ How It Works

1. **Image Input:**  
   The user provides an image URL or uploads a file.
2. **Image Analysis:**  
   The backend analyzes the image using OpenAI, producing a descriptive summary.
3. **Alt Text Generation:**  
   A second middleware synthesizes the image analysis, additional context, and target audience details to generate two alt text versions (simple and complex) in JSON format.
4. **Final Output:**  
   The alt text is returned for integration into digital content, improving accessibility and SEO.

## 💻 Code Examples

### Image Analysis Middleware (Koa.js)

This middleware calls OpenAI to analyze the image and stores its description.

```ts
export const openAiImageProcessing = async (ctx: Context, next: Next) => {
  const { userUrl, imageContext, textContext } = ctx.state;
  const analysisPrompt =
    'Analyze this image of professional ballet dancers. Describe their graceful poses, elegant costumes, and overall ambiance in a concise, accessible way.';
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: analysisPrompt },
            { type: 'image_url', image_url: { url: userUrl, detail: 'low' } },
          ],
        },
      ],
    });
    ctx.state.imageAnalysis = response.choices[0].message.content;
    ctx.state.imageContext = imageContext;
    ctx.state.textContext = textContext;
    await next();
  } catch (error: unknown) {
    console.error('Error analyzing image:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to analyze image' };
  }
};
```

### Alt Text Creation Middleware (Koa.js)

```ts
// queryOpenAI.ts
export const queryOpenAI = async (ctx: Context, next: Next) => {
  const { imageAnalysis, imageContext, textContext } = ctx.state;
  if (!imageAnalysis) {
    ctx.status = 500;
    ctx.body = { error: 'Image analysis missing' };
    return;
  }
  const altTextPrompt = `Guidelines:
1. You are an expert alt text generator for screen-readers.
2. Use the image analysis: "${imageAnalysis}".
3. Consider this context: "${imageContext}".
4. Target audience: "${textContext}" (if empty, assume a general audience).
5. Return a JSON object with "simple" (brief alt text) and "complex" (detailed alt text) keys.
Do not include extra text or line breaks.`;
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: altTextPrompt },
        { role: 'user', content: `${imageContext}, ${textContext}` },
      ],
    });
    const completion = response.choices[0].message.content;
    const result = JSON.parse(completion);
    result.description_origin = imageAnalysis;
    result.subjects = imageContext;
    result.targetAudience = textContext;
    ctx.state.analysisResult = result;
    await next();
  } catch (error: unknown) {
    console.error('Error generating alt text:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to process alt text' };
  }
};
```

## 👥 Original Team Members

- [**Ian Buchanan**](https://github.com/ianbuchanan42)
- [**Ragad Mohammed**](https://github.com/ragad-mohammed)
- [**Julie Hoagland Sorensen**](https://github.com/JulieHoaglandSorensen)
- [**Warren Cutler**](https://github.com/warren-cutler)
- [**Ellie Simens**](https://github.com/elliesimens)

## 📜 License

This project is **open-source** under the **MIT License**.
