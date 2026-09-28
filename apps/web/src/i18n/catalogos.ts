import { IDIOMAS, type Idioma } from './idiomas';
import { crearTraductor, type Mensajes, type Traductor } from './traductor';

/**
 * Catalogos completos, solo para la compilacion. Cada fichero aporta sus
 * espacios de nombres; si dos ficheros declaran el mismo, el build falla en
 * lugar de que uno pise al otro en silencio.
 */
const ficheros = import.meta.glob<Mensajes>('./mensajes/*/*.json', {
  eager: true,
  import: 'default',
});

const CATALOGOS = Object.fromEntries(
  IDIOMAS.map((idioma) => {
    const catalogo: Mensajes = {};
    const origen: Record<string, string> = {};
    for (const [ruta, contenido] of Object.entries(ficheros)) {
      if (!ruta.startsWith(`./mensajes/${idioma}/`)) continue;
      for (const [espacio, valor] of Object.entries(contenido)) {
        if (espacio in catalogo) {
          throw new Error(
            `El espacio "${espacio}" esta en ${origen[espacio]} y en ${ruta} (${idioma})`,
          );
        }
        catalogo[espacio] = valor;
        origen[espacio] = ruta;
      }
    }
    return [idioma, catalogo];
  }),
) as Record<Idioma, Mensajes>;

export function traductor(idioma: Idioma, espacio = ''): Traductor {
  return crearTraductor(CATALOGOS[idioma], idioma, espacio);
}

/**
 * Textos que viajan a una isla: solo los espacios que necesita, no los
 * catalogos enteros (paginas legales, metodologia...).
 */
export function textosPara(
  idioma: Idioma,
  espacios: readonly string[],
): Mensajes {
  const salida: Mensajes = {};
  for (const ruta of espacios) {
    const partes = ruta.split('.');
    let origen: Mensajes | string | string[] | undefined = CATALOGOS[idioma];
    for (const parte of partes) {
      origen =
        origen && typeof origen === 'object' && !Array.isArray(origen)
          ? origen[parte]
          : undefined;
    }
    if (origen === undefined)
      throw new Error(`No existe el espacio "${ruta}" (${idioma})`);
    // 'inicio.hero' viaja como { inicio: { hero } }: la clave no cambia.
    let destino = salida;
    for (const parte of partes.slice(0, -1)) {
      const siguiente = destino[parte];
      destino = destino[parte] =
        siguiente && typeof siguiente === 'object' && !Array.isArray(siguiente)
          ? siguiente
          : {};
    }
    destino[partes.at(-1) ?? ''] = origen;
  }
  return salida;
}
