/**
 * Textos propios de requisitos, temas y notas de verificacion. Los datos
 * guardan el texto de referencia; el catalogo 'temas' puede reescribir la
 * descripcion de un tema para la web.
 */
import type { Traductor } from '@/i18n/traductor';
import type { Norma, Regla, Requisito, Tema } from './tipos';

export function textosRequisito(r: Requisito) {
  return {
    titulo: r.titulo,
    descripcion: r.descripcionCorta ?? '',
    explicacion: r.explicacion ?? '',
    plazo: r.plazo ?? '',
    quien: r.quienLoExige ?? '',
  };
}

/** `t` del espacio 'temas'. */
export function textosTema(t: Traductor, tema: Tema) {
  const clave = `${tema.clave}.descripcion`;
  return {
    nombre: tema.nombre,
    descripcion: t.has(clave) ? t(clave) : (tema.descripcion ?? ''),
  };
}

export function notaRegla(regla: Regla | null) {
  return regla?.nota ?? null;
}

/**
 * Nombre corto de una norma para citarla. Las autonomicas llevan el
 * territorio en el titulo corto porque hay numeros repetidos (Andalucia y
 * Aragon tienen las dos una Ley 11/2003).
 */
export function nombreNorma(n: Norma) {
  return n.tituloCorto ?? n.titulo.split(',')[0] ?? n.titulo;
}

/** Parrafos de un texto con saltos de linea dobles. */
export function parrafos(texto: string) {
  return texto
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Orden de lectura de las referencias de articulo: primero los articulos, por
 * numero ('art. 3.cc' antes que 'art. 22.1', 'Artículo 4' antes que
 * 'Artículo 11'); despues las disposiciones y los anexos. Los datos se guardan
 * en orden de texto (orden.ts), que es estable pero no es el de lectura.
 */
export function compararReferencias(a: string, b: string) {
  const grupo = (r: string) =>
    /^disp/i.test(r) ? 1 : /^anexo/i.test(r) ? 2 : 0;
  const trozos = (r: string) => r.toLowerCase().match(/\d+|[a-zñ]+/g) ?? [];
  const diferencia = grupo(a) - grupo(b);
  if (diferencia) return diferencia;
  const [ta, tb] = [trozos(a), trozos(b)];
  for (let i = 0; i < Math.max(ta.length, tb.length); i++) {
    const [x = '', y = ''] = [ta[i], tb[i]];
    if (x === y) continue;
    const [nx, ny] = [Number(x), Number(y)];
    if (!Number.isNaN(nx) && !Number.isNaN(ny)) return nx - ny;
    return x < y ? -1 : 1;
  }
  return 0;
}
