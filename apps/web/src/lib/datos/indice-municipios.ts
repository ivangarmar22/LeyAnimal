/**
 * Indice de municipios, comun a la compilacion y al navegador.
 *
 * El fichero de municipios son tuplas [codigoIne, nombre, slug, nombreOficial?]
 * (DECISIONES.md, D40): con objetos pesaria el triple. Aqui se reconstruyen
 * los municipios y se busca con tolerancia a acentos y erratas.
 */
import { comunidadDeProvincia } from './geografia';
import { normalizar, puntuar, trigramas } from './busqueda';
import type { Municipio } from './tipos';

export type TuplaMunicipio = [string, string, string, string?];

export function desdeTuplas(tuplas: readonly TuplaMunicipio[]): Municipio[] {
  return tuplas.map(([codigoIne, nombre, slug, nombreOficial]) => {
    const provincia = codigoIne.slice(0, 2);
    return {
      codigoIne,
      nombre,
      nombreOficial: nombreOficial ?? nombre,
      slug,
      provincia,
      comunidad: comunidadDeProvincia(provincia),
      clave: normalizar(nombre),
    };
  });
}

/**
 * Capitales cuyo nombre no coincide con el de su provincia. El resto se
 * resuelven por nombre. Los codigos estan comprobados contra el INE.
 */
const CAPITALES_EXCEPCIONES: Record<string, string> = {
  '01': '01059', // Vitoria-Gasteiz
  '03': '03014', // Alacant/Alicante
  '07': '07040', // Palma
  '12': '12040', // Castello de la Plana
  '20': '20069', // Donostia/San Sebastian
  '26': '26089', // Logrono
  '31': '31201', // Pamplona/Iruna
  '33': '33044', // Oviedo
  '35': '35016', // Las Palmas de Gran Canaria
  '39': '39075', // Santander
  '46': '46250', // Valencia
  '48': '48020', // Bilbao
};

export function crearIndice(
  municipios: readonly Municipio[],
  nombresProvincia: Map<string, string>,
) {
  const porSlug = new Map(municipios.map((m) => [m.slug, m]));
  const porCodigo = new Map(municipios.map((m) => [m.codigoIne, m]));

  const capitales = new Map<string, Municipio>();
  for (const [codigo, nombre] of nombresProvincia) {
    const excepcion = CAPITALES_EXCEPCIONES[codigo];
    const capital = excepcion
      ? porCodigo.get(excepcion)
      : municipios.find(
          (m) => m.provincia === codigo && m.clave === normalizar(nombre),
        );
    if (capital) capitales.set(codigo, capital);
  }
  const esCapital = new Set([...capitales.values()].map((m) => m.codigoIne));
  const cacheTrigramas = new Map<string, Set<string>>();

  /**
   * A igual puntuacion van primero las capitales y despues los nombres mas
   * cortos, que suelen ser los que se buscan ("Malaga" antes que "Velez-Malaga").
   */
  function buscar(termino: string, limite = 8): Municipio[] {
    const t = normalizar(termino);
    if (t.length < 2) return [];
    const trigramasTermino = trigramas(t);
    const puntuados: { m: Municipio; puntos: number }[] = [];
    for (const m of municipios) {
      const puntos = puntuar(
        m.clave,
        t,
        () => {
          let cache = cacheTrigramas.get(m.codigoIne);
          if (!cache) {
            cache = trigramas(m.clave);
            cacheTrigramas.set(m.codigoIne, cache);
          }
          return cache;
        },
        trigramasTermino,
      );
      if (puntos > 0)
        puntuados.push({
          m,
          puntos: puntos + (esCapital.has(m.codigoIne) ? 8 : 0),
        });
    }
    return puntuados
      .sort(
        (a, b) =>
          b.puntos - a.puntos ||
          a.m.nombre.length - b.m.nombre.length ||
          a.m.nombre.localeCompare(b.m.nombre, 'es'),
      )
      .slice(0, limite)
      .map(({ m }) => m);
  }

  return {
    municipio: (slugOCodigo: string) =>
      porSlug.get(slugOCodigo) ?? porCodigo.get(slugOCodigo),
    capitalDe: (codigoProvincia: string) =>
      capitales.get(codigoProvincia) ?? null,
    capitales: () => [...capitales.values()],
    esCapital: (codigoIne: string) => esCapital.has(codigoIne),
    buscar,
  };
}
