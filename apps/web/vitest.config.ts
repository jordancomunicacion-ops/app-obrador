import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Alias '@/...' → raíz de apps/web (igual que tsconfig paths "@/*": ["./*"]).
const root = fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '');

export default defineConfig({
  resolve: {
    alias: { '@': root },
  },
  test: {
    environment: 'node',
    include: ['app/**/*.test.ts'],
  },
});
