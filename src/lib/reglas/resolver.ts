import { evaluarCondicion } from './condiciones';
import {
  ESPECIFICIDAD,
  RESTRICTIVIDAD,
  type Ambito,
  type EstadoRequisito,
  type OpcionesEvaluacion,
  type PasoTraza,
  type PerfilAnimal,
  type ReglaRequisito,
  type Requisito,
  type ResultadoRequisito,
  type Veredicto,
} from './tipos';

/**
 * Resolucion de conflictos entre reglas. El orden se explica tambien en
 * /metodologia:
 *
 *   1. Se filtran las reglas cuyas condiciones se cumplen y estan vigentes en
 *      la fecha de consulta, y cuyo territorio coincide con el del animal.
 *   2. Especificidad territorial: municipal > provincial > autonomico > estatal.
 *   3. A igual especificidad gana la mas restrictiva.
 *   4. Desempate por prioridad descendente y vigente_desde mas reciente.
 *   5. Si el requisito depende de norma territorial y no hay ninguna aplicable,
 *      el resultado es 'sin_datos', nunca 'no_aplica'.
 *
 * A eso se anade una regla propia, que es la que evita los falsos negativos:
 * una regla que no se ha podido evaluar por datos que el usuario desconoce
 * invalida el resultado SOLO si, de haberse cumplido, habria ganado.
 */

function hoyEnIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Las fechas van en ISO (YYYY-MM-DD), donde comparar como texto es correcto. */
function estaVigente(regla: ReglaRequisito, fecha: string): boolean {
  if (regla.vigenteDesde && fecha < regla.vigenteDesde) return false;
  if (regla.vigenteHasta && fecha > regla.vigenteHasta) return false;
  return true;
}

/**
 * Comprueba que la regla habla del territorio del animal.
 * Devuelve 'indeterminado' cuando el perfil no dice donde vive: no podemos
 * afirmar que la regla no le afecta.
 */
function cubreElTerritorio(
  regla: ReglaRequisito,
  perfil: PerfilAnimal,
): Veredicto {
  const pares: Record<
    Ambito,
    [string | null | undefined, string | null | undefined]
  > = {
    estatal: [null, null],
    autonomico: [regla.comunidad, perfil.comunidad],
    provincial: [regla.provincia, perfil.provincia],
    municipal: [regla.municipio, perfil.municipio],
  };

  if (regla.ambito === 'estatal') return 'si';

  // Una regla de otra comunidad o provincia no aplica aunque no sepamos el
  // municipio: el reglamento de Ceuta no afecta a nadie de Baleares.
  const contenedores: [string | null | undefined, string | null | undefined][] =
    regla.ambito === 'municipal'
      ? [
          [regla.comunidad, perfil.comunidad],
          [regla.provincia, perfil.provincia],
        ]
      : regla.ambito === 'provincial'
        ? [[regla.comunidad, perfil.comunidad]]
        : [];
  for (const [deLaRegla, delAnimal] of contenedores) {
    if (deLaRegla && delAnimal && deLaRegla !== delAnimal) return 'no';
  }

  const [deLaRegla, delAnimal] = pares[regla.ambito];
  if (deLaRegla === null || deLaRegla === undefined) return 'no';
  if (delAnimal === null || delAnimal === undefined) return 'indeterminado';
  return deLaRegla === delAnimal ? 'si' : 'no';
}

function restrictividadDe(estado: EstadoRequisito): number {
  // 'sin_datos' no es una afirmacion, asi que nunca gana por restrictividad.
  return estado === 'sin_datos' ? -1 : RESTRICTIVIDAD[estado];
}

/** Devuelve > 0 si `a` gana a `b`, < 0 si pierde, 0 si empatan del todo. */
function comparar(a: ReglaRequisito, b: ReglaRequisito): number {
  const porEspecificidad = ESPECIFICIDAD[a.ambito] - ESPECIFICIDAD[b.ambito];
  if (porEspecificidad !== 0) return porEspecificidad;

  const porRestrictividad =
    restrictividadDe(a.estado) - restrictividadDe(b.estado);
  if (porRestrictividad !== 0) return porRestrictividad;

  const porPrioridad = (a.prioridad ?? 0) - (b.prioridad ?? 0);
  if (porPrioridad !== 0) return porPrioridad;

  const desdeA = a.vigenteDesde ?? '';
  const desdeB = b.vigenteDesde ?? '';
  if (desdeA !== desdeB) return desdeA > desdeB ? 1 : -1;

  return 0;
}

