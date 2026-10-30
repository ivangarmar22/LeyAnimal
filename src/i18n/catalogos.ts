import { crearTraductor, type Mensajes, type Traductor } from './traductor';

/**
 * Catalogo completo, solo para la compilacion. Cada fichero aporta sus
 * espacios de nombres; si dos ficheros declaran el mismo, el build falla en
 * lugar de que uno pise al otro en silencio.
 */
const ficheros = import.meta.glob<Mensajes>('./mensajes/*.json', {
  eager: true,
  import: 'default',
});

const CATALOGO: Mensajes = {};
const origen: Record<string, string> = {};
for (const [ruta, contenido] of Object.entries(ficheros)) {
  for (const [espacio, valor] of Object.entries(contenido)) {
    if (espacio in CATALOGO) {
      throw new Error(
        `El espacio "${espacio}" esta en ${origen[espacio]} y en ${ruta}`,
      );
    }
    CATALOGO[espacio] = valor;
    origen[espacio] = ruta;
  }
}

export function traductor(espacio = ''): Traductor {
  return crearTraductor(CATALOGO, espacio);
}

/**
 * Textos que viajan a una isla: solo los espacios que necesita, no el
 * catalogo entero (paginas legales, metodologia...).
 */
export function textosPara(espacios: readonly string[]): Mensajes {
  const salida: Mensajes = {};
  for (const ruta of espacios) {
    const partes = ruta.split('.');
    let valor: Mensajes | string | string[] | undefined = CATALOGO;
    for (const parte of partes) {
      valor =
        valor && typeof valor === 'object' && !Array.isArray(valor)
          ? valor[parte]
          : undefined;
    }
    if (valor === undefined) throw new Error(`No existe el espacio "${ruta}"`);
    // 'inicio.hero' viaja como { inicio: { hero } }: la clave no cambia.
    let destino = salida;
    for (const parte of partes.slice(0, -1)) {
      const siguiente = destino[parte];
      destino = destino[parte] =
        siguiente && typeof siguiente === 'object' && !Array.isArray(siguiente)
          ? siguiente
          : {};
    }
    destino[partes.at(-1) ?? ''] = valor;
  }
  return salida;
}
