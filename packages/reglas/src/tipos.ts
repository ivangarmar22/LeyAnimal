/**
 * Tipos del motor de reglas.
 *
 * TypeScript puro, sin dependencias y sin acoplamiento al framework de la
 * web: este paquete se reutiliza tal cual en la futura app movil.
 */

export type CampoAnimal =
  | 'especie'
  | 'raza'
  | 'es_ppp'
  | 'edad_meses'
  | 'sexo'
  | 'esterilizado'
  | 'tiene_microchip'
  | 'acceso_exterior'
  | 'uso'
  | 'convive_con_menores'
  | 'numero_animales_hogar'
  | 'comunidad'
  | 'provincia'
  | 'municipio';

export type OperadorCondicion =
  'eq' | 'neq' | 'in' | 'nin' | 'lt' | 'lte' | 'gt' | 'gte' | 'existe';

export type Condicion =
  | { all: Condicion[] }
  | { any: Condicion[] }
  | { not: Condicion }
  | { campo: CampoAnimal; op: OperadorCondicion; valor?: unknown };

/** Ambito territorial que impone una regla, de menor a mayor especificidad. */
export type Ambito = 'estatal' | 'autonomico' | 'provincial' | 'municipal';

export const ESPECIFICIDAD: Record<Ambito, number> = {
  estatal: 0,
  autonomico: 1,
  provincial: 2,
  municipal: 3,
};

export type EstadoRequisito =
  | 'obligatorio'
  | 'obligatorio_pendiente_reglamento'
  | 'recomendado'
  | 'no_aplica'
  | 'sin_datos';

/**
 * Restrictividad, de mayor a menor. A igual especificidad territorial gana el
 * estado mas restrictivo. 'sin_datos' queda fuera: no es una afirmacion, es la
 * ausencia de una, y se decide por otra via.
 */
export const RESTRICTIVIDAD: Record<
  Exclude<EstadoRequisito, 'sin_datos'>,
  number
> = {
  obligatorio: 3,
  obligatorio_pendiente_reglamento: 2,
  recomendado: 1,
  no_aplica: 0,
};

/**
 * Perfil del animal sobre el que se evaluan las condiciones.
 *
 * `null` significa "no lo se", que es una respuesta valida del asistente y NO
 * equivale a false. Un campo desconocido vuelve indeterminada la condicion que
 * lo use, lo que acaba produciendo 'sin_datos' en lugar de un falso negativo.
 */
export type PerfilAnimal = {
  especie: string;
  raza?: string | null;
  es_ppp?: boolean | null;
  edad_meses?: number | null;
  sexo?: string | null;
  esterilizado?: boolean | null;
  tiene_microchip?: boolean | null;
  acceso_exterior?: boolean | null;
  uso?: string | null;
  convive_con_menores?: boolean | null;
  numero_animales_hogar?: number | null;
  /** Codigos o identificadores de territorio. */
  comunidad?: string | null;
  provincia?: string | null;
  municipio?: string | null;
};

/** Logica de tres valores: verdadero, falso o "no se puede saber". */
export type Veredicto = 'si' | 'no' | 'indeterminado';

export type ReglaRequisito = {
  id: string;
  requisitoId: string;
  ambito: Ambito;
  /** Territorio al que se aplica la regla. Debe casar con su ambito. */
  comunidad?: string | null;
  provincia?: string | null;
  municipio?: string | null;
  condiciones: Condicion;
  estado: EstadoRequisito;
  parametros?: Record<string, unknown>;
  /** Fechas ISO (YYYY-MM-DD). Se comparan como texto, que en ISO es correcto. */
  vigenteDesde?: string | null;
  vigenteHasta?: string | null;
  prioridad?: number;
  notaMd?: string | null;
};

export type Requisito = {
  id: string;
  clave: string;
  /**
   * True cuando el requisito no se puede afirmar solo con norma estatal, sino
   * que depende de lo que diga la comunidad o el ayuntamiento (por ejemplo el
   * censo municipal). Si no hay regla territorial aplicable, el resultado es
   * 'sin_datos', nunca 'no_aplica'.
   */
  exigeNormaTerritorial?: boolean;
};

export type MotivoDescarte =
  | 'condiciones_no_cumplidas'
  | 'condiciones_indeterminadas'
  | 'fuera_de_vigencia'
  | 'territorio_distinto'
  | 'menos_especifica'
  | 'menos_restrictiva'
  | 'menor_prioridad'
  | 'vigencia_mas_antigua';

export type PasoTraza = {
  reglaId: string;
  ambito: Ambito;
  estado: EstadoRequisito;
  resultado: 'ganadora' | 'candidata' | 'descartada';
  motivo: MotivoDescarte | 'aplica' | 'gana';
  /** Explicacion legible, para el desplegable "¿Por que me sale esto?". */
  explicacion: string;
};

export type ResultadoRequisito = {
  requisitoId: string;
  estado: EstadoRequisito;
  reglaGanadoraId: string | null;
  parametros: Record<string, unknown>;
  /**
   * True si alguna regla no se pudo evaluar por datos que el usuario
   * desconoce. La interfaz lo usa para explicar que falta un dato suyo, no
   * nuestro.
   */
  faltanDatosDelUsuario: boolean;
  traza: PasoTraza[];
};

export type OpcionesEvaluacion = {
  /** Fecha de la consulta, en ISO (YYYY-MM-DD). Por defecto, hoy. */
  fecha?: string;
};
