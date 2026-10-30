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
  opciones: Intl.DateTimeFormatOptions = { dateStyle: 'long' },
) {
  const valor = typeof fecha === 'string' ? aFecha(fecha) : fecha;
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    ...opciones,
  }).format(valor);
}

/** Siempre con separador de miles: "8.132", no "8132", como se lee en Espana. */
export function formatearNumero(
  n: number,
  opciones?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat('es-ES', {
    useGrouping: 'always',
    ...opciones,
  }).format(n);
}

/** Importe en euros: "175.000 €", "150.253,03 €"; sin decimales si son cero. */
export function formatearEuros(n: number) {
  const decimales = Number.isInteger(n) ? 0 : 2;
  return formatearNumero(n, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}
