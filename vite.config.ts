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
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/motion/') || id.includes('/framer-motion/')) return 'motion';
          if (id.includes('/img-upload-kit/') || id.includes('/lucide-react/') || id.includes('/blurhash/')) return 'kit';
          if (id.includes('/shiki/') || id.includes('/@shikijs/')) return 'shiki';
          return 'vendor';
        },
      },
    },
  },
});
