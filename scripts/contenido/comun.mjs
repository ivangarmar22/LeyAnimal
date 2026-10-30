/**
 * Piezas compartidas por los scripts de contenido: donde viven los datos y
 * como se escriben.
 */
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));

/** Datos de la web (README.md, «Contenido legal»). */
export const DATOS = join(AQUI, '..', '..', 'src', 'datos');

/** Descargas del BOE y del INE. No se versiona: se rehace sola. */
export const CACHE = join(AQUI, '.cache');

/**
 * JSON estable: misma entrada, mismo texto, byte a byte. Las listas de tuplas
 * van una fila por linea: compactas, pero un cambio en un municipio sigue
 * viendose como una sola linea en el diff.
 */
export function serializar(valor) {
  if (Array.isArray(valor) && valor.every(Array.isArray)) {
    return `[\n${valor.map((fila) => JSON.stringify(fila)).join(',\n')}\n]\n`;
  }
  return `${JSON.stringify(valor, null, 1)}\n`;
}

export async function escribirDatos(nombre, valor) {
  const ruta = join(DATOS, nombre);
  await writeFile(ruta, serializar(valor), 'utf8');
  return ruta;
}
