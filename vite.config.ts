import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  define: {
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify(
      process.env.VITE_BACKEND_URL || ''
    ),
  },
});

// Option 2: Keep Proxy for Local Development
// If you want to keep using /api during development but disable it in production, use:

// ts
// Copy
// Edit
// import { defineConfig } from 'vite';
// import vue from '@vitejs/plugin-vue';

// export default defineConfig({
//   plugins: [vue()],
//   server: {
//     proxy: process.env.NODE_ENV !== 'production'
//       ? {
//           '/api': {
//             target: 'http://localhost:3000',
//             changeOrigin: true,
//             rewrite: (path) => path.replace(/^\/api/, ''),
//           },
//         }
//       : undefined, // Disable proxy in production
//   },
// });
