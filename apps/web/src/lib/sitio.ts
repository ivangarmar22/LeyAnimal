/**
 * Configuracion del sitio en un unico lugar, como el site.ts de TraceIT:
 * menus, enlaces del pie y datos de contacto.
 */

/**
 * Email al que llegan los avisos de /colabora y las consultas de /contacto.
 * PENDIENTE: sustituir por el definitivo antes de publicar. Mientras siga el
 * marcador, los formularios lo indican en pantalla para que ningun aviso se
 * pierda en silencio.
 */
export const EMAIL_CONTACTO = 'contacto@leyanimal.es';
export const EMAIL_ES_PROVISIONAL = true;

/** URL publica del sitio: la opcion 'site' de astro.config.mjs. */
export const URL_SITIO = import.meta.env.SITE ?? 'http://localhost:4321';

/** Menu principal. Las claves apuntan al catalogo 'navegacion'. */
export const MENU = [
  { href: '/consulta', clave: 'consulta' },
  { href: '/normativa', clave: 'normativa' },
  { href: '/temas', clave: 'temas' },
  { href: '/comunidades', clave: 'comunidades' },
  { href: '/cambios', clave: 'cambios' },
] as const;

export const PIE = {
  explorar: [
    { href: '/consulta', clave: 'consulta' },
    { href: '/normativa', clave: 'normativa' },
    { href: '/temas', clave: 'temas' },
    { href: '/comunidades', clave: 'comunidades' },
    { href: '/mapa', clave: 'mapa' },
  ],
  recursos: [
    { href: '/perros-potencialmente-peligrosos', clave: 'ppp' },
    { href: '/seguros', clave: 'seguros' },
    { href: '/multas', clave: 'multas' },
    { href: '/que-hacer-si', clave: 'queHacerSi' },
    { href: '/preguntas-frecuentes', clave: 'faq' },
  ],
  proyecto: [
    { href: '/metodologia', clave: 'metodologia' },
    { href: '/cambios', clave: 'cambios' },
    { href: '/colabora', clave: 'colabora' },
    { href: '/sobre', clave: 'sobre' },
    { href: '/contacto', clave: 'contacto' },
  ],
  legal: [
    { href: '/aviso-legal', clave: 'avisoLegal' },
    { href: '/privacidad', clave: 'privacidad' },
    { href: '/cookies', clave: 'cookies' },
    { href: '/accesibilidad', clave: 'accesibilidad' },
  ],
} as const;

/**
 * Titular de la web para el aviso legal (LSSI, art. 10). PENDIENTE: la
 * persona responsable debe facilitar estos datos antes de publicar. Mientras
 * falten, las paginas legales lo dicen en pantalla en lugar de inventarlos.
 */
export const TITULAR: {
  nombre: string | null;
  nif: string | null;
  domicilio: string | null;
} = {
  nombre: null,
  nif: null,
  domicilio: null,
};
