import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { imageUploadKitServerPlugin } from './server/apiPlugin';

export default defineConfig({
  plugins: [react(), tailwindcss(), imageUploadKitServerPlugin()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Split long-lived vendor code so app changes don't bust their cache.
        manualChunks: {
          react: ['react', 'react-dom'],
          motion: ['motion/react'],
          kit: [
            '@mo-elsherbiny/image-upload-kit',
            '@mo-elsherbiny/image-upload-kit/react',
            '@mo-elsherbiny/image-upload-kit/headless',
          ],
          ui: ['lucide-react', 'sonner', 'canvas-confetti'],
        },
      },
    },
  },
});
