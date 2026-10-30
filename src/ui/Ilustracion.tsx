import type { IconoColor } from '@/lib/contenido/ilustraciones';
import { cn } from '@/lib/cn';

/**
 * Icono a color (Fluent Emoji Flat). Decorativo salvo que lleve `etiqueta`.
 * Sirve igual en las paginas .astro que en las islas.
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
    <svg
      viewBox={`0 0 ${icono.ancho} ${icono.alto}`}
      class={cn('ilustracion', clase)}
      role={etiqueta ? 'img' : undefined}
      aria-label={etiqueta}
      aria-hidden={etiqueta ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: icono.cuerpo }}
    />
  );
}
