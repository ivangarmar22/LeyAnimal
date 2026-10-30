import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import compactarIconos from './scripts/compactar-iconos.mjs';

/**
 * Sitio 100 % estatico (DECISIONES.md, D48): todas las paginas, incluidas las
 * 8.132 fichas de municipio, se generan al compilar. No hay servidor: lo
 * interactivo son islas Preact que se hidratan solas.
 *
 * URL limpias y sin barra final (/consulta, /municipios/malaga): 'file' genera
 * consulta.html y GitHub Pages la sirve como /consulta.
 */
// La configuracion se evalua antes de que Astro cargue los .env: en local se
// lee .env.local; en el alojamiento, la variable llega del entorno.
try {
  process.loadEnvFile('.env.local');
} catch {
  // Sin .env.local: se usa el entorno o el valor local por defecto.
}

// PUBLIC_SITE_URL puede llevar subcarpeta (GitHub Pages publica en
// https://usuario.github.io/LeyAnimal): el dominio va a 'site' y la carpeta a
// 'base', que conBase() antepone a cada ruta.
const urlPublica = new URL(
  process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321',
);

export default defineConfig({
  site: urlPublica.origin,
  base: urlPublica.pathname,
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [preact(), compactarIconos()],
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
  },
});
