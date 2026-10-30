/**
 * Normalizacion y puntuacion de busqueda, sin dependencias.
 *
 * Tolera acentos ("malaga" encuentra "Malaga") y erratas ("zaragosa"
 * encuentra "Zaragoza") comparando los trios de letras (trigramas) que
 * comparten las dos palabras.
 */

export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function trigramas(texto: string): Set<string> {
  const conBordes = `  ${texto} `;
  const resultado = new Set<string>();
  for (let i = 0; i < conBordes.length - 2; i += 1) {
    resultado.add(conBordes.slice(i, i + 3));
  }
  return resultado;
}

/** Similitud de Jaccard entre dos conjuntos de trigramas (0 a 1). */
function similitud(a: Set<string>, b: Set<string>): number {
  let comunes = 0;
  for (const t of a) if (b.has(t)) comunes += 1;
  const union = a.size + b.size - comunes;
  return union === 0 ? 0 : comunes / union;
}

/**
 * Puntua una clave normalizada frente a un termino normalizado.
 * Devuelve 0 si no hay coincidencia razonable.
 *
 * Orden: coincidencia exacta, empieza igual, alguna palabra empieza igual,
 * contiene el termino y, por ultimo, parecido por trigramas (erratas).
 */
export function puntuar(
  clave: string,
  termino: string,
  trigramasClave: () => Set<string>,
  trigramasTermino: Set<string>,
): number {
  if (clave === termino) return 100;
  if (clave.startsWith(termino)) return 80;
  if (clave.split(' ').some((palabra) => palabra.startsWith(termino)))
    return 65;
  if (clave.includes(termino)) return 50;
  if (termino.length < 3) return 0;

  const parecido = similitud(trigramasClave(), trigramasTermino);
  return parecido >= 0.32 ? Math.round(parecido * 45) : 0;
}
