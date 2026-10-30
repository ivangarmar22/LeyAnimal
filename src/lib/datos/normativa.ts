/**
 * Catalogo, normativa, reglas y cambios. Ligero (~15 KB comprimido): lo usa
 * la compilacion y tambien la isla de la consulta, que evalua en el navegador.
 *
 * La normativa llega en cuatro ficheros segun su origen: la estatal escrita a
 * mano, la autonomica y los articulos de referencia extraidos del BOE, y los
 * decretos autonomicos que no estan en el consolidado del BOE, copiados de su
 * boletin oficial (externas.json, D56). Aqui se unen con un orden estable.
 */
import autonomicoJson from '@/datos/autonomico.json';
import cambiosJson from '@/datos/cambios.json';
import catalogoJson from '@/datos/catalogo.json';
import estatalJson from '@/datos/estatal.json';
import externasJson from '@/datos/externas.json';
import referenciaJson from '@/datos/referencia-estatal.json';
import { normalizar } from './busqueda';
import {
  ordenarArticulos,
  ordenarFuentes,
  ordenarNormas,
  ordenarReglas,
  ordenarRequisitos,
} from './orden';
import type {
  Articulo,
  Cambio,
  Especie,
  Fuente,
  FuenteResuelta,
  Norma,
  Raza,
  Regla,
  Requisito,
  Tema,
} from './tipos';

// --- Catalogo ---------------------------------------------------------------

const ESPECIES = catalogoJson.especies as Especie[];
const RAZAS = catalogoJson.razas as Raza[];
const TEMAS = catalogoJson.temas as Tema[];
const razaPorSlug = new Map(RAZAS.map((r) => [r.slug, r]));
const temaPorSlug = new Map(TEMAS.map((t) => [t.slug, t]));
const temaPorClave = new Map(TEMAS.map((t) => [t.clave, t]));

export const especies = () => ESPECIES;
export const razas = (especie?: string) =>
  especie ? RAZAS.filter((r) => r.especie === especie) : RAZAS;
export const raza = (slug: string) => razaPorSlug.get(slug);

export function buscarRazas(termino: string, especie = 'perro', limite = 8) {
  const t = normalizar(termino);
  if (t.length < 2) return [];
  return RAZAS.filter(
    (r) => r.especie === especie && normalizar(r.nombre).includes(t),
  )
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    .slice(0, limite);
}

/**
 * Si la raza esta considerada potencialmente peligrosa en esa comunidad. Una
 * excepcion autonomica prevalece sobre la lista estatal. `null` significa que
 * no esta verificado, y el motor lo trata como desconocido, nunca como "no".
 */
export function esPpp(
  slugRaza: string,
  codigoComunidad: string,
): boolean | null {
  const r = razaPorSlug.get(slugRaza);
  if (!r) return null;
  const propia = r.autonomicas.find((a) => a.comunidad === codigoComunidad);
  return propia ? propia.esPpp : r.esPppEstatal;
}

export const temas = () => TEMAS;
export const tema = (slugOClave: string) =>
  temaPorSlug.get(slugOClave) ?? temaPorClave.get(slugOClave);

// --- Normativa --------------------------------------------------------------

const NORMAS = ordenarNormas([
  ...estatalJson.normas,
  ...autonomicoJson.normas,
  ...externasJson.normas,
] as Norma[]);
const ARTICULOS = ordenarArticulos([
  ...estatalJson.articulos,
  ...autonomicoJson.articulos,
  ...referenciaJson.articulos,
  ...externasJson.articulos,
] as Articulo[]);
const normaPorSlug = new Map(NORMAS.map((n) => [n.slug, n]));
const articuloPorId = new Map(ARTICULOS.map((a) => [a.id, a]));

export const normas = () => NORMAS;
export const norma = (slug: string) => normaPorSlug.get(slug);
export const articulosDe = (slugNorma: string) =>
  ARTICULOS.filter((a) => a.norma === slugNorma);
export const articulo = (id: string) => articuloPorId.get(id);
export const normasDeComunidad = (codigoComunidad: string) =>
  NORMAS.filter((n) => n.comunidad === codigoComunidad);

// --- Reglas -----------------------------------------------------------------

