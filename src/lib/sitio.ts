/**
 * Configuracion del sitio en un unico lugar: menus, enlaces del pie y datos
 * de contacto.
 */

/** Email al que llegan los avisos de /colabora y las consultas de /contacto. */
export const EMAIL_CONTACTO = 'leyanimalcontacto@gmail.com';

/**
 * Formulario de /colabora (https://web3forms.com). La clave es publica por
 * diseno: solo permite enviar mensajes al correo con el que se registro.
 */
export const WEB3FORMS = {
  url: 'https://api.web3forms.com/submit',
  clave: '8fb24dd0-159a-46ea-9299-38348e67f40d',
} as const;

/**
 * Donativos voluntarios (/apoya). El proyecto es gratuito y lo sigue siendo
 * sin ellos: solo ayudan a mantenerlo.
 */
export const DONATIVOS = {
  bizum: '652308536',
  paypal: 'https://www.paypal.me/ivangarmar22',
} as const;

/** Dominio oficial del proyecto, el que muestra la maqueta de la portada. */
export const DOMINIO = 'leyanimal.es';

/** URL publica del sitio: la opcion 'site' de astro.config.mjs. */
export const URL_SITIO = import.meta.env.SITE ?? 'http://localhost:4321';

/**
 * Menu principal. Las claves apuntan al catalogo 'navegacion'. Cinco enlaces
 * como mucho: con uno mas no caben junto a los botones a 1024 px. Los cambios
 * normativos siguen en el pie y en la portada.
 */
export const MENU = [
  { href: '/consulta', clave: 'consulta' },
  { href: '/situaciones', clave: 'situaciones' },
  { href: '/temas', clave: 'temas' },
  { href: '/normativa', clave: 'normativa' },
  { href: '/comunidades', clave: 'comunidades' },
] as const;

export const PIE = {
  explorar: [
    { href: '/consulta', clave: 'consulta' },
    { href: '/situaciones', clave: 'situaciones' },
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

/** Responsable de la web (aviso legal y privacidad). */
export const TITULAR = 'Iván García';
