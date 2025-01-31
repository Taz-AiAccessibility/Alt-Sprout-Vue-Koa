# 🌱 Alt Sprout

**Alt Sprout** is an AI-powered **alt text generator** that leverages **OpenAI** to create meaningful and accessible image descriptions. Designed for performance, accessibility, and scalability, it integrates **Vue.js, Koa.js, and TypeScript** to provide a seamless user experience.

## ✨ Key Features

- **AI-Powered Alt Text**: Automatically generates rich, meaningful alt text based on image content and user-provided context.
- **Modern Frontend with Vue.js**: Reactive and dynamic UI, enabling an intuitive and accessible workflow.
- **Optimized API with Koa.js**: Lightweight, asynchronous, and middleware-driven for efficient request handling.
- **TypeScript-Powered Development**: Enforces type safety and maintainability across the stack.
- **Flexible Image Inputs**: Supports **image URLs and file uploads** for maximum usability.

## 🛠 Tech Stack

### 🖥️ Frontend: Vue.js + TypeScript

Vue.js was chosen for its:

- ✅ **Reactive UI**: Ensures real-time updates for better user interaction.
- ✅ **Ease of Integration**: Lightweight, flexible, and quick to set up.
- ✅ **Scoped State Management**: Simplifies handling AI responses dynamically.

### ⚡ Backend: Koa.js + TypeScript

Koa.js provides:

- ✅ **Asynchronous API Handling**: Optimized for AI-based image processing.
- ✅ **Middleware Architecture**: Clean and modular backend logic.
- ✅ **Minimalist Design**: Lightweight and performant compared to Express.

### 🤖 AI: OpenAI GPT Models

Alt Sprout uses **OpenAI’s GPT-4o-mini** to:

- ✅ **Process image inputs via URLs or uploaded files.**
- ✅ **Generate contextual, natural language alt text based on user prompts.**
- ✅ **Improve accessibility by providing rich, descriptive image details.**

**Example API Call to OpenAI:**

```ts
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  temperature: 0.7,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What’s in this image?' },
        { type: 'image_url', image_url: { url: userUrl, detail: 'low' } },
      ],
    },
  ],
});
```

## ⚙️ How It Works

1. **User Uploads an Image**: Provide an **image URL** or **upload a file**.
2. **AI Processes the Image**: The backend calls OpenAI’s API to analyze the image.
3. **Alt Text is Generated**: AI returns a **simple and detailed alt text description**.
4. **User Copies and Integrates Alt Text**: Provides better **accessibility** across platforms.

## 👥 Original Team Members

- [**Ian Buchanan**](https://github.com/ianbuchanan42)
- [**Ragad Mohammed**](https://github.com/ragad-mohammed)
- [**Julie Hoagland Sorensen**](https://github.com/JulieHoaglandSorensen)
- [**Warren Cutler**](https://github.com/warren-cutler)
- [**Ellie Simens**](https://github.com/elliesimens)

## 📜 License

This project is **open-source** under the **MIT License**.
