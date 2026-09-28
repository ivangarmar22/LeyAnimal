import { formatear, type Valores } from './formato';
import { LOCALE, type Idioma } from './idiomas';

/**
 * Traductor sin dependencias, compartido por las paginas (en la compilacion)
 * y por las islas (en el navegador, con el subconjunto de textos que reciben).
 */
export type Mensajes = { [clave: string]: string | string[] | Mensajes };

export type Traductor = {
  (clave: string, valores?: Valores): string;
  /** True si la clave existe. Para textos que caen al dato en espanol. */
  has: (clave: string) => boolean;
  /** Valor sin formatear: listas de parrafos, por ejemplo. */
  raw: (clave: string) => unknown;
  /** Traductor limitado a un espacio de nombres: t.en('consulta')('titulo'). */
  en: (espacio: string) => Traductor;
  idioma: Idioma;
};

function buscar(mensajes: Mensajes, clave: string): unknown {
  let actual: unknown = mensajes;
  for (const parte of clave.split('.')) {
    if (actual === null || typeof actual !== 'object' || Array.isArray(actual))
      return undefined;
    actual = (actual as Mensajes)[parte];
  }
  return actual;
}

export function crearTraductor(
  mensajes: Mensajes,
  idioma: Idioma,
  espacio = '',
): Traductor {
  const completa = (clave: string) => (espacio ? `${espacio}.${clave}` : clave);

  const t = ((clave: string, valores?: Valores) => {
    const valor = buscar(mensajes, completa(clave));
    if (typeof valor !== 'string') {
      // En la compilacion una clave rota debe romper el build; en el
      // navegador se muestra la clave para no tumbar la isla entera.
      if (import.meta.env.SSR)
        throw new Error(`Falta el texto "${completa(clave)}" (${idioma})`);
      console.error(`Falta el texto "${completa(clave)}" (${idioma})`);
      return completa(clave);
    }
    return formatear(valor, valores, LOCALE[idioma]);
  }) as Traductor;

  t.has = (clave) => buscar(mensajes, completa(clave)) !== undefined;
  t.raw = (clave) => buscar(mensajes, completa(clave));
  t.en = (sub) => crearTraductor(mensajes, idioma, completa(sub));
  t.idioma = idioma;
  return t;
}
