import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

/**
 * Sitio 100 % estatico (DECISIONES.md, D48): todas las paginas, incluidas las
 * 8.132 fichas de municipio en los dos idiomas, se generan al compilar. No hay
 * servidor: lo interactivo son islas Preact que se hidratan solas.
 *
 * URL limpias y sin barra final (/consulta, /en/municipios/malaga), las mismas
 * que tenia la version anterior: 'file' genera consulta.html y los
 * alojamientos habituales la sirven como /consulta.
 */
// La configuracion se evalua antes de que Astro cargue los .env: en local se
// lee .env.local; en el alojamiento, la variable llega del entorno.
try {
  process.loadEnvFile('.env.local');
} catch {
  // Sin .env.local: se usa el entorno o el valor local por defecto.
}

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [preact()],
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
    // El motor de reglas se consume como TypeScript desde el workspace.
    ssr: { noExternal: ['@leyanimal/reglas'] },
  },
});
