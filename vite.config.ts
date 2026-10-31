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
});
