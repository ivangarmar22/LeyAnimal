/**
 * Guias por situacion: que necesita tu animal si vas a comprarlo o adoptarlo,
 * mudarte, viajar... El texto esta en los catalogos (situaciones.*); aqui va
 * la estructura: los puntos de cada guia, a que animales afecta cada uno, en
 * que estado esta y que articulos lo respaldan.
 *
 * Un punto que afirma una obligacion sin articulo detras no puede existir:
 * `pnpm datos:comprobar` lo rechaza, igual que un articulo que no este en los
 * datos. Los consejos y lo que depende del lugar pueden no llevarlo.
 *
 * Modulo sin dependencias: lo importan las paginas y el comprobador.
 */

/** Animales por los que se puede filtrar una guia. */
export const ANIMALES = ['perro', 'gato', 'huron', 'ave', 'otro'] as const;
export type Animal = (typeof ANIMALES)[number];

/**
 * - obligatorio / obligatorio_pendiente_reglamento / recomendado: los mismos
 *   estados que el resto del sitio (y los mismos chips).
 * - depende: lo decide la comunidad, el ayuntamiento o el pais de destino.
 */
export type EstadoPunto =
  | 'obligatorio'
  | 'obligatorio_pendiente_reglamento'
  | 'recomendado'
  | 'depende';

export type Punto = {
  clave: string;
  estado: EstadoPunto;
  /** Articulos citados: `${slugNorma}#${referencia}`. */
  ids: readonly string[];
  /** Animales a los que afecta. Sin lista, a todos. */
  animales?: readonly Animal[];
  /** Solo para perros potencialmente peligrosos. */
  ppp?: boolean;
  /** Pagina del sitio donde seguir. */
  enlace?: string;
  /** Paginas oficiales de informacion, cuando la norma remite a otra. */
  oficiales?: readonly (keyof typeof OFICIALES)[];
};

export type Situacion = {
  slug: string;
  /** Animales que se ofrecen en el filtro. Uno solo: sin filtro. */
  animales: readonly Animal[];
  /** Articulos del bloque de introduccion (definiciones), si lo hay. */
  intro?: readonly string[];
  puntos: readonly Punto[];
};

/** Paginas oficiales (no son normas: se enlazan, no se citan). */
export const OFICIALES = {
  ue: 'https://europa.eu/youreurope/citizens/travel/carry/pets-and-other-animals/index_es.htm',
  mapa: 'https://www.mapa.gob.es/es/ganaderia/temas/comercio-exterior-ganadero/desplazamiento-animales-compania/',
} as const;

const L7 = 'ley-7-2023-bienestar-animal';
const L50 = 'ley-50-1999-animales-potencialmente-peligrosos';
const RD287 = 'rd-287-2002-animales-potencialmente-peligrosos';
const RD409 = 'rd-409-2025-perros-asistencia';
const RGC = 'rd-1428-2003-reglamento-general-circulacion';

const TODOS = ANIMALES;
const CON_MICROCHIP = ['perro', 'gato', 'huron'] as const;
const PPP = '/perros-potencialmente-peligrosos';

