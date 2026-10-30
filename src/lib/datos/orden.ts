/**
 * Orden estable del contenido legal. El contenido esta repartido en varios
 * ficheros segun su origen (escrito a mano o extraido del BOE); la web los une
 * y los scripts de contenido los escriben ya ordenados con estas mismas
 * funciones, asi que un cambio siempre produce el mismo diff.
 *
 * Sin imports con alias: lo importan tambien los scripts de Node.
 */
import type { Articulo, Fuente, Norma, Regla, Requisito } from './tipos';

const AMBITOS = ['estatal', 'autonomico', 'provincial', 'municipal'];

/** Por unidades de codigo, sin depender del idioma del sistema. */
const texto = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export const ordenarNormas = (normas: Norma[]) =>
  [...normas].sort(
    (a, b) =>
      AMBITOS.indexOf(a.ambito) - AMBITOS.indexOf(b.ambito) ||
      // Las mas recientes primero; las que no tienen anio, al final.
      (b.anio ?? -Infinity) - (a.anio ?? -Infinity) ||
      texto(a.slug, b.slug),
  );

export const ordenarArticulos = (articulos: Articulo[]) =>
  [...articulos].sort(
    (a, b) => texto(a.norma, b.norma) || texto(a.referencia, b.referencia),
  );

export const ordenarRequisitos = (requisitos: Requisito[]) =>
  [...requisitos].sort((a, b) => a.orden - b.orden || texto(a.clave, b.clave));

export const ordenarReglas = (reglas: Regla[]) =>
  [...reglas].sort(
    (a, b) =>
      texto(a.requisito, b.requisito) ||
      AMBITOS.indexOf(a.ambito) - AMBITOS.indexOf(b.ambito) ||
      texto(a.id, b.id),
  );

/** Por regla y despues por norma y articulo ("norma#referencia"). */
export const ordenarFuentes = (fuentes: Fuente[]) =>
  [...fuentes].sort((a, b) => {
    const [na = '', ra = ''] = a.articulo.split('#');
    const [nb = '', rb = ''] = b.articulo.split('#');
    return texto(a.regla, b.regla) || texto(na, nb) || texto(ra, rb);
  });
