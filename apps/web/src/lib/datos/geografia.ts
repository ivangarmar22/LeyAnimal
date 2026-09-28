/**
 * Comunidades y provincias (19 y 52). Ligero: lo usan tambien las islas.
 * Los municipios van aparte (municipios.ts) porque pesan ~350 KB.
 */
import geografiaJson from '@/datos/geografia.json';
import type { Comunidad, Provincia } from './tipos';

const COMUNIDADES = geografiaJson.comunidades as Comunidad[];
const PROVINCIAS = geografiaJson.provincias as Provincia[];

const comunidadPorCodigo = new Map(COMUNIDADES.map((c) => [c.codigoIne, c]));
const comunidadPorSlug = new Map(COMUNIDADES.map((c) => [c.slug, c]));
const provinciaPorCodigo = new Map(PROVINCIAS.map((p) => [p.codigoIne, p]));
const provinciaPorSlug = new Map(PROVINCIAS.map((p) => [p.slug, p]));

export const comunidades = () => COMUNIDADES;
export const comunidad = (slugOCodigo: string) =>
  comunidadPorSlug.get(slugOCodigo) ?? comunidadPorCodigo.get(slugOCodigo);

export const provincias = () => PROVINCIAS;
export const provincia = (slugOCodigo: string) =>
  provinciaPorSlug.get(slugOCodigo) ?? provinciaPorCodigo.get(slugOCodigo);
export const provinciasDe = (codigoComunidad: string) =>
  PROVINCIAS.filter((p) => p.comunidad === codigoComunidad);

/** Codigo de comunidad de cada provincia, para reconstruir municipios. */
export const comunidadDeProvincia = (codigoProvincia: string) =>
  provinciaPorCodigo.get(codigoProvincia)?.comunidad ?? '';
