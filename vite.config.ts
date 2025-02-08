// // https://vite.dev/config/
// import { defineConfig } from 'vite';
// import vue from '@vitejs/plugin-vue';
// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [vue()],
//   server: {
//     proxy: {
//       '/api': {
//         target: process.env.VITE_BACKEND_URL || 'http://localhost:3000',
//         changeOrigin: true,
//         rewrite: (path) => path.replace(/^\/api/, ''),
//       },
//     },
//   },
// });

// import { defineConfig } from 'vite';
// import vue from '@vitejs/plugin-vue';

// export default defineConfig({
//   plugins: [vue()],
//   server: {
//     proxy: {
//       '/auth': {
//         target: process.env.VITE_BACKEND_URL || 'http://localhost:3000',
//         changeOrigin: true,
//       },
//       '/api': {
//         target: process.env.VITE_BACKEND_URL || 'http://localhost:3000',
//         changeOrigin: true,
//       },
//     },
//   },
//   build: {
//     outDir: 'dist', // Ensure build output is in `dist/`
//   },
// });

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true, // Ensures Vite binds to all network interfaces
    port: 10000, // Standard Vite development port
    strictPort: true, // Prevents running on a random port if 5173 is taken
    allowedHosts: ['.onrender.com', 'localhost'], // ✅ Allow Render domain & local dev
    proxy: {
      '/auth': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:10000', // Backend runs on port 10000
        changeOrigin: true,
        secure: process.env.NODE_ENV === 'production', // Enforce HTTPS in production
      },
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:10000',
        changeOrigin: true,
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  build: {
    outDir: 'dist', // Ensures frontend is built to the correct folder
    emptyOutDir: true, // Clears the folder before a new build
  },
});
