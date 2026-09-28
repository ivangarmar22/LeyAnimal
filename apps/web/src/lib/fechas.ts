import { LOCALE, type Idioma } from '@/i18n/idiomas';

/**
 * Las fechas del contenido son dias ISO sin hora ("2026-09-04"). Se fijan a
 * mediodia UTC para que ninguna zona horaria las mueva al dia anterior, y se
 * formatean en el huso de Espana, que es el de las normas.
 */
function aFecha(iso: string) {
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`);
}

export function formatearFecha(
  fecha: string | Date,
  idioma: Idioma,
  opciones: Intl.DateTimeFormatOptions = { dateStyle: 'long' },
) {
  const valor = typeof fecha === 'string' ? aFecha(fecha) : fecha;
  return new Intl.DateTimeFormat(LOCALE[idioma], {
    timeZone: 'Europe/Madrid',
    ...opciones,
  }).format(valor);
}

/** Siempre con separador de miles: "8.132", no "8132", como se lee en Espana. */
export function formatearNumero(
  n: number,
  idioma: Idioma,
  opciones?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(LOCALE[idioma], {
    useGrouping: 'always',
    ...opciones,
  }).format(n);
}
