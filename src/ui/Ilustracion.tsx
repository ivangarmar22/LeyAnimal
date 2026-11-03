import type { IconoColor } from '@/lib/contenido/ilustraciones';
import { cn } from '@/lib/cn';
import { ruta } from '@/lib/rutas';

/**
 * Ilustracion a color (WebP de 128 px). El tamano lo pone la clase o el
 * contenedor; es decorativa salvo que lleve `etiqueta`.
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
