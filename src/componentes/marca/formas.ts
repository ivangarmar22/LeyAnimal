/**
 * Geometria y dibujo del simbolo (viewBox 0 0 48 52): un escudo con una
 * huella.
 *
 * El escudo es macizo y con volumen: degradado de verde claro a profundo, la
 * mitad derecha algo mas iluminada que la izquierda (el "partido" de la
 * marca), un brillo arriba y un filete interior que hace de borde en
 * relieve. La huella va en blanco con una sombra leve.
 *
 * Todo sale de aqui: el logotipo de la web, el favicon y las imagenes para
 * compartir (scripts/generar-og.mjs).
 */
export const ESCUDO =
  'M24 2 41.2 8.2c1.3.5 2.2 1.7 2.2 3.1V23c0 12.4-7.9 21.5-19.4 27C12.5 44.5 4.6 35.4 4.6 23V11.3c0-1.4.9-2.6 2.2-3.1Z';
/** Mitad derecha del escudo: la cara iluminada. */
export const ESCUDO_DERECHO =
  'M24 2 41.2 8.2c1.3.5 2.2 1.7 2.2 3.1V23c0 12.4-7.9 21.5-19.4 27Z';

export const ALMOHADILLA =
  'M24 26.4c-3.9 0-7.4 3.4-7.4 6.6 0 2.6 2.3 3.9 4.3 3.2 1.3-.5 1.9-.7 3.1-.7s1.8.2 3.1.7c2 .7 4.3-.6 4.3-3.2 0-3.2-3.5-6.6-7.4-6.6Z';

/** Dedos: [cx, cy, rx, ry, giro]. */
export const DEDOS: [number, number, number, number, number][] = [
  [16.4, 23.6, 2.25, 2.9, -24],
  [20.9, 19.2, 2.35, 3.05, -8],
  [27.1, 19.2, 2.35, 3.05, 8],
  [31.6, 23.6, 2.25, 2.9, 24],
];

const huella = () =>
  `<path d="${ALMOHADILLA}"/>` +
  DEDOS.map(
    ([cx, cy, rx, ry, g]) =>
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${g} ${cx} ${cy})"/>`,
  ).join('');

/**
 * Degradados del simbolo con un prefijo de id. En la web se definen una sola
 * vez por pagina (layouts/Base.astro), para no repetir ids entre la cabecera
 * y el pie.
 */
export function defsSimbolo(p: string) {
  const parada = (offset: string, color: string, opacidad = 1) =>
    `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacidad}"/>`;
  return (
    `<linearGradient id="${p}-escudo" x1="0.15" y1="0" x2="0.85" y2="1">` +
    parada('0', '#34c784') +
    parada('0.55', '#16804f') +
    parada('1', '#0b4a30') +
    `</linearGradient>` +
    `<linearGradient id="${p}-brillo" x1="0" y1="0" x2="0" y2="1">` +
    parada('0', '#ffffff', 0.42) +
    parada('0.5', '#ffffff', 0) +
    `</linearGradient>`
  );
}

/** Capas del simbolo, que usan los degradados de `defsSimbolo(p)`. */
export function capasSimbolo(p: string) {
  return (
    `<path d="${ESCUDO}" fill="url(#${p}-escudo)"/>` +
    `<path d="${ESCUDO_DERECHO}" fill="#ffffff" fill-opacity="0.13"/>` +
    `<path d="${ESCUDO}" fill="url(#${p}-brillo)"/>` +
    `<path d="${ESCUDO}" fill="none" stroke="#ffffff" stroke-opacity="0.38" stroke-width="1.3" transform="translate(24 25.6) scale(0.84) translate(-24 -25.6)"/>` +
    `<g fill="#06301f" fill-opacity="0.3" transform="translate(0 0.9)">${huella()}</g>` +
    `<g fill="#ffffff">${huella()}</g>`
  );
}

/** SVG completo e independiente (favicon, imagenes para compartir). */
export function simboloSvg(atributos = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 52"${atributos ? ` ${atributos}` : ''}><defs>${defsSimbolo('s')}</defs>${capasSimbolo('s')}</svg>`;
}
