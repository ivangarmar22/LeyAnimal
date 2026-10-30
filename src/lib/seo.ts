import { ruta } from './rutas';
import { URL_SITIO } from './sitio';

/** URL absoluta de una pagina o fichero: canonicas, feed, sitemaps. */
export function urlAbsoluta(href: string) {
  return new URL(ruta(href), URL_SITIO).toString();
}

/** Anio en curso para los titulos SEO ("... en Malaga (2026)"). */
export const anioActual = () => new Date().getFullYear();
