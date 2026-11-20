/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Forward API calls to the Express proxy (see server/) when VITE_DATA_SOURCE=http.
    proxy: { '/api': 'http://localhost:3001' },
  },
  build: {
    // Recharts makes the single bundle ~650 kB; acceptable for this lab app.
    chunkSizeWarningLimit: 800,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}', 'server/**/*.ts'],
      exclude: ['**/*.test.{ts,tsx}', 'src/main.tsx', 'src/test/**', 'src/vite-env.d.ts', 'server/index.ts'],
      reporter: ['text-summary', 'text'],
      // Floor set a few points below current coverage (~93% / 90%) so it catches regressions, not noise.
      thresholds: { statements: 88, branches: 82, functions: 85, lines: 88 },
    },
  },
});