function motivoDeDerrota(perdedora: ReglaRequisito, ganadora: ReglaRequisito) {
  if (ESPECIFICIDAD[perdedora.ambito] !== ESPECIFICIDAD[ganadora.ambito]) {
    return {
      motivo: 'menos_especifica' as const,
      explicacion: `Gana la regla ${ganadora.ambito}, que es mas especifica que la ${perdedora.ambito}.`,
    };
  }
  if (
    restrictividadDe(perdedora.estado) !== restrictividadDe(ganadora.estado)
  ) {
    return {
      motivo: 'menos_restrictiva' as const,
      explicacion: `A igual ambito gana la mas restrictiva: "${ganadora.estado}" sobre "${perdedora.estado}".`,
    };
  }
  if ((perdedora.prioridad ?? 0) !== (ganadora.prioridad ?? 0)) {
    return {
      motivo: 'menor_prioridad' as const,
      explicacion: `Empate de ambito y estado: gana la de mayor prioridad (${ganadora.prioridad ?? 0}).`,
    };
  }
  return {
    motivo: 'vigencia_mas_antigua' as const,
    explicacion: `Empate total: gana la de vigencia mas reciente (${ganadora.vigenteDesde ?? 'sin fecha'}).`,
  };
}

export function evaluarRequisito(
  requisito: Requisito,
  reglas: readonly ReglaRequisito[],
  perfil: PerfilAnimal,
  opciones: OpcionesEvaluacion = {},
): ResultadoRequisito {
  const fecha = opciones.fecha ?? hoyEnIso();
  const traza: PasoTraza[] = [];

  const propias = reglas.filter((r) => r.requisitoId === requisito.id);

  const aplicables: ReglaRequisito[] = [];
  const indeterminadas: ReglaRequisito[] = [];
  // Reglas que si se pudieron evaluar y dijeron que no. Distinguirlas de las
  // indeterminadas es lo que permite responder "no aplica" en vez de
  // "no lo sabemos".
  const descartadasPorCondiciones: ReglaRequisito[] = [];

  for (const regla of propias) {
    if (!estaVigente(regla, fecha)) {
      traza.push({
        reglaId: regla.id,
        ambito: regla.ambito,
        estado: regla.estado,
        resultado: 'descartada',
        motivo: 'fuera_de_vigencia',
        explicacion: `No esta vigente el ${fecha} (del ${regla.vigenteDesde ?? 'siempre'} al ${regla.vigenteHasta ?? 'sin fin'}).`,
      });
      continue;
    }

    const territorio = cubreElTerritorio(regla, perfil);
    if (territorio === 'no') {
      traza.push({
        reglaId: regla.id,
        ambito: regla.ambito,
        estado: regla.estado,
        resultado: 'descartada',
        motivo: 'territorio_distinto',
        explicacion: 'La regla es de otro territorio.',
      });
      continue;
    }

    const condiciones = evaluarCondicion(regla.condiciones, perfil);
    const veredicto: Veredicto =
      territorio === 'indeterminado' || condiciones === 'indeterminado'
        ? condiciones === 'no'
          ? 'no'
          : 'indeterminado'
        : condiciones;

    if (veredicto === 'no') {
      // La regla estaba en juego (vigente y del territorio correcto) y sus
      // condiciones han dicho que no. Eso no es desconocimiento: es saber que
      // no le aplica.
      descartadasPorCondiciones.push(regla);
      traza.push({
        reglaId: regla.id,
        ambito: regla.ambito,
        estado: regla.estado,
        resultado: 'descartada',
        motivo: 'condiciones_no_cumplidas',
        explicacion:
          'Las condiciones de la regla no se cumplen para este animal.',
      });
      continue;
    }

    if (veredicto === 'indeterminado') {
      indeterminadas.push(regla);
      traza.push({
        reglaId: regla.id,
        ambito: regla.ambito,
        estado: regla.estado,
        resultado: 'descartada',
        motivo: 'condiciones_indeterminadas',
        explicacion:
          'No se ha podido evaluar porque falta algun dato del animal que has marcado como desconocido.',
      });
      continue;
    }

    aplicables.push(regla);
    traza.push({
      reglaId: regla.id,
      ambito: regla.ambito,
      estado: regla.estado,
      resultado: 'candidata',
      motivo: 'aplica',
      explicacion:
        'Vigente, del territorio correcto y con las condiciones cumplidas.',
    });
  }

  // --- Regla 5: el requisito depende de norma territorial y no la hay -------
  const hayTerritorial = aplicables.some((r) => r.ambito !== 'estatal');
  if (requisito.exigeNormaTerritorial && !hayTerritorial) {
    return {
      requisitoId: requisito.id,
      estado: 'sin_datos',
      reglaGanadoraId: null,
      parametros: {},
      faltanDatosDelUsuario: indeterminadas.length > 0,
      traza: [
        ...traza,
        {
          reglaId: '',
          ambito: 'estatal',
          estado: 'sin_datos',
          resultado: 'ganadora',
          motivo: 'gana',
          explicacion:
            'Este requisito depende de lo que diga tu comunidad o tu ayuntamiento, y todavia no lo hemos verificado para tu municipio.',
        },
      ],
    };
  }

  if (aplicables.length === 0) {
    // Si alguna regla se pudo evaluar del todo y dijo que no, y no queda
    // ninguna duda pendiente, entonces SI lo sabemos: no le aplica. Un perro
    // no necesita que le digamos "no sabemos" sobre una obligacion de gatos.
    const sabemosQueNoAplica =
      indeterminadas.length === 0 && descartadasPorCondiciones.length > 0;

    if (sabemosQueNoAplica) {
      return {
        requisitoId: requisito.id,
        estado: 'no_aplica',
        reglaGanadoraId: null,
        parametros: {},
        faltanDatosDelUsuario: false,
        traza: [
          ...traza,
          {
            reglaId: '',
            ambito: 'estatal',
            estado: 'no_aplica',
            resultado: 'ganadora',
            motivo: 'gana',
            explicacion:
              'Existen reglas para este requisito, se han podido evaluar todas y ninguna te afecta segun los datos que has dado.',
          },
        ],
      };
    }

    return {
      requisitoId: requisito.id,
      estado: 'sin_datos',
      reglaGanadoraId: null,
      parametros: {},
      faltanDatosDelUsuario: indeterminadas.length > 0,
      traza: [
        ...traza,
        {
          reglaId: '',
          ambito: 'estatal',
          estado: 'sin_datos',
          resultado: 'ganadora',
          motivo: 'gana',
          explicacion:
            indeterminadas.length > 0
              ? 'Ninguna regla se ha podido evaluar con los datos disponibles.'
              : 'No hay ninguna regla aplicable verificada para este caso.',
        },
      ],
    };
  }

  // --- Reglas 2 a 4: se elige la ganadora ---------------------------------
  let ganadora = aplicables[0] as ReglaRequisito;
  for (const candidata of aplicables.slice(1)) {
    if (comparar(candidata, ganadora) > 0) ganadora = candidata;
  }

  // --- Una indeterminada solo importa si habria ganado ---------------------
  const dudaRelevante = indeterminadas.find((r) => comparar(r, ganadora) > 0);
  if (dudaRelevante) {
    return {
      requisitoId: requisito.id,
      estado: 'sin_datos',
      reglaGanadoraId: null,
      parametros: {},
      faltanDatosDelUsuario: true,
      traza: [
        ...traza,
        {
          reglaId: dudaRelevante.id,
          ambito: dudaRelevante.ambito,
          estado: dudaRelevante.estado,
          resultado: 'ganadora',
          motivo: 'gana',
          explicacion:
            'Hay una regla que te afectaria por delante de las demas, pero no podemos evaluarla sin un dato que has marcado como desconocido. Preferimos decir que no lo sabemos antes que darte por buena una respuesta que podria ser falsa.',
        },
      ],
    };
  }

  for (const paso of traza) {
    if (paso.resultado !== 'candidata') continue;
    if (paso.reglaId === ganadora.id) {
      paso.resultado = 'ganadora';
      paso.motivo = 'gana';
      paso.explicacion = `Es la regla que prevalece: ambito ${ganadora.ambito}, estado "${ganadora.estado}".`;
      continue;
    }
    const perdedora = aplicables.find((r) => r.id === paso.reglaId);
    if (!perdedora) continue;
    const { motivo, explicacion } = motivoDeDerrota(perdedora, ganadora);
    paso.resultado = 'descartada';
    paso.motivo = motivo;
    paso.explicacion = explicacion;
  }

  return {
    requisitoId: requisito.id,
    estado: ganadora.estado,
    reglaGanadoraId: ganadora.id,
    parametros: ganadora.parametros ?? {},
    faltanDatosDelUsuario: indeterminadas.length > 0,
    traza,
  };
}

/** Evalua varios requisitos de una vez, conservando el orden recibido. */
export function evaluarRequisitos(
  requisitos: readonly Requisito[],
  reglas: readonly ReglaRequisito[],
  perfil: PerfilAnimal,
  opciones: OpcionesEvaluacion = {},
): ResultadoRequisito[] {
  return requisitos.map((r) => evaluarRequisito(r, reglas, perfil, opciones));
}
