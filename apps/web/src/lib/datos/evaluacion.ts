/**
 * Evaluacion con el motor de reglas. Sin dependencias de la compilacion: la
 * usan las paginas y tambien la isla de la consulta en el navegador.
 */
import {
  evaluarRequisitos,
  type Ambito,
  type PerfilAnimal,
  type ReglaRequisito,
  type ResultadoRequisito,
} from '@leyanimal/reglas';
import {
  edadEnMeses,
  triestadoABooleano,
  type EstadoConsulta,
} from '@/lib/validacion/consulta';
import { comunidades } from './geografia';
import { esPpp, fuentesDe, raza, reglas, requisitos } from './normativa';
import type {
  FuenteResuelta,
  Municipio,
  Raza,
  Regla,
  Requisito,
} from './tipos';

export type { ResultadoRequisito } from '@leyanimal/reglas';

export type ObligacionEvaluada = {
  requisito: Requisito;
  resultado: ResultadoRequisito;
  /** Regla que ha ganado, si alguna. */
  regla: Regla | null;
  ambito: Ambito | null;
  /** Vacio si la regla no afirma nada (sin_datos) o si falta la fuente. */
  fuentes: FuenteResuelta[];
};

const REGLAS_MOTOR: ReglaRequisito[] = reglas().map((r) => ({
  id: r.id,
  requisitoId: r.requisito,
  ambito: r.ambito,
  comunidad: r.comunidad,
  provincia: r.provincia,
  municipio: r.municipio,
  condiciones: r.condiciones,
  estado: r.estado,
  parametros: r.parametros,
  vigenteDesde: r.vigenteDesde,
  vigenteHasta: r.vigenteHasta,
  prioridad: r.prioridad,
  notaMd: r.nota,
}));

const reglaPorId = new Map(reglas().map((r) => [r.id, r]));

/**
 * Evalua todos los requisitos para un perfil y resuelve el fundamento legal
 * de cada uno. El territorio del perfil va en codigos INE.
 */
export function evaluar(
  perfil: PerfilAnimal,
  fecha?: string,
): ObligacionEvaluada[] {
  const lista = requisitos();
  const resultados = evaluarRequisitos(
    lista.map((r) => ({
      id: r.clave,
      clave: r.clave,
      exigeNormaTerritorial: r.exigeNormaTerritorial,
    })),
    REGLAS_MOTOR,
    perfil,
    fecha ? { fecha } : {},
  );

  return resultados.map((resultado, i) => {
    const regla = resultado.reglaGanadoraId
      ? (reglaPorId.get(resultado.reglaGanadoraId) ?? null)
      : null;
    return {
      requisito: lista[i] as Requisito,
      resultado,
      regla,
      ambito: regla?.ambito ?? null,
      fuentes:
        regla && resultado.estado !== 'sin_datos' ? fuentesDe(regla.id) : [],
    };
  });
}

export type ConsultaResuelta = {
  municipio: Municipio;
  raza: Raza | null;
  perfil: PerfilAnimal;
  obligaciones: ObligacionEvaluada[];
};

/**
 * Traduce el estado del asistente a un perfil del motor y lo evalua. El
 * municipio llega ya resuelto: en el navegador sale del indice descargado.
 */
export function resolverConsulta(
  estado: EstadoConsulta,
  m: Municipio | undefined,
): ConsultaResuelta | null {
  if (!estado.especie || !m) return null;

  const r = estado.raza ? (raza(estado.raza) ?? null) : null;

  // Una raza del anexo I basta para ser PPP. Si no, decide lo que haya
  // declarado la persona (tambien lo es un perro declarado por su conducta).
  // Sin nada de eso no se afirma que no lo sea: null es "no lo sabemos".
  const razaPpp = r ? esPpp(r.slug, m.comunidad) : null;
  const declarado = triestadoABooleano(estado.ppp);
  const perfil: PerfilAnimal = {
    especie: estado.especie,
    raza: r?.slug ?? null,
    es_ppp: razaPpp === true || declarado === true ? true : declarado,
    edad_meses: edadEnMeses(estado),
    sexo: estado.sexo ?? null,
    esterilizado: triestadoABooleano(estado.esterilizado),
    tiene_microchip: triestadoABooleano(estado.microchip),
    acceso_exterior: triestadoABooleano(estado.exterior),
    uso: estado.uso ?? null,
    numero_animales_hogar: estado.animalesHogar ?? null,
    comunidad: m.comunidad,
    provincia: m.provincia,
    municipio: m.codigoIne,
  };

  return { municipio: m, raza: r, perfil, obligaciones: evaluar(perfil) };
}

/**
 * Perfil de referencia para las paginas de territorio: un animal adulto de
 * raza desconocida. Se declara que no es PPP para que la pagina hable del caso
 * general; la licencia PPP tiene su propia seccion y su propia pagina.
 */
function perfilDeReferencia(
  territorio: { comunidad: string; provincia?: string; municipio?: string },
  especie: 'perro' | 'gato',
): PerfilAnimal {
  return {
    especie,
    edad_meses: 36,
    es_ppp: false,
    comunidad: territorio.comunidad,
    provincia: territorio.provincia ?? null,
    municipio: territorio.municipio ?? null,
  };
}

/** Obligaciones de referencia de un territorio, sin las que no aplican. */
export function obligacionesDeReferencia(
  territorio: { comunidad: string; provincia?: string; municipio?: string },
  especie: 'perro' | 'gato',
) {
  return evaluar(perfilDeReferencia(territorio, especie)).filter(
    (o) => o.resultado.estado !== 'no_aplica',
  );
}

/** Especie a la que se refiere cada requisito, para las tablas por comunidad. */
function especieDeRequisito(clave: string): 'perro' | 'gato' {
  return clave === 'microchip_esterilizacion_gatos' ? 'gato' : 'perro';
}

/**
 * Como queda un requisito en cada comunidad para un animal adulto de
 * referencia. La licencia PPP se evalua para un perro PPP: para cualquier
 * otro no aplicaria y la tabla no diria nada.
 */
export function requisitoPorComunidad(clave: string) {
  const especie = especieDeRequisito(clave);
  return comunidades().map((c) => {
    const perfil: PerfilAnimal = {
      ...perfilDeReferencia({ comunidad: c.codigoIne }, especie),
      es_ppp: clave === 'licencia_ppp',
    };
    const obligacion =
      evaluar(perfil).find((o) => o.requisito.clave === clave) ?? null;
    return { comunidad: c, obligacion };
  });
}
