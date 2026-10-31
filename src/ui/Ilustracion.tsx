import type { IconoColor } from '@/lib/contenido/ilustraciones';
import { cn } from '@/lib/cn';
import { ruta } from '@/lib/rutas';

/**
 * Ilustracion a color (Fluent Emoji 3D), servida como WebP de 128 px: el
 * navegador la descarga una vez para todo el sitio y se ve nitida hasta 3x.
 * Cuadrada; el tamano lo pone la clase o el contenedor. Decorativa salvo que
 * lleve `etiqueta`. Sirve igual en las paginas .astro que en las islas.
 */
export function Ilustracion({
  icono,
  etiqueta,
  class: clase,
}: {
  icono: IconoColor;
  etiqueta?: string;
  class?: string;
}) {
  return (
    <img
      src={ruta(`/ilustraciones/${icono.nombre}.webp`)}
      alt={etiqueta ?? ''}
      width={32}
      height={32}
      decoding="async"
      class={cn('ilustracion', clase)}
    />
  );
}
