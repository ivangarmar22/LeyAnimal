/**
 * Formateador de mensajes con el subconjunto de ICU MessageFormat que usan
 * los catalogos, y nada mas:
 *
 *   {variable}
 *   {n, number}
 *   {n, plural, =0 {…} one {# …} other {# …}}   (# = el numero formateado)
 *
 * Los plurales se resuelven con Intl.PluralRules, asi que "one"/"other"
 * siguen las reglas reales de cada idioma. Las ramas pueden contener a su vez
 * variables. No se implementa el escape con apostrofos de ICU: ningun mensaje
 * contiene llaves literales, y asi "Luna's" o "don't" no necesitan escaparse.
 */
export type Valores = Record<string, string | number>;

/** Posicion de la llave que cierra la que abre en `desde`. */
function cierre(texto: string, desde: number): number {
  let nivel = 0;
  for (let i = desde; i < texto.length; i++) {
    if (texto[i] === '{') nivel++;
    else if (texto[i] === '}' && --nivel === 0) return i;
  }
  throw new Error(`Llave sin cerrar en el mensaje: ${texto}`);
}

/** "=0 {a} one {b} other {c}" -> { '=0': 'a', one: 'b', other: 'c' } */
function ramas(texto: string): Record<string, string> {
  const resultado: Record<string, string> = {};
  let i = 0;
  while (i < texto.length) {
    const inicio = texto.indexOf('{', i);
    if (inicio === -1) break;
    const selector = texto.slice(i, inicio).trim();
    const fin = cierre(texto, inicio);
    resultado[selector] = texto.slice(inicio + 1, fin);
    i = fin + 1;
  }
  return resultado;
}

/** Sustituye los # del nivel superior de una rama (no los de ramas anidadas). */
function sustituirAlmohadilla(texto: string, numero: string): string {
  let nivel = 0;
  let salida = '';
  for (const c of texto) {
    if (c === '{') nivel++;
    if (c === '}') nivel--;
    salida += c === '#' && nivel === 0 ? numero : c;
  }
  return salida;
}

export function formatear(
  mensaje: string,
  valores: Valores = {},
  locale = 'es-ES',
): string {
  let salida = '';
  let i = 0;
  while (i < mensaje.length) {
    const inicio = mensaje.indexOf('{', i);
    if (inicio === -1) {
      salida += mensaje.slice(i);
      break;
    }
    salida += mensaje.slice(i, inicio);
    const fin = cierre(mensaje, inicio);
    const cuerpo = mensaje.slice(inicio + 1, fin);
    const [nombre = '', tipo, ...resto] = cuerpo.split(',');
    const clave = nombre.trim();
    const valor = valores[clave];
    if (valor === undefined)
      throw new Error(`Falta el valor "${clave}" para: ${mensaje}`);

    const formato = tipo?.trim();
    if (formato === 'number') {
      salida += new Intl.NumberFormat(locale, { useGrouping: 'always' }).format(
        Number(valor),
      );
    } else if (formato === 'plural') {
      const n = Number(valor);
      const opciones = ramas(resto.join(','));
      const categoria = new Intl.PluralRules(locale).select(n);
      const rama =
        opciones[`=${n}`] ?? opciones[categoria] ?? opciones.other ?? '';
      const numero = new Intl.NumberFormat(locale, {
        useGrouping: 'always',
      }).format(n);
      salida += formatear(sustituirAlmohadilla(rama, numero), valores, locale);
    } else {
      salida += String(valor);
    }
    i = fin + 1;
  }
  return salida;
}
