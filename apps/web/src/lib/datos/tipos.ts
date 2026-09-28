/**
 * Tipos del contenido de src/datos/ (README.md, «Contenido legal»).
 *
 * Las claves son estables (codigo INE, slug, clave): son las que viajan en
 * las URL y las que usa el motor de reglas para el territorio.
 */
import type { Ambito, Condicion, EstadoRequisito } from '@leyanimal/reglas';

export type Comunidad = {
  codigoIne: string;
  nombre: string;
  nombreOficial: string;
  slug: string;
};

export type Provincia = Comunidad & {
  /** Codigo INE de la comunidad. */
  comunidad: string;
};

export type Municipio = {
  codigoIne: string;
  nombre: string;
  nombreOficial: string;
  slug: string;
  provincia: string;
  comunidad: string;
  /** Minusculas, sin acentos, orden natural. Para buscar. */
  clave: string;
};

export type TipoNorma =
  | 'ley'
  | 'ley_organica'
  | 'real_decreto'
  | 'decreto'
  | 'orden'
  | 'ordenanza'
  | 'proyecto';

export type EstadoNorma =
  'vigente' | 'derogada' | 'pendiente_desarrollo' | 'en_tramitacion';

export type Norma = {
  slug: string;
  ambito: Ambito;
  comunidad: string | null;
  tipo: TipoNorma;
  numero: string | null;
  anio: number | null;
  titulo: string;
  tituloCorto: string | null;
  urlOficial: string;
  identificadorBoletin: string | null;
  fechaPublicacion: string | null;
  fechaEntradaVigor: string | null;
  estado: EstadoNorma;
  resumen: string | null;
  verificadaEn: string | null;
};

export type Articulo = {
  /** `${slugNorma}#${referencia}` */
  id: string;
  norma: string;
  referencia: string;
  epigrafe: string | null;
  textoLiteral: string | null;
  urlAncla: string | null;
};

export type Requisito = {
  clave: string;
  tema: string;
  titulo: string;
  descripcionCorta: string | null;
  explicacion: string | null;
  tipo: 'obligacion' | 'prohibicion' | 'tramite' | 'recomendacion';
  periodicidad: 'unica' | 'anual' | 'periodica' | 'permanente';
  plazo: string | null;
  quienLoExige: string | null;
  exigeNormaTerritorial: boolean;
  /** Posicion en los listados. */
  orden: number;
};

export type Regla = {
  id: string;
  requisito: string;
  ambito: Ambito;
  comunidad: string | null;
  provincia: string | null;
  municipio: string | null;
  condiciones: Condicion;
  estado: EstadoRequisito;
  parametros: Record<string, unknown>;
  vigenteDesde: string | null;
  vigenteHasta: string | null;
  prioridad: number;
  nota: string | null;
  verificadaEn: string | null;
};

export type Fuente = {
  regla: string;
  /** Id del articulo: `${slugNorma}#${referencia}` */
  articulo: string;
  cita: string | null;
};

export type Tema = {
  clave: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
};

export type Especie = {
  clave: string;
  nombre: string;
};

export type Raza = {
  slug: string;
  nombre: string;
  especie: string;
  /** null = no verificado, distinto de false. */
  esPppEstatal: boolean | null;
  notas: string | null;
  autonomicas: { comunidad: string; esPpp: boolean }[];
};

export type Cambio = {
  id: string;
  tipo:
    | 'nueva_norma'
    | 'modificacion'
    | 'derogacion'
    | 'entrada_en_vigor'
    | 'cambio_estado'
    | 'correccion';
  titulo: string;
  resumen: string | null;
  publicadoEn: string | null;
  ambito: Ambito | null;
  norma: string | null;
  requisito: string | null;
  comunidad: string | null;
};

/** Fundamento legal listo para mostrar: norma, articulo, cita y enlace. */
export type FuenteResuelta = {
  norma: Norma;
  articulo: Articulo;
  cita: string;
  url: string;
};
