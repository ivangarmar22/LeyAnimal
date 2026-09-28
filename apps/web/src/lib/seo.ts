import { IDIOMAS, ruta, type Idioma } from '@/i18n/idiomas';
import { URL_SITIO } from './sitio';

/** URL absoluta de una ruta en un idioma. */
export function urlAbsoluta(href: string, idioma: Idioma) {
  return new URL(ruta(href, idioma), URL_SITIO).toString();
}

/** Versiones de idioma de una ruta, para hreflang y el sitemap. */
export function alternativas(href: string) {
  return [
    ...IDIOMAS.map((idioma) => ({
      hreflang: idioma,
      href: urlAbsoluta(href, idioma),
    })),
    { hreflang: 'x-default', href: urlAbsoluta(href, 'es') },
  ];
}

/** Anio en curso para los titulos SEO ("... en Malaga (2026)"). */
export const anioActual = () => new Date().getFullYear();
