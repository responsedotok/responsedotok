import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test/setup.env.ts', 'src/test/setup.test.ts'],
    include: ['src/test/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'src/test/setup.*.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
        'src/db/migrate.mjs',
        'src/db/pool.ts',
        'src/**/layout.tsx',
        'src/app/**/page.tsx',
        'src/lib/types/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
});
