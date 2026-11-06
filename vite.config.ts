import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { imageUploadKitServerPlugin } from './server/apiPlugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kitRoot = path.resolve(__dirname, '../image-upload-kit');

export default defineConfig({
  plugins: [react(), tailwindcss(), imageUploadKitServerPlugin()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: [
      {
        find: /^img-upload-kit\/styles\.css$/,
        replacement: path.resolve(kitRoot, 'dist/styles.css'),
      },
      {
        find: /^img-upload-kit\/react$/,
        replacement: path.resolve(kitRoot, 'src/react/index.ts'),
      },
      {
        find: /^img-upload-kit\/headless$/,
        replacement: path.resolve(kitRoot, 'src/react/headless/index.ts'),
      },
      {
        find: /^img-upload-kit\/blur$/,
        replacement: path.resolve(kitRoot, 'src/blur/index.ts'),
      },
      {
        find: /^img-upload-kit$/,
        replacement: path.resolve(kitRoot, 'src/index.ts'),
      },
    ],
  },
  optimizeDeps: {
    exclude: ['img-upload-kit', 'img-upload-kit/react', 'img-upload-kit/headless', 'img-upload-kit/blur'],
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      allow: [__dirname, kitRoot],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/image-upload-kit/') || id.includes('/img-upload-kit/')) return 'kit';
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/motion/') || id.includes('/framer-motion/')) return 'motion';
          if (id.includes('/lucide-react/') || id.includes('/blurhash/')) return 'kit';
          if (id.includes('/shiki/') || id.includes('/@shikijs/')) return 'shiki';
          return 'vendor';
        },
      },
    },
  },
});
