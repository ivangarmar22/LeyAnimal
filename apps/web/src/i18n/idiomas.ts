/**
 * Idiomas del sitio. El espanol vive en la raiz (/consulta) y el ingles bajo
 * /en (/en/consulta), como en la version anterior (DECISIONES.md, D4).
 *
 * Cada pagina se genera en los dos idiomas desde un unico fichero con un
 * parametro opcional `[...lang]`: vale `undefined` para el espanol y 'en'
 * para el ingles.
 */
export const IDIOMAS = ['es', 'en'] as const;
export type Idioma = (typeof IDIOMAS)[number];

const IDIOMA_POR_DEFECTO: Idioma = 'es';

/** Etiqueta BCP 47 para Intl (fechas, numeros, plurales). */
export const LOCALE: Record<Idioma, string> = { es: 'es-ES', en: 'en-GB' };

export const parametroIdioma = (idioma: Idioma) =>
  idioma === IDIOMA_POR_DEFECTO ? undefined : idioma;

export function idiomaDe(parametro: string | undefined): Idioma {
  return parametro === 'en' ? 'en' : 'es';
}

/** getStaticPaths de las paginas que solo dependen del idioma. */
export function rutasIdioma() {
  return IDIOMAS.map((idioma) => ({
    params: { lang: parametroIdioma(idioma) },
  }));
}

/** Ruta de una pagina en un idioma: ('/consulta', 'en') -> '/en/consulta'. */
export function ruta(href: string, idioma: Idioma): string {
  if (idioma === IDIOMA_POR_DEFECTO) return href;
  return href === '/' ? '/en' : `/en${href}`;
}
