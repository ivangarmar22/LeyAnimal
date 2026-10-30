import type {
  Condicion,
  OperadorCondicion,
  PerfilAnimal,
  Veredicto,
} from './tipos';

/**
 * Evaluacion de condiciones con logica de tres valores.
 *
 * El asistente admite "no lo se" como respuesta valida. Si un campo
 * desconocido se tratara como false, generariamos falsos negativos: le
 * diriamos a alguien que una obligacion no le aplica cuando en realidad no
 * sabemos si le aplica. Por eso un campo desconocido devuelve
 * 'indeterminado', que mas adelante se convierte en 'sin_datos'.
 */

function desconocido(valor: unknown): boolean {
  return valor === null || valor === undefined;
}

/** AND de tres valores: basta un 'no' para que sea 'no'. */
function conjuncion(veredictos: readonly Veredicto[]): Veredicto {
  if (veredictos.some((v) => v === 'no')) return 'no';
  if (veredictos.some((v) => v === 'indeterminado')) return 'indeterminado';
  return 'si';
}

/** OR de tres valores: basta un 'si' para que sea 'si'. */
function disyuncion(veredictos: readonly Veredicto[]): Veredicto {
  if (veredictos.some((v) => v === 'si')) return 'si';
  if (veredictos.some((v) => v === 'indeterminado')) return 'indeterminado';
  return 'no';
}

function negacion(veredicto: Veredicto): Veredicto {
  if (veredicto === 'si') return 'no';
  if (veredicto === 'no') return 'si';
  return 'indeterminado';
}

function comoBooleano(condicion: boolean): Veredicto {
  return condicion ? 'si' : 'no';
}

/** Comparaciones numericas: solo tienen sentido sobre numeros. */
function compararNumeros(
  op: 'lt' | 'lte' | 'gt' | 'gte',
  izquierda: unknown,
  derecha: unknown,
): Veredicto {
  if (typeof izquierda !== 'number' || typeof derecha !== 'number') {
    return 'indeterminado';
  }
  switch (op) {
    case 'lt':
      return comoBooleano(izquierda < derecha);
    case 'lte':
      return comoBooleano(izquierda <= derecha);
    case 'gt':
      return comoBooleano(izquierda > derecha);
    case 'gte':
      return comoBooleano(izquierda >= derecha);
  }
}

function aplicarOperador(
  op: OperadorCondicion,
  valorDelAnimal: unknown,
  valorDeLaRegla: unknown,
): Veredicto {
  // 'existe' es la unica operacion que sabe responder sobre lo desconocido:
  // preguntar si un dato esta relleno siempre tiene respuesta.
  if (op === 'existe') {
    const esperado =
      valorDeLaRegla === undefined ? true : valorDeLaRegla === true;
    return comoBooleano(!desconocido(valorDelAnimal) === esperado);
  }

  if (desconocido(valorDelAnimal)) return 'indeterminado';

  switch (op) {
    case 'eq':
      return comoBooleano(valorDelAnimal === valorDeLaRegla);
    case 'neq':
      return comoBooleano(valorDelAnimal !== valorDeLaRegla);
    case 'in':
      return Array.isArray(valorDeLaRegla)
        ? comoBooleano(valorDeLaRegla.includes(valorDelAnimal))
        : 'indeterminado';
    case 'nin':
      return Array.isArray(valorDeLaRegla)
        ? comoBooleano(!valorDeLaRegla.includes(valorDelAnimal))
        : 'indeterminado';
    case 'lt':
    case 'lte':
    case 'gt':
    case 'gte':
      return compararNumeros(op, valorDelAnimal, valorDeLaRegla);
  }
}

/**
 * Evalua un arbol de condiciones contra el perfil de un animal.
 *
 * Un `all` vacio es 'si' (no impone nada) y un `any` vacio es 'no' (no ofrece
 * ninguna alternativa que cumplir), que es el comportamiento neutro habitual.
 */
export function evaluarCondicion(
  condicion: Condicion,
  perfil: PerfilAnimal,
): Veredicto {
  if ('all' in condicion) {
    return conjuncion(condicion.all.map((c) => evaluarCondicion(c, perfil)));
  }
  if ('any' in condicion) {
    return disyuncion(condicion.any.map((c) => evaluarCondicion(c, perfil)));
  }
  if ('not' in condicion) {
    return negacion(evaluarCondicion(condicion.not, perfil));
  }
  return aplicarOperador(
    condicion.op,
    perfil[condicion.campo],
    condicion.valor,
  );
}

/** Lista los campos que la condicion consulta. Util para el panel de admin. */
export function camposUsados(condicion: Condicion): string[] {
  if ('all' in condicion) return condicion.all.flatMap(camposUsados);
  if ('any' in condicion) return condicion.any.flatMap(camposUsados);
  if ('not' in condicion) return camposUsados(condicion.not);
  return [condicion.campo];
}
