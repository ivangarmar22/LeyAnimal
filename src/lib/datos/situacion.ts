import { normasDeComunidad, reglasDeComunidad } from './normativa';

/**
 * Situacion normativa de una comunidad, para decirla con honestidad:
 * - 'reglas': su ley le añade obligaciones verificadas.
 * - 'remite': tiene ley vigente, pero en seguro, identificacion y censo no
 *   añade nada a la estatal (Madrid tras la Ley 7/2024, D54).
 * - 'sinLey': su unica ley esta derogada sin sustituir (La Rioja, D32).
 * - 'ordenanzas': sin potestad legislativa, regula por reglamento u
 *   ordenanza de la propia ciudad (Ceuta y Melilla, D34).
 */
export function situacionComunidad(codigoComunidad: string) {
  const propias = normasDeComunidad(codigoComunidad);
  const reglas = reglasDeComunidad(codigoComunidad).length;
  // Cuenta la ley general de proteccion animal, no las demas normas propias
  // (perros peligrosos, perros de asistencia, decretos...).
  const generales = propias.filter((n) => n.slug.startsWith('ley-animales-'));
  const tipo: 'reglas' | 'remite' | 'sinLey' | 'ordenanzas' =
    generales.length === 0
      ? 'ordenanzas'
      : generales.every((n) => n.estado === 'derogada')
        ? 'sinLey'
        : reglas === 0
          ? 'remite'
          : 'reglas';
  return { tipo, normas: propias, reglas };
}
