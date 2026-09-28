import { normasDeComunidad, reglasDeComunidad } from './normativa';

/**
 * Situacion normativa de una comunidad, para decirla con honestidad:
 * - 'reglas': tiene obligaciones verificadas.
 * - 'pendiente': tiene ley vigente cuyo articulado aun no hemos curado (D38).
 * - 'sinLey': su unica ley esta derogada sin sustituir (La Rioja, D32).
 * - 'ordenanzas': sin potestad legislativa, regula por ordenanzas (Ceuta y
 *   Melilla, D34).
 */
export function situacionComunidad(codigoComunidad: string) {
  const propias = normasDeComunidad(codigoComunidad);
  const reglas = reglasDeComunidad(codigoComunidad).length;
  const tipo: 'reglas' | 'pendiente' | 'sinLey' | 'ordenanzas' =
    propias.length === 0
      ? 'ordenanzas'
      : propias.every((n) => n.estado === 'derogada')
        ? 'sinLey'
        : reglas === 0
          ? 'pendiente'
          : 'reglas';
  return { tipo, normas: propias, reglas };
}
