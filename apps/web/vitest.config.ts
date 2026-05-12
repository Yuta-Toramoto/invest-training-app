import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: false,
    environment: 'jsdom',
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@invest-training/core': path.resolve(__dirname, '../../packages/core/src'),
      '@invest-training/types': path.resolve(__dirname, '../../packages/types/src'),
      '@invest-training/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
});
