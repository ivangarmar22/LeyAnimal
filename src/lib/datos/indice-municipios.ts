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

/**
 * Nombres en castellano de uso comun para municipios cuyo nombre oficial esta
 * en otra lengua y no se parece lo bastante para encontrarlo por erratas.
 */
const ALIAS: Record<string, string[]> = {
  '01059': ['Vitoria'],
  '03047': ['Calpe'],
  '07002': ['Alayor'],
  '07005': ['Andraitx'],
  '07015': ['Ciudadela', 'Ciudadela de Menorca'],
  '07026': ['Ibiza'],
  '07032': ['Mahón'],
  '07037': ['Mercadal'],
  '07046': ['San Antonio Abad'],
  '07048': ['San José'],
  '07050': ['San Juan Bautista'],
  '07054': ['Santa Eulalia del Río'],
  '07057': ['Santañí'],
  '07064': ['Villacarlos'],
  '08125': ['Moncada y Reixach'],
  '08194': ['San Adrián de Besós'],
  '08196': ['San Andrés de la Barca'],
  '08200': ['San Baudilio de Llobregat'],
  '08240': ['San Sadurní de Noya'],
  '08266': ['Cerdañola del Vallés'],
  '08279': ['Tarrasa'],
  '08305': ['Villafranca del Panadés'],
  '08307': ['Villanueva y Geltrú'],
  '12135': ['Villarreal'],
  '12138': ['Vinaroz'],
  '15037': ['Finisterre'],
  '15057': ['Noya'],
  '15070': ['Puentes de García Rodríguez'],
  '15072': ['Rianjo'],
  '15078': ['Santiago'],
  '17015': ['Bañolas'],
  '17160': ['San Feliú de Guíxols'],
  '20036': ['Fuenterrabía'],
  '20064': ['Pasajes'],
  '20069': ['San Sebastián'],
  '20074': ['Vergara'],
  '20079': ['Zarauz'],
  '25120': ['Lérida'],
  '25203': ['Seo de Urgel'],
  '27051': ['Rivadeo'],
  '27065': ['Villalba'],
  '27066': ['Vivero'],
  '28115': ['Pozuelo'],
  '32009': ['El Barco de Valdeorras'],
  '32019': ['El Carballino'],
  '32032': ['Ginzo de Limia'],
  '33024': ['Xixón'],
  '36003': ['Bayona'],
  '36042': ['Puenteareas'],
  '36051': ['Sangenjo'],
  '46017': ['Alcira'],
  '46078': ['Burjasot'],
  '46145': ['Játiva'],
  '46147': ['Liria'],
  '46184': ['Onteniente'],
  '46205': ['Puzol'],
  '46244': ['Torrente'],
  '48003': ['Amorebieta'],
  '48036': ['Galdácano'],
  '48044': ['Guecho'],
  '48046': ['Guernica'],
  '48054': ['Lejona'],
  '48069': ['Munguía'],
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
  const alias = new Map(
    Object.entries(ALIAS).map(([codigo, nombres]) => [
      codigo,
      nombres.map(normalizar),
    ]),
  );
  const cacheTrigramas = new Map<string, Set<string>>();
  const trigramasDe = (clave: string) => {
    let cache = cacheTrigramas.get(clave);
    if (!cache) {
      cache = trigramas(clave);
      cacheTrigramas.set(clave, cache);
    }
    return cache;
  };

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
      const puntos = Math.max(
        ...[m.clave, ...(alias.get(m.codigoIne) ?? [])].map((clave) =>
          puntuar(clave, t, () => trigramasDe(clave), trigramasTermino),
        ),
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
