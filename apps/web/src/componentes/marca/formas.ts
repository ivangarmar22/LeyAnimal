/**
 * Geometria del simbolo (viewBox 0 0 48 52): un escudo con una huella.
 *
 * Version "partida": la mitad izquierda del escudo es maciza y la derecha va
 * a trazo; la huella cruza el eje y cambia de color al cruzarlo. Cada mitad
 * de la huella se dibuja por separado, sin clipPath, para no repetir ids en
 * el documento cuando el logo sale en la cabecera y en el pie.
 */
export const ESCUDO =
  'M24 3.5 40.2 9.3c.9.3 1.5 1.2 1.5 2.1V23c0 11.6-7.4 20.1-17.7 25.3C13.7 43.1 6.3 34.6 6.3 23V11.4c0-.9.6-1.8 1.5-2.1Z';
export const ESCUDO_IZQUIERDO =
  'M24 3.5 7.8 9.3c-.9.3-1.5 1.2-1.5 2.1V23c0 11.6 7.4 20.1 17.7 25.3Z';
/** Escudo macizo, algo mas grueso, para tamanos pequenos (favicon). */
export const ESCUDO_MACIZO =
  'M24 2 41.2 8.2c1.3.5 2.2 1.7 2.2 3.1V23c0 12.4-7.9 21.5-19.4 27C12.5 44.5 4.6 35.4 4.6 23V11.3c0-1.4.9-2.6 2.2-3.1Z';

export const ALMOHADILLA =
  'M24 26.4c-3.9 0-7.4 3.4-7.4 6.6 0 2.6 2.3 3.9 4.3 3.2 1.3-.5 1.9-.7 3.1-.7s1.8.2 3.1.7c2 .7 4.3-.6 4.3-3.2 0-3.2-3.5-6.6-7.4-6.6Z';
export const ALMOHADILLA_IZQUIERDA =
  'M24 26.4c-3.9 0-7.4 3.4-7.4 6.6 0 2.6 2.3 3.9 4.3 3.2 1.3-.5 1.9-.7 3.1-.7Z';
export const ALMOHADILLA_DERECHA =
  'M24 26.4c3.9 0 7.4 3.4 7.4 6.6 0 2.6-2.3 3.9-4.3 3.2-1.3-.5-1.9-.7-3.1-.7Z';

/** Dedos: [cx, cy, rx, ry, giro]. Los dos primeros caen en la mitad izquierda. */
export const DEDOS: [number, number, number, number, number][] = [
  [16.4, 23.6, 2.25, 2.9, -24],
  [20.9, 19.2, 2.35, 3.05, -8],
  [27.1, 19.2, 2.35, 3.05, 8],
  [31.6, 23.6, 2.25, 2.9, 24],
];
