/**
 * Perros potencialmente peligrosos por comunidad: razas que añade su
 * normativa a la lista estatal, seguro minimo si es mayor que el estatal y
 * otros requisitos propios (src/datos/ppp.json, DECISIONES.md, D56).
 *
 * Cada dato apunta a un articulo con su texto literal: del consolidado del
 * BOE o de un decreto autonomico de src/datos/externas.json.
 */
import pppJson from '@/datos/ppp.json';
import { articulo, esPpp, norma, raza } from './normativa';
import { nombreNorma } from './textos';
import type { FuenteResuelta } from './tipos';

type EntradaPpp = {
  comunidad: string;
  razas: { articulo: string; anadidas: string[] } | null;
  seguro: { articulo: string; importe: number; soloRazas?: string[] } | null;
  otros: { clave: string; articulo: string }[];
  avisos: { clave: string; url: string }[];
};

/** Cobertura minima estatal: RD 287/2002, art. 3.1.e. */
export const SEGURO_PPP_ESTATAL = 120000;

function fuente(id: string): FuenteResuelta {
  const a = articulo(id);
  const n = a ? norma(a.norma) : undefined;
  // Un articulo que no existe es una errata en los datos: rompe la
  // compilacion en lugar de desaparecer sin avisar.
  if (!a || !n || !a.textoLiteral)
    throw new Error(`ppp.json: no existe el articulo "${id}"`);
  return {
    norma: n,
    articulo: a,
    cita: a.textoLiteral,
    url: a.urlAncla ?? n.urlOficial,
  };
}

export type PppComunidad = {
  comunidad: string;
  razas: { anadidas: string[]; fuente: FuenteResuelta } | null;
  seguro: {
    importe: number;
    /** Si solo se exige a las razas de la lista autonomica. */
    soloRazas: string[] | null;
    fuente: FuenteResuelta;
  } | null;
  otros: { clave: string; fuente: FuenteResuelta }[];
  avisos: { clave: string; url: string }[];
};

const PPP = new Map(
  (pppJson.comunidades as EntradaPpp[]).map((e): [string, PppComunidad] => [
    e.comunidad,
    {
      comunidad: e.comunidad,
      razas: e.razas
        ? { anadidas: e.razas.anadidas, fuente: fuente(e.razas.articulo) }
        : null,
      seguro: e.seguro
        ? {
            importe: e.seguro.importe,
            soloRazas: e.seguro.soloRazas ?? null,
            fuente: fuente(e.seguro.articulo),
          }
        : null,
      otros: e.otros.map((o) => ({
        clave: o.clave,
        fuente: fuente(o.articulo),
      })),
      avisos: e.avisos,
    },
  ]),
);

/** Lo que la normativa de una comunidad añade al regimen estatal, o null. */
export const pppDeComunidad = (codigoComunidad: string) =>
  PPP.get(codigoComunidad) ?? null;

/**
 * Seguro minimo para un perro potencialmente peligroso en una comunidad, si
 * es mayor que el estatal. Si la norma autonomica solo lo exige a las razas
 * de su lista y la raza no es de ellas (o no se sabe), rige el estatal.
 */
export function seguroPpp(codigoComunidad: string, raza?: string | null) {
  const s = PPP.get(codigoComunidad)?.seguro;
  if (!s || s.importe <= SEGURO_PPP_ESTATAL) return null;
  if (s.soloRazas && !(raza && s.soloRazas.includes(raza))) return null;
  return s;
}

/**
 * Si la raza esta en la lista de perros potencialmente peligrosos de la
 * comunidad (D61). Sin raza, `no`. Sin comunidad, `depende` si solo esta
 * en listas autonomicas.
 */
export type VeredictoPpp = {
  estado: 'si' | 'no' | 'depende';
  lista: 'estatal' | 'autonomica' | null;
  /** Comunidades cuya lista propia incluye la raza. */
  enComunidades: string[];
};

export function veredictoPpp(
  slugRaza: string | null | undefined,
  codigoComunidad: string | null | undefined,
): VeredictoPpp {
  const r = slugRaza ? raza(slugRaza) : undefined;
  if (!r) return { estado: 'no', lista: null, enComunidades: [] };
  const enComunidades = r.autonomicas
    .filter((a) => a.esPpp)
    .map((a) => a.comunidad);
  const es = codigoComunidad ? esPpp(r.slug, codigoComunidad) : r.esPppEstatal;
  if (es)
    return {
      estado: 'si',
      lista: r.esPppEstatal ? 'estatal' : 'autonomica',
      enComunidades,
    };
  const depende = !codigoComunidad && enComunidades.length > 0;
  return { estado: depende ? 'depende' : 'no', lista: null, enComunidades };
}

/** Razas que añade la comunidad y seguro minimo para esa raza. */
export function fichaPppComunidad(
  codigoComunidad: string,
  slugRaza?: string | null,
) {
  const ppp = PPP.get(codigoComunidad);
  return {
    razas: ppp?.razas?.anadidas.map((s) => raza(s)?.nombre ?? s) ?? [],
    norma: ppp?.razas ? nombreNorma(ppp.razas.fuente.norma) : null,
    seguro: seguroPpp(codigoComunidad, slugRaza)?.importe ?? null,
  };
}
