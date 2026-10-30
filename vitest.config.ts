import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// El mismo alias que tsconfig.json: los tests de datos importan los modulos
// de la web tal cual.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
