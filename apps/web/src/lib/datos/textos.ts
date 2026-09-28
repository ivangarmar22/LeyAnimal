/**
 * Textos propios (titulos y explicaciones) de requisitos, temas y notas de
 * verificacion en el idioma de la pagina.
 *
 * Los datos guardan la version en espanol, que es la de referencia. Los
 * catalogos de idioma pueden sobrescribirla; si falta una traduccion se usa
 * la espanola en lugar de mostrar una clave rota.
 *
 * Esto nunca se aplica al texto legal: las citas van siempre en su idioma
 * oficial (DECISIONES.md, D5).
 */
import type { Norma, Regla, Requisito, Tema } from './tipos';

type Traductor = {
  (clave: string): string;
  has: (clave: string) => boolean;
};

function traducir(t: Traductor, clave: string, respaldo: string | null) {
  return t.has(clave) ? t(clave) : (respaldo ?? '');
}

/** `t` del espacio 'requisitos'. */
export function textosRequisito(t: Traductor, r: Requisito) {
  return {
    titulo: traducir(t, `${r.clave}.titulo`, r.titulo),
    descripcion: traducir(t, `${r.clave}.descripcion`, r.descripcionCorta),
    explicacion: traducir(t, `${r.clave}.explicacion`, r.explicacion),
    plazo: traducir(t, `${r.clave}.plazo`, r.plazo),
    quien: traducir(t, `${r.clave}.quien`, r.quienLoExige),
  };
}

/** `t` del espacio 'temas'. */
export function textosTema(t: Traductor, tema: Tema) {
  return {
    nombre: traducir(t, `${tema.clave}.nombre`, tema.nombre),
    descripcion: traducir(t, `${tema.clave}.descripcion`, tema.descripcion),
  };
}

/** `t` del espacio 'notasReglas'. */
export function notaRegla(t: Traductor, regla: Regla | null) {
  if (!regla?.nota) return null;
  return traducir(t, regla.id, regla.nota);
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
