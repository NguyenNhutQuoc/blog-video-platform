import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@blog/shared-ui-kit': resolve(__dirname, '../../libs/shared/ui-kit/src'),
      '@blog/shared-data-access': resolve(
        __dirname,
        '../../libs/shared/data-access/src'
      ),
      '@blog/shared-utils': resolve(__dirname, '../../libs/shared/utils/src'),
      '@blog/shared/domain': resolve(__dirname, '../../libs/shared/domain/src'),
    },
  },
  server: {
    port: 4200,
    host: true,
    fs: {
      allow: [
        // Allow serving files from workspace root (for libs)
        resolve(__dirname, '../..'),
      ],
    },
  },
  preview: {
    port: 4300,
  },
});
