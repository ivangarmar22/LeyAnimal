/**
 * Estado del asistente de consulta.
 *
 * Vive en la URL: asi el enlace se puede compartir y el boton de atras del
 * navegador funciona. La lectura es tolerante: cualquiera puede escribir lo
 * que quiera en la barra de direcciones y eso no debe romper la pagina, solo
 * ignorarse. Sin librerias de validacion: esto corre en el navegador y cada
 * kilobyte cuenta.
 */

export const ESPECIES = [
  'perro',
  'gato',
  'huron',
  'ave',
  'reptil',
  'pez',
  'roedor',
  'otro',
] as const;
export type ClaveEspecie = (typeof ESPECIES)[number];

/** Especies con listado positivo ya definido en la Ley 7/2023. */
export const ESPECIES_CON_LISTADO = ['perro', 'gato', 'huron'] as const;

export const SEXOS = ['macho', 'hembra', 'desconocido'] as const;
export const USOS = [
  'compania',
  'caza',
  'pastoreo',
  'asistencia',
  'trabajo',
] as const;

/** Tri-estado: si, no, o "no lo se", que es respuesta valida. */
export const TRIESTADO = ['si', 'no', 'nose'] as const;
export type Triestado = (typeof TRIESTADO)[number];

/** 'nose' se convierte en null, que el motor trata como indeterminado. */
export function triestadoABooleano(
  valor: Triestado | undefined,
): boolean | null {
  if (valor === 'si') return true;
  if (valor === 'no') return false;
  return null;
}

export type EstadoConsulta = {
  paso: number;
  especie?: ClaveEspecie;
  municipio?: string;
  nombre?: string;
  raza?: string;
  /** Solo perros sin raza del catalogo: lo declara la persona. */
  ppp?: Triestado;
  edadAnios?: number;
  edadMeses?: number;
  sexo?: (typeof SEXOS)[number];
  esterilizado?: Triestado;
  microchip?: Triestado;
  exterior?: Triestado;
  uso?: (typeof USOS)[number];
  animalesHogar?: number;
};

const deLista = <T extends string>(
  lista: readonly T[],
  valor: string | null,
): T | undefined =>
  valor !== null && (lista as readonly string[]).includes(valor)
    ? (valor as T)
    : undefined;

const texto = (valor: string | null, max: number) =>
  valor && valor.length <= max ? valor : undefined;

function numero(valor: string | null, max: number) {
  if (!valor) return undefined;
  const n = Number(valor);
  return Number.isInteger(n) && n >= 0 && n <= max ? n : undefined;
}

/** Lee el estado de la URL, sin fallar nunca. */
export function leerConsulta(params: URLSearchParams): EstadoConsulta {
  const paso = Number(params.get('paso'));
  return {
    paso: Number.isInteger(paso) && paso >= 1 && paso <= 4 ? paso : 1,
    especie: deLista(ESPECIES, params.get('especie')),
    municipio: texto(params.get('municipio'), 80),
    nombre: texto(params.get('nombre'), 40),
    raza: texto(params.get('raza'), 80),
    ppp: deLista(TRIESTADO, params.get('ppp')),
    edadAnios: numero(params.get('edadAnios'), 40),
    edadMeses: numero(params.get('edadMeses'), 11),
    sexo: deLista(SEXOS, params.get('sexo')),
    esterilizado: deLista(TRIESTADO, params.get('esterilizado')),
    microchip: deLista(TRIESTADO, params.get('microchip')),
    exterior: deLista(TRIESTADO, params.get('exterior')),
    uso: deLista(USOS, params.get('uso')),
    animalesHogar: numero(params.get('animalesHogar'), 99),
  };
}

/** Query string con cambios aplicados, omitiendo lo vacio. */
export function aQuery(
  estado: EstadoConsulta,
  cambios: Partial<EstadoConsulta> = {},
): string {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries({ ...estado, ...cambios })) {
    if (valor === undefined || valor === '') continue;
    params.set(clave, String(valor));
  }
  return params.toString();
}

/**
 * Parametros que viajan al compartir un resultado. Es una lista explicita de
 * lo que SI viaja: el nombre del animal se queda fuera porque es lo unico del
 * formulario que podria identificar indirectamente a alguien.
 */
const COMPARTIBLES = [
  'especie',
  'municipio',
  'raza',
  'ppp',
  'edadAnios',
  'edadMeses',
  'sexo',
  'esterilizado',
  'microchip',
  'exterior',
  'uso',
  'animalesHogar',
] as const satisfies readonly (keyof EstadoConsulta)[];

export function queryCompartible(estado: EstadoConsulta): string {
  const params = new URLSearchParams({ paso: '4' });
  for (const clave of COMPARTIBLES) {
    const valor = estado[clave];
    if (valor !== undefined && valor !== '') params.set(clave, String(valor));
  }
  return params.toString();
}

/** Edad total en meses a partir de los dos campos del formulario. */
export function edadEnMeses(estado: EstadoConsulta): number | null {
  const { edadAnios, edadMeses } = estado;
  if (edadAnios === undefined && edadMeses === undefined) return null;
  return (edadAnios ?? 0) * 12 + (edadMeses ?? 0);
}

/** Hasta que paso puede avanzar la persona con lo que lleva relleno. */
export function pasoMaximoAlcanzable(estado: EstadoConsulta): number {
  if (!estado.especie) return 1;
  if (!estado.municipio) return 2;
  return 4;
}
