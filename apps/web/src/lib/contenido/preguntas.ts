/**
 * Preguntas frecuentes. El texto esta en los catalogos de idioma (faq.*);
 * aqui solo va que articulos respaldan cada respuesta, para citarlos debajo.
 * Una respuesta que afirma algo legal sin articulo detras no deberia existir.
 */
export const PREGUNTAS = [
  {
    clave: 'seguro',
    articulos: [
      'ley-7-2023-bienestar-animal#art. 30.3',
      'ley-animales-pais-vasco#Artículo 4',
      'rd-287-2002-animales-potencialmente-peligrosos#art. 3.1.e',
    ],
  },
  {
    clave: 'curso',
    articulos: [
      'ley-7-2023-bienestar-animal#art. 30.1',
      'ley-7-2023-bienestar-animal#art. 30.2',
    ],
  },
  {
    clave: 'ppp',
    articulos: [
      'rd-287-2002-animales-potencialmente-peligrosos#art. 2.1',
      'rd-287-2002-animales-potencialmente-peligrosos#anexo I',
      'rd-287-2002-animales-potencialmente-peligrosos#art. 2.2',
    ],
  },
  { clave: 'gatos', articulos: ['ley-7-2023-bienestar-animal#art. 26.i'] },
  { clave: 'pendiente', articulos: [] },
  { clave: 'sinDatos', articulos: [] },
  {
    clave: 'multas',
    articulos: [
      'ley-7-2023-bienestar-animal#art. 76.1',
      'ley-50-1999-animales-potencialmente-peligrosos#art. 13.5',
    ],
  },
  {
    clave: 'perdida',
    articulos: [
      'ley-7-2023-bienestar-animal#art. 24.2.g',
      'rd-287-2002-animales-potencialmente-peligrosos#art. 8.6',
    ],
  },
  { clave: 'solo', articulos: ['ley-7-2023-bienestar-animal#art. 27.i'] },
  { clave: 'terraza', articulos: ['ley-7-2023-bienestar-animal#art. 27.e'] },
  {
    clave: 'excrementos',
    articulos: ['ley-7-2023-bienestar-animal#art. 26.e'],
  },
  { clave: 'asesoramiento', articulos: [] },
  { clave: 'fuentes', articulos: [] },
] as const;

export type ClavePregunta = (typeof PREGUNTAS)[number]['clave'];

/** Las que se muestran resumidas en la portada. */
export const PREGUNTAS_PORTADA: ClavePregunta[] = [
  'seguro',
  'curso',
  'ppp',
  'gatos',
  'sinDatos',
];