export const SITUACIONES: readonly Situacion[] = [
  {
    slug: 'comprar-o-adoptar',
    animales: TODOS,
    puntos: [
      {
        clave: 'identificado',
        estado: 'obligatorio',
        animales: ['perro', 'gato', 'huron', 'ave'],
        ids: [`${L7}#art. 51.2`, `${L7}#art. 55.4`, `${L7}#art. 58.1`],
      },
      {
        clave: 'criador',
        estado: 'obligatorio',
        animales: CON_MICROCHIP,
        ids: [`${L7}#art. 55.1`, `${L7}#art. 27.l`],
      },
      {
        clave: 'tienda',
        estado: 'obligatorio',
        animales: ['otro'],
        ids: [`${L7}#art. 55.4`],
      },
      {
        clave: 'adopcion',
        estado: 'obligatorio',
        ids: [`${L7}#art. 58.4`, `${L7}#art. 58.9`],
      },
      {
        clave: 'contrato',
        estado: 'obligatorio',
        ids: [`${L7}#art. 55.2`, `${L7}#art. 58.2`],
      },
      {
        clave: 'informacion',
        estado: 'obligatorio',
        ids: [`${L7}#art. 55.5`, `${L7}#art. 58.7`],
      },
      {
        clave: 'edad',
        estado: 'obligatorio',
        animales: CON_MICROCHIP,
        ids: [`${L7}#art. 55.7`, `${L7}#art. 58.3`],
      },
      {
        clave: 'adoptado',
        estado: 'obligatorio',
        animales: CON_MICROCHIP,
        ids: [`${L7}#art. 58.8`],
      },
      {
        clave: 'registro',
        estado: 'obligatorio',
        ids: [`${L7}#art. 55.6`, `${L7}#art. 24.2.i`],
      },
      {
        clave: 'gatos',
        estado: 'obligatorio',
        animales: ['gato'],
        ids: [`${L7}#art. 26.i`],
      },
      {
        clave: 'curso',
        estado: 'obligatorio_pendiente_reglamento',
        animales: ['perro'],
        ids: [`${L7}#art. 30.1`, `${L7}#art. 30.2`],
        enlace: '/temas/curso',
      },
      {
        clave: 'seguro',
        estado: 'obligatorio_pendiente_reglamento',
        animales: ['perro'],
        ids: [`${L7}#art. 30.3`],
        enlace: '/seguros',
      },
      {
        clave: 'ppp',
        estado: 'obligatorio',
        animales: ['perro'],
        ppp: true,
        ids: [`${L50}#art. 4.1`, `${L50}#art. 4.4`],
        enlace: PPP,
      },
      {
        clave: 'consulta',
        estado: 'depende',
        ids: [],
        enlace: '/consulta',
      },
    ],
  },
  {
    slug: 'mudanza',
    animales: TODOS,
    puntos: [
      {
        clave: 'datos',
        estado: 'obligatorio',
        ids: [`${L7}#art. 24.2.f`],
      },
      {
        clave: 'comunidad',
        estado: 'depende',
        ids: [`${L7}#art. 51.2`],
        enlace: '/comunidades',
      },
      {
        clave: 'censo',
        estado: 'depende',
        ids: [],
        enlace: '/consulta',
      },
      {
        clave: 'ppp',
        estado: 'obligatorio',
        animales: ['perro'],
        ppp: true,
        ids: [`${L50}#art. 6.6`, `${RD287}#art. 3.3`],
        enlace: PPP,
      },
      {
        clave: 'escapadas',
        estado: 'obligatorio',
        ids: [`${L7}#art. 24.2.c`],
      },
      {
        clave: 'traslado',
        estado: 'obligatorio',
        ids: [`${L7}#art. 59.1`, `${L7}#art. 60.6`],
        enlace: '/situaciones/viajar-por-espana',
      },
      {
        clave: 'perdida',
        estado: 'obligatorio',
        ids: [`${L7}#art. 24.2.g`],
        enlace: '/que-hacer-si#perdido',
      },
    ],
  },
  {
    slug: 'viajar-por-espana',
    animales: TODOS,
    puntos: [
      {
        clave: 'identificado',
        estado: 'obligatorio',
        ids: [`${L7}#art. 24.2.f`],
      },
      {
        clave: 'coche',
        estado: 'obligatorio',
        ids: [`${L7}#art. 60.6`, `${RGC}#art. 18.1`],
      },
      {
        clave: 'aparcado',
        estado: 'obligatorio',
        ids: [`${L7}#art. 24.2.d`, `${L7}#art. 60.2`],
      },
      {
        clave: 'condiciones',
        estado: 'obligatorio',
        ids: [`${L7}#art. 59.1`],
      },
      {
        clave: 'transporte',
        estado: 'depende',
        ids: [`${L7}#art. 29.1`, `${L7}#art. 29.5`],
      },
      {
        clave: 'alojamiento',
        estado: 'depende',
        ids: [`${L7}#art. 29.2`],
      },
      {
        clave: 'playas',
        estado: 'depende',
        ids: [`${L7}#art. 29.7`],
      },
      {
        clave: 'solo',
        estado: 'obligatorio',
        ids: [`${L7}#art. 27.i`],
      },
      {
        clave: 'ppp',
        estado: 'obligatorio',
        animales: ['perro'],
        ppp: true,
        ids: [`${RD287}#art. 8.1`, `${RD287}#art. 8.2`, `${RD287}#art. 8.3`],
        enlace: PPP,
      },
    ],
  },
  {
    slug: 'viajar-al-extranjero',
    animales: ['perro', 'gato', 'huron', 'otro'],
    puntos: [
      {
        clave: 'requisitos',
        estado: 'obligatorio',
        ids: [`${L7}#art. 61.3`],
        oficiales: ['ue', 'mapa'],
      },
      {
        clave: 'microchip',
        estado: 'obligatorio',
        animales: CON_MICROCHIP,
        ids: [`${L7}#art. 51.2`, `${L7}#art. 61.3`],
        oficiales: ['ue'],
      },
      {
        clave: 'rabia',
        estado: 'obligatorio',
        animales: CON_MICROCHIP,
        ids: [`${L7}#art. 61.3`],
        oficiales: ['ue'],
      },
      {
        clave: 'pasaporte',
        estado: 'obligatorio',
        animales: CON_MICROCHIP,
        ids: [`${L7}#art. 51.4`, `${L7}#art. 61.3`],
        oficiales: ['ue'],
      },
      {
        clave: 'tenia',
        estado: 'depende',
        animales: ['perro'],
        ids: [],
        oficiales: ['ue'],
      },
      {
        clave: 'fueraUe',
        estado: 'depende',
        ids: [`${L7}#art. 61.3`],
        oficiales: ['ue', 'mapa'],
      },
      {
        clave: 'otros',
        estado: 'depende',
        animales: ['otro'],
        ids: [`${L7}#art. 61.3`],
        oficiales: ['mapa'],
      },
      {
        clave: 'compania',
        estado: 'depende',
        ids: [`${L7}#art. 29.1`],
      },
      {
        clave: 'ppp',
        estado: 'obligatorio',
        animales: ['perro'],
        ppp: true,
        ids: [`${L50}#art. 4.1`],
        enlace: PPP,
      },
      {
        clave: 'traer',
        estado: 'obligatorio',
        ids: [`${L7}#art. 61.1`],
      },
    ],
  },
  {
    slug: 'perro-de-asistencia',
    animales: ['perro'],
    intro: [`${L7}#art. 3.cc`, `${RD409}#art. 2.b`],
    puntos: [
      {
        clave: 'reconocimiento',
        estado: 'depende',
        ids: [`${RD409}#art. 6.1`, `${RD409}#art. 6.3`, `${RD409}#art. 3.2`],
      },
      {
        clave: 'acceso',
        estado: 'obligatorio',
        ids: [
          `${L7}#art. 29.6`,
          `${RD409}#art. 7.1.a`,
          `${RD409}#art. 7.1.b`,
          `${RD409}#art. 7.1.c`,
        ],
      },
      {
        clave: 'transporte',
        estado: 'obligatorio',
        ids: [`${RD409}#art. 7.1.d`],
      },
      {
        clave: 'limites',
        estado: 'obligatorio',
        ids: [`${RD409}#art. 7.2`, `${RD409}#art. 7.3`, `${RD409}#art. 7.4`],
      },
      {
        clave: 'obligaciones',
        estado: 'obligatorio',
        ids: [`${RD409}#art. 8.2`],
      },
      {
        clave: 'resto',
        estado: 'obligatorio',
        ids: [`${L7}#disp. adic. 1.ª`],
        enlace: '/consulta',
      },
      {
        clave: 'extranjero',
        estado: 'obligatorio',
        ids: [`${RD409}#art. 7.7`],
      },
      {
        clave: 'denegacion',
        estado: 'recomendado',
        ids: [`${RD409}#art. 7.3`, `${RD409}#art. 9`],
      },
    ],
  },
];

/**
 * Situaciones cuya guia ya existe en otra pagina: se listan junto a las demas
 * y enlazan alli en lugar de repetirla.
 */
export const ACCESOS = [{ clave: 'ppp', href: PPP }] as const;

export const situacion = (slug: string) =>
  SITUACIONES.find((s) => s.slug === slug);