const REQUISITOS = ordenarRequisitos([
  ...estatalJson.requisitos,
  ...autonomicoJson.requisitos,
] as Requisito[]);
const REGLAS = ordenarReglas([
  ...estatalJson.reglas,
  ...autonomicoJson.reglas,
  ...externasJson.reglas,
] as unknown as Regla[]);
const FUENTES = ordenarFuentes([
  ...estatalJson.fuentes,
  ...autonomicoJson.fuentes,
  ...externasJson.fuentes,
] as Fuente[]);
const requisitoPorClave = new Map(REQUISITOS.map((r) => [r.clave, r]));

export const requisitos = () => REQUISITOS;
export const requisito = (clave: string) => requisitoPorClave.get(clave);
export const reglas = () => REGLAS;
export const reglasDeComunidad = (codigoComunidad: string) =>
  REGLAS.filter((r) => r.comunidad === codigoComunidad);
export const reglasDeRequisito = (clave: string) =>
  REGLAS.filter((r) => r.requisito === clave);

/**
 * Norma, articulo y cita de una regla. Si falta alguna pieza la fuente se
 * descarta: el sitio no muestra afirmaciones legales a medias (§16).
 */
export function fuentesDe(idRegla: string): FuenteResuelta[] {
  const resultado: FuenteResuelta[] = [];
  for (const f of FUENTES) {
    if (f.regla !== idRegla) continue;
    const articulo = articuloPorId.get(f.articulo);
    const n = articulo ? normaPorSlug.get(articulo.norma) : undefined;
    const cita = f.cita ?? articulo?.textoLiteral;
    if (!articulo || !n || !cita) continue;
    resultado.push({
      norma: n,
      articulo,
      cita,
      url: articulo.urlAncla ?? n.urlOficial,
    });
  }
  return resultado;
}

// --- Referencias autonomicas ---------------------------------------------

/**
 * Articulos autonomicos que la web cita sin que fundamenten una regla: el
 * cuadro de multas de cada ley, las razas PPP que añade y otras obligaciones
 * propias (vacunacion, esterilizacion, correa...).
 */
export type GrupoReferencia = 'sanciones' | 'ppp' | 'obligacion';

type ReferenciaJson = {
  comunidad: string;
  grupo: GrupoReferencia;
  clave: string | null;
  articulo: string;
  cita: string;
};

const REFERENCIAS = [
  ...autonomicoJson.referencias,
  ...externasJson.referencias,
] as ReferenciaJson[];

export function referencias(grupo: GrupoReferencia, codigoComunidad?: string) {
  return REFERENCIAS.filter(
    (r) =>
      r.grupo === grupo &&
      (codigoComunidad === undefined || r.comunidad === codigoComunidad),
  ).map((r) => {
    const a = articuloPorId.get(r.articulo);
    const n = a ? normaPorSlug.get(a.norma) : undefined;
    if (!a || !n) throw new Error(`Referencia rota: ${r.articulo}`);
    const fuente: FuenteResuelta = {
      norma: n,
      articulo: a,
      cita: r.cita,
      url: a.urlAncla ?? n.urlOficial,
    };
    return { comunidad: r.comunidad, clave: r.clave, fuente };
  });
}

/** Reglas que citan algun articulo de una norma. */
export function reglasQueCitan(slugNorma: string): Regla[] {
  const ids = new Set(
    FUENTES.filter(
      (f) => articuloPorId.get(f.articulo)?.norma === slugNorma,
    ).map((f) => f.regla),
  );
  return REGLAS.filter((r) => ids.has(r.id));
}

/** Normas que respaldan al menos una regla de un requisito. */
export function normasDeRequisito(clave: string): Norma[] {
  const slugs = new Set<string>();
  for (const r of REGLAS) {
    if (r.requisito !== clave) continue;
    for (const f of fuentesDe(r.id)) slugs.add(f.norma.slug);
  }
  return [...slugs]
    .map((s) => normaPorSlug.get(s))
    .filter((n): n is Norma => Boolean(n));
}

// --- Cambios ----------------------------------------------------------------

export const cambios = () => cambiosJson as Cambio[];

/** Fecha de verificacion mas reciente de todo el contenido legal. */
export function ultimaVerificacion(): string | null {
  const fechas = [
    ...NORMAS.map((n) => n.verificadaEn),
    ...REGLAS.map((r) => r.verificadaEn),
  ]
    .filter((f): f is string => Boolean(f))
    .sort();
  return fechas.at(-1) ?? null;
}

export const totalArticulos = () => ARTICULOS.length;
export const totalFuentes = () => FUENTES.length;
